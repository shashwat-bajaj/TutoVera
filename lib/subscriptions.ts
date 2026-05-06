import type { PlanKey } from '@/lib/plans';

export type SubscriptionStatus =
  | 'active'
  | 'pending'
  | 'past_due'
  | 'suspended'
  | 'inactive'
  | string;

export type SubscriptionRecord = {
  id: string;
  user_id: string | null;
  email: string;
  plan: PlanKey | string;
  billing_cycle: string | null;
  status: SubscriptionStatus;
  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  paypal_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  updated_at: string | null;
};

export type PlanAccessSummary = {
  plan: PlanKey;
  status: SubscriptionStatus;
  billingCycle: string | null;
  paypalStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPaidPlan: boolean;
  hasActivePaidAccess: boolean;
  dailyTutorLimit: number;
  imageUploadsPerMonth: number;
  savedHistoryLabel: string;
  subscription: SubscriptionRecord | null;
};

export const DAILY_TUTOR_LIMITS: Record<PlanKey, number> = {
  free: 10,
  plus: 100,
  pro: 300
};

export const IMAGE_UPLOAD_LIMITS: Record<PlanKey, number> = {
  free: 0,
  plus: 100,
  pro: 500
};

export const SAVED_HISTORY_LABELS: Record<PlanKey, string> = {
  free: 'Basic history',
  plus: 'Extended history',
  pro: 'Highest history allowance'
};

export function normalizePlan(value: string | null | undefined): PlanKey {
  if (value === 'plus' || value === 'pro') return value;
  return 'free';
}

export function statusAllowsPaidAccess(status: string | null | undefined) {
  return status === 'active' || status === 'pending' || status === 'past_due';
}

export function getPlanAccessFromSubscription(
  subscription: SubscriptionRecord | null | undefined
): PlanAccessSummary {
  const rawPlan = normalizePlan(subscription?.plan);
  const hasActivePaidAccess =
    rawPlan !== 'free' && statusAllowsPaidAccess(subscription?.status);

  const plan: PlanKey = hasActivePaidAccess ? rawPlan : 'free';

  return {
    plan,
    status: subscription?.status || 'inactive',
    billingCycle: subscription?.billing_cycle || null,
    paypalStatus: subscription?.paypal_status || null,
    currentPeriodEnd: subscription?.current_period_end || null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    isPaidPlan: plan === 'plus' || plan === 'pro',
    hasActivePaidAccess,
    dailyTutorLimit: DAILY_TUTOR_LIMITS[plan],
    imageUploadsPerMonth: IMAGE_UPLOAD_LIMITS[plan],
    savedHistoryLabel: SAVED_HISTORY_LABELS[plan],
    subscription: subscription || null
  };
}

export async function getUserPlanAccess({
  supabase,
  userId,
  email
}: {
  supabase: any;
  userId?: string | null;
  email?: string | null;
}): Promise<PlanAccessSummary> {
  const normalizedEmail = email?.trim().toLowerCase() || null;

  if (!userId && !normalizedEmail) {
    return getPlanAccessFromSubscription(null);
  }

  if (userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id, user_id, email, plan, billing_cycle, status, paypal_subscription_id, paypal_plan_id, paypal_status, current_period_end, cancel_at_period_end, updated_at'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return getPlanAccessFromSubscription(data as SubscriptionRecord);
    }
  }

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'id, user_id, email, plan, billing_cycle, status, paypal_subscription_id, paypal_plan_id, paypal_status, current_period_end, cancel_at_period_end, updated_at'
      )
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!error && data) {
      return getPlanAccessFromSubscription(data as SubscriptionRecord);
    }
  }

  return getPlanAccessFromSubscription(null);
}

export function formatPlanName(plan: PlanKey) {
  if (plan === 'plus') return 'Plus';
  if (plan === 'pro') return 'Pro';
  return 'Free';
}

export function formatBillingCycle(value: string | null | undefined) {
  if (value === 'monthly') return 'Monthly';
  if (value === 'annual') return 'Annual';
  return 'Not active';
}

export function formatSubscriptionStatus(value: string | null | undefined) {
  if (value === 'active') return 'Active';
  if (value === 'pending') return 'Pending';
  if (value === 'past_due') return 'Past due';
  if (value === 'suspended') return 'Suspended';
  if (value === 'inactive') return 'Inactive';

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Inactive';
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not available';

  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getPlanSummarySentence(planAccess: PlanAccessSummary) {
  if (planAccess.hasActivePaidAccess) {
    if (planAccess.cancelAtPeriodEnd && planAccess.currentPeriodEnd) {
      return `Your ${formatPlanName(planAccess.plan)} access is active and scheduled to end on ${formatDate(
        planAccess.currentPeriodEnd
      )}.`;
    }

    return `Your ${formatPlanName(planAccess.plan)} access is active.`;
  }

  if (planAccess.subscription?.paypal_status === 'CANCELLED') {
    return 'Your previous PayPal subscription has been cancelled. You are currently on the Free plan.';
  }

  if (planAccess.subscription?.paypal_status === 'SUSPENDED') {
    return 'Your previous PayPal subscription is suspended. You are currently on the Free plan.';
  }

  return 'You are currently on the Free plan.';
}