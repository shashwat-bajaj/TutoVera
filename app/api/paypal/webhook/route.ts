import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import {
  getPayPalSubscription,
  getPlanFromPayPalPlanId,
  mapPayPalStatus,
  verifyPayPalWebhookSignature,
  type BillingCycle
} from '@/lib/paypal';
import type { PlanKey } from '@/lib/plans';

export const dynamic = 'force-dynamic';

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    plan_id?: string;
    billing_agreement_id?: string;
    subscriber?: {
      payer_id?: string;
      email_address?: string;
    };
    billing_info?: {
      last_payment?: {
        time?: string;
      };
      next_billing_time?: string;
    };
  };
};

type ExistingSubscriptionRecord = {
  id: string;
  user_id: string | null;
  email: string;
};

function getHeader(request: NextRequest, name: string) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || '';
}

function getSubscriptionIdFromEvent(event: PayPalWebhookEvent) {
  const eventType = event.event_type || '';
  const resource = event.resource || {};

  if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
    return resource.id || '';
  }

  if (eventType.startsWith('PAYMENT.SALE.')) {
    return resource.billing_agreement_id || '';
  }

  return resource.id || resource.billing_agreement_id || '';
}

function getWebhookStatusOverride(eventType: string) {
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      return 'inactive';

    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      return 'suspended';

    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
    case 'PAYMENT.SALE.REVERSED':
      return 'past_due';

    default:
      return '';
  }
}

async function markWebhookEvent({
  supabase,
  paypalEventId,
  status,
  errorMessage
}: {
  supabase: any;
  paypalEventId: string;
  status: 'processed' | 'ignored' | 'error';
  errorMessage?: string;
}) {
  await supabase
    .from('paypal_webhook_events')
    .update({
      processing_status: status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString()
    })
    .eq('paypal_event_id', paypalEventId);
}

async function getExistingSubscription({
  supabase,
  paypalSubscriptionId,
  email
}: {
  supabase: any;
  paypalSubscriptionId: string;
  email: string;
}): Promise<ExistingSubscriptionRecord | null> {
  if (paypalSubscriptionId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email')
      .eq('paypal_subscription_id', paypalSubscriptionId)
      .maybeSingle();

    if (data) {
      return data as ExistingSubscriptionRecord;
    }
  }

  if (email) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email')
      .eq('email', email)
      .maybeSingle();

    if (data) {
      return data as ExistingSubscriptionRecord;
    }
  }

  return null;
}

