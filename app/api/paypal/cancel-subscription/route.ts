import { NextResponse } from 'next/server';

import { cancelPayPalSubscription } from '@/lib/paypal';
import { getUserPlanAccess } from '@/lib/subscriptions';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: 'Please sign in before cancelling.' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: user.email
    });

    const subscription = planAccess.subscription;

    if (!subscription?.id) {
      return NextResponse.json(
        { error: 'No active subscription was found for this account.' },
        { status: 404 }
      );
    }

    if (!planAccess.hasActivePaidAccess) {
      return NextResponse.json(
        { error: 'This account does not currently have active paid access.' },
        { status: 400 }
      );
    }

    if (subscription.cancel_at_period_end) {
      return NextResponse.json({
        ok: true,
        alreadyScheduled: true,
        message:
          'This subscription is already scheduled to end at the end of the current billing period.'
      });
    }

    const now = new Date().toISOString();

    if (planAccess.isExpandedPayPalBilling) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: now,
          paypal_status: 'CANCELLED_AT_PERIOD_END',
          updated_at: now
        })
        .eq('id', subscription.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { error: eventError } = await supabase.from('billing_events').insert({
        user_id: user.id,
        email: user.email.toLowerCase(),
        subscription_id: subscription.id,
        provider: 'paypal',
        event_type: 'paypal_expanded_cancellation_scheduled',
        plan: subscription.plan,
        billing_cycle: subscription.billing_cycle,
        amount_cents: null,
        currency: 'USD',
        status: 'scheduled',
        paypal_order_id: subscription.paypal_order_id || null,
        paypal_capture_id: subscription.paypal_capture_id || null,
        paypal_payment_token_id: subscription.paypal_payment_token_id || null,
        metadata: {
          billing_mode: subscription.billing_mode,
          current_period_end: subscription.current_period_end,
          next_renewal_at: subscription.next_renewal_at,
          cancelled_at: now
        }
      });

      if (eventError) {
        console.warn('Failed to record expanded cancellation event:', eventError.message);
      }

      return NextResponse.json({
        ok: true,
        cancellationMode: 'period_end',
        currentPeriodEnd: subscription.current_period_end,
        message:
          'Your subscription renewal has been cancelled. Your paid access remains active until the end of the current billing period.'
      });
    }

    if (!subscription.paypal_subscription_id) {
      return NextResponse.json(
        { error: 'No cancellable PayPal subscription was found for this account.' },
        { status: 404 }
      );
    }

    await cancelPayPalSubscription({
      subscriptionId: subscription.paypal_subscription_id,
      reason: 'User requested cancellation from TutoVera account.'
    });

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: 'free',
        status: 'inactive',
        paypal_status: 'CANCELLED',
        cancel_at_period_end: true,
        cancelled_at: now,
        updated_at: now
      })
      .eq('id', subscription.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: eventError } = await supabase.from('billing_events').insert({
      user_id: user.id,
      email: user.email.toLowerCase(),
      subscription_id: subscription.id,
      provider: 'paypal',
      event_type: 'paypal_legacy_subscription_cancelled',
      plan: subscription.plan,
      billing_cycle: subscription.billing_cycle,
      amount_cents: null,
      currency: 'USD',
      status: 'cancelled',
      paypal_order_id: null,
      paypal_capture_id: null,
      paypal_payment_token_id: null,
      metadata: {
        paypal_subscription_id: subscription.paypal_subscription_id,
        cancelled_at: now
      }
    });

    if (eventError) {
      console.warn('Failed to record legacy cancellation event:', eventError.message);
    }

    return NextResponse.json({
      ok: true,
      cancellationMode: 'immediate',
      message: 'Your PayPal subscription has been cancelled.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to cancel PayPal subscription.'
      },
      { status: 500 }
    );
  }
}