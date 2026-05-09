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

  billing_provider: string | null;
  billing_mode: string | null;

  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  paypal_status: string | null;

  paypal_payment_token_id: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;

  current_period_end: string | null;
  next_renewal_at: string | null;

  cancel_at_period_end: boolean | null;
  cancelled_at: string | null;
  updated_at: string | null;
};

export type PlanAccessSummary = {
  plan: PlanKey;
  status: SubscriptionStatus;
  billingCycle: string | null;

  billingProvider: string | null;
  billingMode: string | null;

  paypalStatus: string | null;
  currentPeriodEnd: string | null;
  nextRenewalAt: string | null;

  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;

  isPaidPlan: boolean;
  hasActivePaidAccess: boolean;

  isExpandedPayPalBilling: boolean;
  isLegacyPayPalSubscription: boolean;
  canCancelSubscription: boolean;

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

const SUBSCRIPTION_SELECT = [
  'id',
  'user_id',
  'email',
  'plan',
  'billing_cycle',
  'status',
  'billing_provider',
  'billing_mode',
  'paypal_subscription_id',
  'paypal_plan_id',
  'paypal_status',
  'paypal_payment_token_id',
  'paypal_order_id',
  'paypal_capture_id',
  'current_period_end',
  'next_renewal_at',
  'cancel_at_period_end',
  'cancelled_at',
  'updated_at'
].join(', ');

export function normalizePlan(value: string | null | undefined): PlanKey {
  if (value === 'plus' || value === 'pro') return value;
  return 'free';
}

export function statusAllowsPaidAccess(status: string | null | undefined) {
  return status === 'active' || status === 'pending' || status === 'past_due';
}

export function isExpandedPayPalBillingMode(
  subscription: SubscriptionRecord | null | undefined
) {
  const billingMode = subscription?.billing_mode || '';

  return (
    billingMode.startsWith('paypal_expanded') ||
    Boolean(subscription?.paypal_payment_token_id) ||
    Boolean(subscription?.paypal_order_id) ||
    Boolean(subscription?.paypal_capture_id)
  );
}

export function isLegacyPayPalSubscriptionMode(
  subscription: SubscriptionRecord | null | undefined
) {
  return Boolean(subscription?.paypal_subscription_id);
}

export function getPlanAccessFromSubscription(
  subscription: SubscriptionRecord | null | undefined
): PlanAccessSummary {
  const rawPlan = normalizePlan(subscription?.plan);
  const hasActivePaidAccess =
    rawPlan !== 'free' && statusAllowsPaidAccess(subscription?.status);

  const plan: PlanKey = hasActivePaidAccess ? rawPlan : 'free';
  const isExpandedPayPalBilling = isExpandedPayPalBillingMode(subscription);
  const isLegacyPayPalSubscription = isLegacyPayPalSubscriptionMode(subscription);
  const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);

  const canCancelSubscription =
    hasActivePaidAccess &&
    !cancelAtPeriodEnd &&
    (isExpandedPayPalBilling || isLegacyPayPalSubscription);

  return {
    plan,
    status: subscription?.status || 'inactive',
    billingCycle: subscription?.billing_cycle || null,

    billingProvider: subscription?.billing_provider || null,
    billingMode: subscription?.billing_mode || null,

    paypalStatus: subscription?.paypal_status || null,
    currentPeriodEnd: subscription?.current_period_end || null,
    nextRenewalAt: subscription?.next_renewal_at || null,

    cancelAtPeriodEnd,
    cancelledAt: subscription?.cancelled_at || null,

    isPaidPlan: plan === 'plus' || plan === 'pro',
    hasActivePaidAccess,

    isExpandedPayPalBilling,
    isLegacyPayPalSubscription,
    canCancelSubscription,

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
      .select(SUBSCRIPTION_SELECT)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return getPlanAccessFromSubscription(data as SubscriptionRecord);
    }
  }

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
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

export function formatPaymentStatus(value: string | null | undefined) {
  const normalized = (value || '').toUpperCase();

  if (!normalized) return 'Not connected';
  if (normalized === 'COMPLETED') return 'Active';
  if (normalized === 'VAULTED') return 'Payment method saved';
  if (normalized === 'CANCELLED_AT_PERIOD_END') return 'Renewal cancelled';
  if (normalized === 'CANCELLED') return 'Cancelled';
  if (normalized === 'SUSPENDED') return 'Suspended';
  if (normalized === 'VAULT_TOKEN_MISSING') return 'Payment method not saved';
  if (normalized === 'ACTIVE') return 'Active';
  if (normalized === 'APPROVED') return 'Approved';
  if (normalized === 'DECLINED') return 'Declined';
  if (normalized === 'FAILED') return 'Failed';

  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Not connected';
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
    if (planAccess.cancelAtPeriodEnd) {
      if (planAccess.currentPeriodEnd) {
        return `Your ${formatPlanName(
          planAccess.plan
        )} access is active and scheduled to end on ${formatDate(
          planAccess.currentPeriodEnd
        )}.`;
      }

      return `Your ${formatPlanName(
        planAccess.plan
      )} access is active and scheduled to end at the end of the current billing period.`;
    }

    return `Your ${formatPlanName(planAccess.plan)} access is active.`;
  }

  if (planAccess.subscription?.paypal_status === 'VAULT_TOKEN_MISSING') {
    return 'Your previous paid period ended because recurring billing could not be set up. You are currently on the Free plan.';
  }

  if (planAccess.subscription?.paypal_status === 'CANCELLED') {
    return 'Your previous paid plan has ended. You are currently on the Free plan.';
  }

  if (planAccess.subscription?.paypal_status === 'SUSPENDED') {
    return 'Your previous paid plan is suspended. You are currently on the Free plan.';
  }

  return 'You are currently on the Free plan.';
}