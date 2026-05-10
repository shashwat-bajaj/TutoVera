import { NextResponse } from 'next/server';

import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { getUserPlanAccess } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({
        signedIn: false,
        plan: 'free',
        isPaidPlan: false,
        hasActivePaidAccess: false,
        imageUploadsPerMonth: 0,
        dailyTutorLimit: 10,
        canUseImages: false
      });
    }

    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: user.email || null
    });

    return NextResponse.json({
      signedIn: true,
      email: user.email || null,
      plan: planAccess.plan,
      isPaidPlan: planAccess.isPaidPlan,
      hasActivePaidAccess: planAccess.hasActivePaidAccess,
      imageUploadsPerMonth: planAccess.imageUploadsPerMonth,
      dailyTutorLimit: planAccess.dailyTutorLimit,
      canUseImages: planAccess.imageUploadsPerMonth > 0 && planAccess.hasActivePaidAccess
    });
  } catch (error) {
    console.error('PLAN ACCESS API ERROR:', error);

    return NextResponse.json(
      {
        error: 'Could not load account plan access.'
      },
      { status: 500 }
    );
  }
}