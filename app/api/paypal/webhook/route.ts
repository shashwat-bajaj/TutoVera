import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import {
  getPayPalSubscription,
  getPlanFromPayPalPlanId,
  mapPayPalStatus,
  verifyPayPalWebhookSignature
} from '@/lib/paypal';

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    plan_id?: string;
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
  email: string;
  user_id: string | null;
};

function getHeader(request: Request, name: string) {
  return request.headers.get(name) || '';
}

function getAppStatusFromWebhook({
  eventType,
  paypalStatus
}: {
  eventType: string;
  paypalStatus: string;
}) {
  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
    return 'past_due';
  }

  if (
    eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
    eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
  ) {
    return 'inactive';
  }

  return mapPayPalStatus(paypalStatus);
}

function getAppPlan({
  status,
  plan
}: {
  status: string;
  plan: 'plus' | 'pro';
}) {
  if (status === 'active' || status === 'pending' || status === 'past_due' || status === 'suspended') {
    return plan;
  }

  return 'free';
}

export async function POST(request: Request) {
  try {
    const event = (await request.json()) as PayPalWebhookEvent;

    const transmissionId = getHeader(request, 'paypal-transmission-id');
    const transmissionTime = getHeader(request, 'paypal-transmission-time');
    const certUrl = getHeader(request, 'paypal-cert-url');
    const authAlgo = getHeader(request, 'paypal-auth-algo');
    const transmissionSig = getHeader(request, 'paypal-transmission-sig');

    const verified = await verifyPayPalWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookEvent: event
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'PayPal webhook signature verification failed.' },
        { status: 401 }
      );
    }

    const eventType = event.event_type || '';
    const resourceSubscriptionId = event.resource?.id || '';

    if (!resourceSubscriptionId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Missing subscription ID.' });
    }

    const subscription = await getPayPalSubscription(resourceSubscriptionId);
    const paypalPlanId = subscription.plan_id || event.resource?.plan_id || '';
    const planInfo = getPlanFromPayPalPlanId(paypalPlanId);

    if (!planInfo || (planInfo.plan !== 'plus' && planInfo.plan !== 'pro')) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: 'Unknown PayPal plan ID.'
      });
    }

    const paypalStatus = subscription.status || event.resource?.status || 'UNKNOWN';
    const status = getAppStatusFromWebhook({ eventType, paypalStatus });
    const plan = getAppPlan({ status, plan: planInfo.plan });

    const supabase = createAdminSupabase();

    const { data: existingSubscription, error: existingError } = await supabase
      .from('subscriptions')
      .select('id, email, user_id')
      .eq('paypal_subscription_id', subscription.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const updatePayload = {
      plan,
      billing_cycle: planInfo.billingCycle,
      status,
      paypal_plan_id: paypalPlanId,
      paypal_status: paypalStatus,
      paypal_payer_id:
        subscription.subscriber?.payer_id || event.resource?.subscriber?.payer_id || null,
      current_period_start: subscription.billing_info?.last_payment?.time || null,
      current_period_end: subscription.billing_info?.next_billing_time || null,
      cancel_at_period_end:
        eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
        eventType === 'BILLING.SUBSCRIPTION.EXPIRED',
      updated_at: new Date().toISOString()
    };

    if (existingSubscription) {
      const existing = existingSubscription as ExistingSubscriptionRecord;

      const { error } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        updated: true,
        subscriptionId: subscription.id,
        eventType,
        status,
        plan
      });
    }

    return NextResponse.json({
      ok: true,
      ignored: true,
      reason:
        'No local TutoVera subscription row exists yet for this PayPal subscription ID. Browser approval save should create it first.',
      subscriptionId: subscription.id,
      eventType
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to process PayPal webhook.'
      },
      { status: 500 }
    );
  }
}