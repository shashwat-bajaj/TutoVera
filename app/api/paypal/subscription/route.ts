import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import {
  cancelPayPalSubscription,
  getConfiguredPayPalPlanIds,
  getPayPalSubscription,
  mapPayPalStatus,
  type BillingCycle
} from '@/lib/paypal';
import type { PlanKey } from '@/lib/plans';

type SubscriptionRequestBody = {
  subscriptionId?: string;
  plan?: PlanKey;
  billingCycle?: BillingCycle;
  paypalPlanId?: string;
};

type ExistingSubscriptionRecord = {
  id: string;
  user_id: string | null;
  email: string;
  plan: string;
  status: string;
  paypal_subscription_id: string | null;
};

function expectedPlanId(plan: PlanKey, billingCycle: BillingCycle) {
  if (plan !== 'plus' && plan !== 'pro') return '';

  const configuredPlanIds = getConfiguredPayPalPlanIds();
  return configuredPlanIds[plan][billingCycle];
}

function isBlockingExistingSubscription(subscription: ExistingSubscriptionRecord | null) {
  if (!subscription) return false;
  if (subscription.plan !== 'plus' && subscription.plan !== 'pro') return false;

  return ['active', 'pending', 'past_due', 'suspended'].includes(subscription.status);
}

async function getExistingSubscription({
  supabase,
  userId,
  email
}: {
  supabase: any;
  userId: string;
  email: string;
}) {
  const { data: byUser } = await supabase
    .from('subscriptions')
    .select('id, user_id, email, plan, status, paypal_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (byUser) {
    return byUser as ExistingSubscriptionRecord;
  }

  const { data: byEmail } = await supabase
    .from('subscriptions')
    .select('id, user_id, email, plan, status, paypal_subscription_id')
    .eq('email', email)
    .maybeSingle();

  if (byEmail) {
    return byEmail as ExistingSubscriptionRecord;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscriptionRequestBody;

    const subscriptionId = (body.subscriptionId || '').trim();
    const plan = body.plan;
    const billingCycle = body.billingCycle;
    const paypalPlanId = (body.paypalPlanId || '').trim();

    if (!subscriptionId || !plan || !billingCycle || !paypalPlanId) {
      return NextResponse.json({ error: 'Missing subscription details.' }, { status: 400 });
    }

    if (plan !== 'plus' && plan !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    const configuredPlanId = expectedPlanId(plan, billingCycle);

    if (!configuredPlanId || configuredPlanId !== paypalPlanId) {
      return NextResponse.json(
        { error: 'PayPal plan ID does not match the selected TutoVera plan.' },
        { status: 400 }
      );
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Please sign in before subscribing.' }, { status: 401 });
    }

    const normalizedEmail = user.email.toLowerCase();
    const supabase = createAdminSupabase();

    const paypalSubscription = await getPayPalSubscription(subscriptionId);

    if (paypalSubscription.plan_id !== paypalPlanId) {
      return NextResponse.json(
        { error: 'PayPal subscription plan does not match the selected plan.' },
        { status: 400 }
      );
    }

    const existingSubscription = await getExistingSubscription({
      supabase,
      userId: user.id,
      email: normalizedEmail
    });

    const isDifferentSubscription =
      existingSubscription?.paypal_subscription_id &&
      existingSubscription.paypal_subscription_id !== paypalSubscription.id;

    const hasBlockingSubscription = isBlockingExistingSubscription(existingSubscription);

    if (hasBlockingSubscription && isDifferentSubscription) {
      try {
        await cancelPayPalSubscription({
          subscriptionId: paypalSubscription.id,
          reason:
            'Duplicate subscription cancelled because this TutoVera account already has an active paid plan.'
        });
      } catch (cancelError) {
        console.error('DUPLICATE PAYPAL SUBSCRIPTION CANCEL ERROR:', cancelError);
      }

      return NextResponse.json(
        {
          error:
            'Your account already has an active TutoVera subscription. The duplicate PayPal subscription attempt was blocked. Please use your Account page or contact support to change plans.'
        },
        { status: 409 }
      );
    }

    if (hasBlockingSubscription && !existingSubscription?.paypal_subscription_id) {
      try {
        await cancelPayPalSubscription({
          subscriptionId: paypalSubscription.id,
          reason:
            'Duplicate subscription cancelled because this TutoVera account already has active paid access.'
        });
      } catch (cancelError) {
        console.error('DUPLICATE PAYPAL SUBSCRIPTION CANCEL ERROR:', cancelError);
      }

      return NextResponse.json(
        {
          error:
            'Your account already has active paid access. Please contact support before creating a new PayPal subscription.'
        },
        { status: 409 }
      );
    }

    const paypalStatus = paypalSubscription.status || 'UNKNOWN';
    const status = mapPayPalStatus(paypalStatus);

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        email: normalizedEmail,
        plan,
        billing_cycle: billingCycle,
        status,
        paypal_subscription_id: paypalSubscription.id,
        paypal_plan_id: paypalSubscription.plan_id,
        paypal_status: paypalStatus,
        paypal_payer_id: paypalSubscription.subscriber?.payer_id || null,
        current_period_start: paypalSubscription.billing_info?.last_payment?.time || null,
        current_period_end: paypalSubscription.billing_info?.next_billing_time || null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'email' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      plan,
      billingCycle,
      status
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to save PayPal subscription.'
      },
      { status: 500 }
    );
  }
}