async function upsertSubscriptionFromPayPal({
  supabase,
  eventType,
  paypalSubscription
}: {
  supabase: any;
  eventType: string;
  paypalSubscription: Awaited<ReturnType<typeof getPayPalSubscription>>;
}) {
  const paypalSubscriptionId = paypalSubscription.id;
  const paypalPlanId = paypalSubscription.plan_id || '';
  const planMapping = getPlanFromPayPalPlanId(paypalPlanId);

  if (!paypalSubscriptionId) {
    return {
      ok: false,
      ignored: true,
      reason: 'Webhook subscription payload did not include a PayPal subscription ID.'
    };
  }

  if (!planMapping) {
    return {
      ok: false,
      ignored: true,
      reason: `PayPal plan ID is not configured in TutoVera: ${paypalPlanId || 'missing'}`
    };
  }

  const subscriberEmail = paypalSubscription.subscriber?.email_address?.trim().toLowerCase() || '';

  const existingSubscription = await getExistingSubscription({
    supabase,
    paypalSubscriptionId,
    email: subscriberEmail
  });

  const email = existingSubscription?.email || subscriberEmail;

  if (!email) {
    return {
      ok: false,
      ignored: true,
      reason: 'Webhook could not resolve an email for this PayPal subscription.'
    };
  }

  const paypalStatus = paypalSubscription.status || 'UNKNOWN';
  const overrideStatus = getWebhookStatusOverride(eventType);
  const status = overrideStatus || mapPayPalStatus(paypalStatus);

  const plan = planMapping.plan as PlanKey;
  const billingCycle = planMapping.billingCycle as BillingCycle;

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: existingSubscription?.user_id || null,
      email,
      plan,
      billing_cycle: billingCycle,
      status,
      paypal_subscription_id: paypalSubscriptionId,
      paypal_plan_id: paypalPlanId,
      paypal_status: paypalStatus,
      paypal_payer_id: paypalSubscription.subscriber?.payer_id || null,
      current_period_start: paypalSubscription.billing_info?.last_payment?.time || null,
      current_period_end: paypalSubscription.billing_info?.next_billing_time || null,
      cancel_at_period_end:
        eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
        eventType === 'BILLING.SUBSCRIPTION.EXPIRED',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'email' }
  );

  if (error) {
    return {
      ok: false,
      ignored: false,
      reason: error.message
    };
  }

  return {
    ok: true,
    ignored: false,
    reason: ''
  };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  let webhookEvent: PayPalWebhookEvent;

  try {
    webhookEvent = (await request.json()) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook JSON.' }, { status: 400 });
  }

  const paypalEventId = webhookEvent.id || '';
  const eventType = webhookEvent.event_type || '';
  const paypalResourceId = getSubscriptionIdFromEvent(webhookEvent);

  if (!paypalEventId || !eventType) {
    return NextResponse.json({ error: 'Missing PayPal webhook event ID or type.' }, { status: 400 });
  }

  const transmissionId = getHeader(request, 'paypal-transmission-id');
  const transmissionTime = getHeader(request, 'paypal-transmission-time');
  const certUrl = getHeader(request, 'paypal-cert-url');
  const authAlgo = getHeader(request, 'paypal-auth-algo');
  const transmissionSig = getHeader(request, 'paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'Missing PayPal webhook signature headers.' }, { status: 400 });
  }

  try {
    const isVerified = await verifyPayPalWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookEvent
    });

    if (!isVerified) {
      return NextResponse.json(
        { error: 'PayPal webhook signature verification failed.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PAYPAL WEBHOOK VERIFICATION ERROR:', error);

    return NextResponse.json(
      { error: 'PayPal webhook signature verification failed.' },
      { status: 400 }
    );
  }

  const { error: insertEventError } = await supabase.from('paypal_webhook_events').insert({
    paypal_event_id: paypalEventId,
    event_type: eventType,
    paypal_resource_id: paypalResourceId || null,
    payload: webhookEvent,
    processing_status: 'received'
  });

  if (insertEventError) {
    if (insertEventError.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    console.error('PAYPAL WEBHOOK EVENT INSERT ERROR:', insertEventError);

    return NextResponse.json(
      { error: 'Could not record PayPal webhook event.' },
      { status: 500 }
    );
  }

  if (!paypalResourceId) {
    await markWebhookEvent({
      supabase,
      paypalEventId,
      status: 'ignored',
      errorMessage: 'No PayPal subscription/resource ID was found for this event.'
    });

    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const paypalSubscription = await getPayPalSubscription(paypalResourceId);

    const result = await upsertSubscriptionFromPayPal({
      supabase,
      eventType,
      paypalSubscription
    });

    if (!result.ok && result.ignored) {
      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: 'ignored',
        errorMessage: result.reason
      });

      return NextResponse.json({ ok: true, ignored: true, reason: result.reason });
    }

    if (!result.ok) {
      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: 'error',
        errorMessage: result.reason
      });

      return NextResponse.json(
        { error: 'Could not process PayPal webhook event.' },
        { status: 500 }
      );
    }

    await markWebhookEvent({
      supabase,
      paypalEventId,
      status: 'processed'
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown PayPal webhook processing error.';

    console.error('PAYPAL WEBHOOK PROCESSING ERROR:', error);

    await markWebhookEvent({
      supabase,
      paypalEventId,
      status: 'error',
      errorMessage: message
    });

    return NextResponse.json(
      { error: 'Could not process PayPal webhook event.' },
      { status: 500 }
    );
  }
}