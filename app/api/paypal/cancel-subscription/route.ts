import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { cancelPayPalSubscription } from '@/lib/paypal';
import { getUserPlanAccess } from '@/lib/subscriptions';

export async function POST() {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Please sign in before cancelling.' }, { status: 401 });
    }

    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: user.email
    });

    const subscription = planAccess.subscription;

    if (!subscription?.id || !subscription.paypal_subscription_id) {
      return NextResponse.json(
        { error: 'No active PayPal subscription was found for this account.' },
        { status: 404 }
      );
    }

    if (!planAccess.hasActivePaidAccess) {
      return NextResponse.json(
        { error: 'This account does not currently have active paid access.' },
        { status: 400 }
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
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to cancel PayPal subscription.'
      },
      { status: 500 }
    );
  }
}