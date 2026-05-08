import { NextResponse } from 'next/server';

import {
  createPayPalExpandedOrder,
  getExpandedCheckoutPlan,
  type BillingCycle,
  type ExpandedPaymentSource,
  type PaidPlanKey
} from '@/lib/paypal';
import { getUserPlanAccess } from '@/lib/subscriptions';
import { getURL } from '@/lib/site-url';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

type CreateExpandedOrderBody = {
  plan?: PaidPlanKey;
  billingCycle?: BillingCycle;
  source?: ExpandedPaymentSource;
};

function isPaidPlan(value: unknown): value is PaidPlanKey {
  return value === 'plus' || value === 'pro';
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}

function isPaymentSource(value: unknown): value is ExpandedPaymentSource {
  return value === 'paypal' || value === 'card';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateExpandedOrderBody;

    const plan = body.plan;
    const billingCycle = body.billingCycle;
    const source = body.source || 'card';

    if (!isPaidPlan(plan)) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    if (!isBillingCycle(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    }

    if (!isPaymentSource(source)) {
      return NextResponse.json({ error: 'Invalid payment source.' }, { status: 400 });
    }

    if (source !== 'card') {
      return NextResponse.json(
        {
          error: 'TutoVera currently supports secure card checkout only.'
        },
        { status: 400 }
      );
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Please sign in before checking out.' }, { status: 401 });
    }

    const normalizedEmail = user.email.toLowerCase();
    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: normalizedEmail
    });

    if (planAccess.hasActivePaidAccess) {
      return NextResponse.json(
        {
          error:
            'Your account already has an active paid plan. Please use your Account page or contact support before changing plans.'
        },
        { status: 409 }
      );
    }

    const baseUrl = getURL().replace(/\/$/, '');
    const returnUrl = `${baseUrl}/pricing?checkout=approved`;
    const cancelUrl = `${baseUrl}/pricing?checkout=cancelled`;

    const { order, planConfig, requestBody } = await createPayPalExpandedOrder({
      plan,
      billingCycle,
      userId: user.id,
      email: normalizedEmail,
      source: 'card',
      returnUrl,
      cancelUrl
    });

    const confirmedPlan = getExpandedCheckoutPlan({ plan, billingCycle });

    if (
      confirmedPlan.amountCents !== planConfig.amountCents ||
      confirmedPlan.currency !== planConfig.currency
    ) {
      return NextResponse.json({ error: 'Plan configuration mismatch.' }, { status: 500 });
    }

    const { error } = await supabase.from('paypal_expanded_orders').insert({
      user_id: user.id,
      email: normalizedEmail,
      paypal_order_id: order.id,
      plan,
      billing_cycle: billingCycle,
      amount_cents: planConfig.amountCents,
      currency: planConfig.currency,
      status: 'created',
      paypal_status: order.status || null,
      raw_create_payload: {
        request: requestBody,
        response: order
      },
      updated_at: new Date().toISOString()
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: order.id,
      plan,
      billingCycle,
      amountCents: planConfig.amountCents,
      currency: planConfig.currency
    });
  } catch (error) {
    console.error('PAYPAL EXPANDED CREATE ORDER ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create secure card checkout order.'
      },
      { status: 500 }
    );
  }
}