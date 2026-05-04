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

function getHeader(request: Request, name: string) {
  return request.headers.get(name) || '';
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;

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
      return NextResponse.json({ ok: true, ignored: true });
    }

    const subscription = await getPayPalSubscription(resourceSubscriptionId);
    const paypalPlanId = subscription.plan_id || event.resource?.plan_id || '';
    const planInfo = getPlanFromPayPalPlanId(paypalPlanId);

    if (!planInfo) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Unknown PayPal plan ID.' });
    }

    const paypalStatus = subscription.status || event.resource?.status || 'UNKNOWN';
    let status = mapPayPalStatus(paypalStatus);

    if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      status = 'past_due';
    }

    if (
      eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
    ) {
      status = 'inactive';
    }

    const email =
      subscription.subscriber?.email_address || event.resource?.subscriber?.email_address || '';

    const supabase = createAdminSupabase();

    const payload = {
      email: email.toLowerCase(),
      plan:
        status === 'active' || status === 'pending' || status === 'past_due'
          ? planInfo.plan
          : 'free',
      billing_cycle: planInfo.billingCycle,
      status,
      paypal_subscription_id: subscription.id,
      paypal_plan_id: paypalPlanId,
      paypal_status: paypalStatus,
      paypal_payer_id: subscription.subscriber?.payer_id || event.resource?.subscriber?.payer_id || null,
      current_period_start: subscription.billing_info?.last_payment?.time || null,
      current_period_end: subscription.billing_info?.next_billing_time || null,
      cancel_at_period_end:
        eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.SUSPENDED',
      updated_at: new Date().toISOString()
    };

    if (!payload.email) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: payload.plan,
          billing_cycle: payload.billing_cycle,
          status: payload.status,
          paypal_plan_id: payload.paypal_plan_id,
          paypal_status: payload.paypal_status,
          paypal_payer_id: payload.paypal_payer_id,
          current_period_start: payload.current_period_start,
          current_period_end: payload.current_period_end,
          cancel_at_period_end: payload.cancel_at_period_end,
          updated_at: payload.updated_at
        })
        .eq('paypal_subscription_id', subscription.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from('subscriptions').upsert(payload, {
      onConflict: 'email'
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to process PayPal webhook.'
      },
      { status: 500 }
    );
  }
}