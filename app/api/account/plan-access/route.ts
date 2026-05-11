import { NextResponse } from 'next/server';

import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { getUserPlanAccess } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

function getCurrentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function getUsageSummary({
  used,
  limit,
  warningThreshold
}: {
  used: number;
  limit: number;
  warningThreshold: number;
}) {
  const safeUsed = Math.max(0, used);
  const safeLimit = Math.max(0, limit);
  const remaining = Math.max(0, safeLimit - safeUsed);

  return {
    used: safeUsed,
    limit: safeLimit,
    remaining,
    isNearLimit: safeLimit > 0 && remaining > 0 && remaining <= warningThreshold,
    isLimitReached: safeLimit > 0 && remaining <= 0
  };
}

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
        canUseImages: false,

        tutorRequestsUsedLast24Hours: 0,
        tutorRequestsRemainingLast24Hours: 10,
        tutorRequestLimitWarning: false,
        tutorRequestLimitReached: false,

        imageUploadsUsedThisMonth: 0,
        imageUploadsRemainingThisMonth: 0,
        imageUploadLimitWarning: false,
        imageUploadLimitReached: false
      });
    }

    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: user.email || null
    });

    const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const currentMonthStart = getCurrentMonthStartIso();

    const [tutorUsageResult, imageUsageResult] = await Promise.all([
      supabase
        .from('learner_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', since24Hours),
      supabase
        .from('learner_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('has_image', true)
        .gte('created_at', currentMonthStart)
    ]);

    if (tutorUsageResult.error) {
      console.error('PLAN ACCESS TUTOR USAGE COUNT ERROR:', tutorUsageResult.error);
    }

    if (imageUsageResult.error) {
      console.error('PLAN ACCESS IMAGE USAGE COUNT ERROR:', imageUsageResult.error);
    }

    const tutorUsage = getUsageSummary({
      used: tutorUsageResult.count || 0,
      limit: planAccess.dailyTutorLimit,
      warningThreshold: planAccess.dailyTutorLimit <= 10 ? 2 : 10
    });

    const imageUsage = getUsageSummary({
      used: imageUsageResult.count || 0,
      limit: planAccess.imageUploadsPerMonth,
      warningThreshold: 10
    });

    return NextResponse.json({
      signedIn: true,
      email: user.email || null,
      plan: planAccess.plan,
      isPaidPlan: planAccess.isPaidPlan,
      hasActivePaidAccess: planAccess.hasActivePaidAccess,
      imageUploadsPerMonth: planAccess.imageUploadsPerMonth,
      dailyTutorLimit: planAccess.dailyTutorLimit,
      canUseImages: planAccess.imageUploadsPerMonth > 0 && planAccess.hasActivePaidAccess,

      tutorRequestsUsedLast24Hours: tutorUsage.used,
      tutorRequestsRemainingLast24Hours: tutorUsage.remaining,
      tutorRequestLimitWarning: tutorUsage.isNearLimit,
      tutorRequestLimitReached: tutorUsage.isLimitReached,

      imageUploadsUsedThisMonth: imageUsage.used,
      imageUploadsRemainingThisMonth: imageUsage.remaining,
      imageUploadLimitWarning: imageUsage.isNearLimit,
      imageUploadLimitReached: imageUsage.isLimitReached
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