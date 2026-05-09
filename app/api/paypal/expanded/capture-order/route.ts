import { NextResponse } from 'next/server';

import {
  capturePayPalExpandedOrder,
  extractCardSummary,
  extractPayPalCaptureId,
  extractPayPalCaptureStatus,
  extractPayPalPayerId,
  extractPayPalVaultTokenId,
  getNextRenewalDate,
  type BillingCycle,
  type PaidPlanKey
} from '@/lib/paypal';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

type CaptureExpandedOrderBody = {
  orderId?: string;
};

type ExpandedOrderRecord = {
  id: string;
  user_id: string | null;
  email: string;
  paypal_order_id: string;
  plan: string;
  billing_cycle: string;
  amount_cents: number;
  currency: string;
  status: string;
};

function normalizePaidPlan(value: string): PaidPlanKey | null {
  if (value === 'plus' || value === 'pro') return value;
  return null;
}

function normalizeBillingCycle(value: string): BillingCycle | null {
  if (value === 'monthly' || value === 'annual') return value;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CaptureExpandedOrderBody;
    const orderId = (body.orderId || '').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing PayPal order ID.' }, { status: 400 });
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: 'Please sign in before completing checkout.' },
        { status: 401 }
      );
    }

    const normalizedEmail = user.email.toLowerCase();
    const supabase = createAdminSupabase();

    const { data: orderRecord, error: orderError } = await supabase
      .from('paypal_expanded_orders')
      .select(
        'id, user_id, email, paypal_order_id, plan, billing_cycle, amount_cents, currency, status'
      )
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderRecord) {
      return NextResponse.json({ error: 'This PayPal order was not found.' }, { status: 404 });
    }

    const existingOrder = orderRecord as ExpandedOrderRecord;

    if (existingOrder.user_id !== user.id && existingOrder.email !== normalizedEmail) {
      return NextResponse.json(
        { error: 'This PayPal order does not belong to the signed-in account.' },
        { status: 403 }
      );
    }

    if (existingOrder.status === 'captured') {
      return NextResponse.json({ ok: true, alreadyCaptured: true });
    }

    const plan = normalizePaidPlan(existingOrder.plan);
    const billingCycle = normalizeBillingCycle(existingOrder.billing_cycle);

    if (!plan || !billingCycle) {
      return NextResponse.json({ error: 'Stored order has an invalid plan.' }, { status: 500 });
    }

    const capture = await capturePayPalExpandedOrder(orderId);
    const captureStatus = extractPayPalCaptureStatus(capture);
    const captureId = extractPayPalCaptureId(capture);
    const paymentTokenId = extractPayPalVaultTokenId(capture);
    const payerId = extractPayPalPayerId(capture);
    const cardSummary = extractCardSummary(capture);

    const normalizedCaptureStatus = captureStatus.toUpperCase();
    const now = new Date();

    const wasCaptured = Boolean(captureId) && normalizedCaptureStatus === 'COMPLETED';

    if (!wasCaptured) {
      await supabase
        .from('paypal_expanded_orders')
        .update({
          paypal_capture_id: captureId || null,
          paypal_payment_token_id: paymentTokenId || null,
          status:
            normalizedCaptureStatus === 'DECLINED' ||
            normalizedCaptureStatus === 'FAILED' ||
            normalizedCaptureStatus === 'DENIED'
              ? 'capture_failed'
              : 'capture_pending',
          paypal_status: captureStatus || capture.status || null,
          raw_capture_payload: capture,
          updated_at: now.toISOString()
        })
        .eq('id', existingOrder.id);

      await supabase.from('billing_events').insert({
        user_id: user.id,
        email: normalizedEmail,
        event_type:
          normalizedCaptureStatus === 'DECLINED' ||
          normalizedCaptureStatus === 'FAILED' ||
          normalizedCaptureStatus === 'DENIED'
            ? 'expanded_checkout_capture_failed'
            : 'expanded_checkout_capture_pending',
        plan,
        billing_cycle: billingCycle,
        amount_cents: existingOrder.amount_cents,
        currency: existingOrder.currency || 'USD',
        status:
          normalizedCaptureStatus === 'DECLINED' ||
          normalizedCaptureStatus === 'FAILED' ||
          normalizedCaptureStatus === 'DENIED'
            ? 'failed'
            : 'pending',
        paypal_order_id: orderId,
        paypal_capture_id: captureId || null,
        paypal_payment_token_id: paymentTokenId || null,
        error_message: `PayPal capture status was ${captureStatus || capture.status || 'unknown'}.`,
        metadata: capture
      });

      return NextResponse.json(
        {
          error:
            normalizedCaptureStatus === 'DECLINED'
              ? 'PayPal declined this card payment. Please try another sandbox test card.'
              : 'PayPal did not mark this card payment as completed yet. Please try again or contact support.'
        },
        { status: 400 }
      );
    }

    const nextRenewalAt = getNextRenewalDate({
      from: now,
      billingCycle
    });

    await supabase
      .from('paypal_expanded_orders')
      .update({
        paypal_capture_id: captureId || null,
        paypal_payment_token_id: paymentTokenId || null,
        status: paymentTokenId ? 'captured' : 'captured_waiting_for_vault',
        paypal_status: captureStatus || capture.status || null,
        raw_capture_payload: capture,
        captured_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', existingOrder.id);

    if (paymentTokenId) {
      await supabase.from('paypal_payment_methods').upsert(
        {
          user_id: user.id,
          email: normalizedEmail,
          paypal_payment_token_id: paymentTokenId,
          payment_source: capture.payment_source?.card ? 'card' : 'paypal',
          payer_id: payerId || null,
          brand: cardSummary.brand,
          last_digits: cardSummary.lastDigits,
          expiry_month: cardSummary.expiryMonth,
          expiry_year: cardSummary.expiryYear,
          status: 'active',
          raw_payload: capture,
          updated_at: now.toISOString()
        },
        { onConflict: 'paypal_payment_token_id' }
      );
    }

    const { error: subscriptionError } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        email: normalizedEmail,
        plan,
        billing_cycle: billingCycle,
        status: 'active',
        billing_provider: 'paypal',
        billing_mode: paymentTokenId
          ? 'paypal_expanded_recurring'
          : 'paypal_expanded_waiting_for_vault',
        paypal_subscription_id: null,
        paypal_plan_id: null,
        paypal_status: captureStatus || capture.status || 'COMPLETED',
        paypal_payer_id: payerId || null,
        paypal_order_id: orderId,
        paypal_capture_id: captureId || null,
        paypal_payment_token_id: paymentTokenId || null,
        current_period_start: now.toISOString(),
        current_period_end: nextRenewalAt.toISOString(),
        next_renewal_at: nextRenewalAt.toISOString(),
        last_renewal_at: null,
        renewal_attempt_count: 0,
        cancel_at_period_end: false,
        cancelled_at: null,
        updated_at: now.toISOString()
      },
      { onConflict: 'email' }
    );

    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }

    await supabase.from('billing_events').insert({
      user_id: user.id,
      email: normalizedEmail,
      event_type: paymentTokenId
        ? 'expanded_checkout_captured'
        : 'expanded_checkout_captured_waiting_for_vault',
      plan,
      billing_cycle: billingCycle,
      amount_cents: existingOrder.amount_cents,
      currency: existingOrder.currency || 'USD',
      status: 'recorded',
      paypal_order_id: orderId,
      paypal_capture_id: captureId || null,
      paypal_payment_token_id: paymentTokenId || null,
      metadata: capture
    });

    return NextResponse.json({
      ok: true,
      plan,
      billingCycle,
      status: 'active',
      paypalOrderId: orderId,
      paypalCaptureId: captureId || null,
      hasPaymentToken: Boolean(paymentTokenId),
      nextRenewalAt: nextRenewalAt.toISOString()
    });
  } catch (error) {
    console.error('PAYPAL EXPANDED CAPTURE ORDER ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to capture PayPal checkout order.'
      },
      { status: 500 }
    );
  }
}