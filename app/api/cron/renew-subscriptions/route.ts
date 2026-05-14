import crypto from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import {
  createPayPalRenewalOrder,
  type PayPalRenewalPaymentSourceType
} from '@/lib/paypal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BillingInterval = 'monthly' | 'annual';
type PaidPlan = 'plus' | 'pro';

type DueSubscription = {
  id: string;
  user_id: string | null;
  email: string | null;
  plan: string | null;
  billing_cycle: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_renewal_at: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paypal_payment_token_id: string | null;
  renewal_attempt_count: number | null;
};

type ExpiringSubscription = {
  id: string;
  user_id: string | null;
  email: string | null;
  plan: string | null;
  billing_cycle: string | null;
  status: string | null;
  billing_provider: string | null;
  billing_mode: string | null;
  paypal_status: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  paypal_payment_token_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_renewal_at: string | null;
  cancel_at_period_end: boolean | null;
  cancelled_at: string | null;
};

type RenewalResult = {
  subscriptionId: string;
  userId: string | null;
  result: 'renewed' | 'failed' | 'skipped';
  message?: string;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
};

type ExpirationResult = {
  subscriptionId: string;
  userId: string | null;
  result: 'expired' | 'failed' | 'skipped';
  message?: string;
};

const MAX_RENEWALS_PER_RUN = 10;
const MAX_EXPIRATIONS_PER_RUN = 50;
const MAX_WAITING_VAULT_EXPIRATIONS_PER_RUN = 50;
const RETRY_DELAY_MS = 24 * 60 * 60 * 1000;
const MAX_RENEWAL_ATTEMPTS = 3;

const DUE_SUBSCRIPTION_SELECT = [
  'id',
  'user_id',
  'email',
  'plan',
  'billing_cycle',
  'status',
  'current_period_start',
  'current_period_end',
  'next_renewal_at',
  'paypal_order_id',
  'paypal_capture_id',
  'paypal_payment_token_id',
  'renewal_attempt_count'
].join(',');

const EXPIRING_SUBSCRIPTION_SELECT = [
  'id',
  'user_id',
  'email',
  'plan',
  'billing_cycle',
  'status',
  'billing_provider',
  'billing_mode',
  'paypal_status',
  'paypal_order_id',
  'paypal_capture_id',
  'paypal_payment_token_id',
  'current_period_start',
  'current_period_end',
  'next_renewal_at',
  'cancel_at_period_end',
  'cancelled_at'
].join(',');

function createSupabaseAdmin(): any {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as any;
}

function normalizeDueSubscription(row: unknown): DueSubscription {
  return row as unknown as DueSubscription;
}

function normalizeExpiringSubscription(row: unknown): ExpiringSubscription {
  return row as unknown as ExpiringSubscription;
}

function normalizePlan(planValue: string | null): PaidPlan {
  const value = String(planValue || '').toLowerCase();

  if (value.includes('pro')) return 'pro';
  if (value.includes('plus')) return 'plus';

  throw new Error(`Unsupported paid plan: ${planValue || 'missing'}`);
}

function isPaidPlanValue(planValue: string | null | undefined) {
  const value = String(planValue || '').toLowerCase();

  return value === 'plus' || value === 'pro';
}

function isExpandedPayPalRecord(subscription: ExpiringSubscription) {
  const billingMode = subscription.billing_mode || '';

  return billingMode.startsWith('paypal_expanded') || Boolean(subscription.paypal_payment_token_id);
}

function inferBillingInterval(subscription: DueSubscription): BillingInterval {
  if (subscription.billing_cycle === 'annual') return 'annual';
  if (subscription.billing_cycle === 'monthly') return 'monthly';

  const planValue = String(subscription.plan || '').toLowerCase();

  if (
    planValue.includes('annual') ||
    planValue.includes('yearly') ||
    planValue.includes('year')
  ) {
    return 'annual';
  }

  if (planValue.includes('monthly') || planValue.includes('month')) {
    return 'monthly';
  }

  const startDateValue = subscription.current_period_start;
  const endDateValue = subscription.current_period_end || subscription.next_renewal_at;

  if (!startDateValue || !endDateValue) {
    throw new Error(
      'Unable to determine billing interval safely because subscription period dates are missing.'
    );
  }

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error(
      'Unable to determine billing interval safely because subscription period dates are invalid.'
    );
  }

  const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  if (days >= 300) return 'annual';
  if (days >= 25 && days <= 45) return 'monthly';

  throw new Error(
    `Unable to determine billing interval safely from subscription period length: ${days.toFixed(
      2
    )} days.`
  );
}

function getRenewalAmountCents(plan: PaidPlan, billingInterval: BillingInterval): number {
  if (plan === 'plus' && billingInterval === 'monthly') return 999;
  if (plan === 'plus' && billingInterval === 'annual') return 9999;
  if (plan === 'pro' && billingInterval === 'monthly') return 1999;
  if (plan === 'pro' && billingInterval === 'annual') return 19999;

  throw new Error(`Unsupported renewal plan: ${plan}_${billingInterval}`);
}

function addBillingInterval(date: Date, billingInterval: BillingInterval): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonth = billingInterval === 'annual' ? month + 12 : month + 1;

  const firstOfTargetMonth = new Date(
    Date.UTC(
      year,
      targetMonth,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );

  const lastDayOfTargetMonth = new Date(
    Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)
  ).getUTCDate();

  firstOfTargetMonth.setUTCDate(Math.min(day, lastDayOfTargetMonth));

  return firstOfTargetMonth;
}

function createRenewalRequestId(subscription: DueSubscription): string {
  const stableKey = [
    'tutovera-renewal',
    subscription.id,
    subscription.next_renewal_at ||
      subscription.current_period_end ||
      new Date().toISOString().slice(0, 10)
  ].join(':');

  const hash = crypto.createHash('sha256').update(stableKey).digest('hex');

  return `tv-renew-${hash.slice(0, 32)}`;
}

function extractPayPalCaptureId(order: any): string | null {
  const purchaseUnits = Array.isArray(order?.purchase_units) ? order.purchase_units : [];

  for (const purchaseUnit of purchaseUnits) {
    const captures = Array.isArray(purchaseUnit?.payments?.captures)
      ? purchaseUnit.payments.captures
      : [];

    const capture = captures[0];

    if (capture?.id) {
      return String(capture.id);
    }
  }

  return null;
}

function extractPayPalCaptureStatus(order: any): string | null {
  const purchaseUnits = Array.isArray(order?.purchase_units) ? order.purchase_units : [];

  for (const purchaseUnit of purchaseUnits) {
    const captures = Array.isArray(purchaseUnit?.payments?.captures)
      ? purchaseUnit.payments.captures
      : [];

    const capture = captures[0];

    if (capture?.status) {
      return String(capture.status);
    }
  }

  return null;
}

function inferPaymentSourceTypeFromRow(row: Record<string, any> | null): PayPalRenewalPaymentSourceType {
  if (!row) return 'card';

  const explicitType = [
    row.payment_source,
    row.payment_source_type,
    row.source_type,
    row.payment_method_type,
    row.method_type,
    row.type,
    row.provider_source_type
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (explicitType.includes('paypal')) return 'paypal';

  if (
    explicitType.includes('card') ||
    explicitType.includes('visa') ||
    explicitType.includes('mastercard') ||
    explicitType.includes('amex') ||
    explicitType.includes('discover')
  ) {
    return 'card';
  }

  const hasCardSignals = Boolean(
    row.brand ||
      row.card_brand ||
      row.last_four ||
      row.last_digits ||
      row.card_last_four ||
      row.card_last_digits ||
      row.expiry ||
      row.card_expiry
  );

  const hasPayPalSignals = Boolean(
    row.paypal_payer_id ||
      row.payer_id ||
      row.paypal_email ||
      row.email_address
  );

  if (hasPayPalSignals && !hasCardSignals) return 'paypal';

  return 'card';
}

async function loadPaymentSourceType(
  supabase: any,
  subscription: DueSubscription
): Promise<PayPalRenewalPaymentSourceType> {
  const tokenId = subscription.paypal_payment_token_id || '';

  if (tokenId) {
    const { data } = await supabase
      .from('paypal_payment_methods')
      .select('*')
      .eq('paypal_payment_token_id', tokenId)
      .maybeSingle();

    if (data) {
      return inferPaymentSourceTypeFromRow(data as Record<string, any>);
    }
  }

  if (subscription.user_id) {
    const { data, error } = await supabase
      .from('paypal_payment_methods')
      .select('*')
      .eq('user_id', subscription.user_id)
      .limit(20);

    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = data as Record<string, any>[];
      return inferPaymentSourceTypeFromRow(rows[0]);
    }
  }

  if (subscription.email) {
    const { data, error } = await supabase
      .from('paypal_payment_methods')
      .select('*')
      .eq('email', subscription.email)
      .limit(20);

    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = data as Record<string, any>[];
      return inferPaymentSourceTypeFromRow(rows[0]);
    }
  }

  return 'card';
}

async function insertBillingEvent(
  supabase: any,
  input: {
    userId: string | null;
    email?: string | null;
    subscriptionId: string;
    eventType: string;
    plan?: string | null;
    billingCycle?: string | null;
    amountCents?: number | null;
    currency?: string;
    status: string;
    paypalOrderId?: string | null;
    paypalCaptureId?: string | null;
    paypalPaymentTokenId?: string | null;
    errorMessage?: string | null;
    metadata?: Record<string, any>;
  }
) {
  const { error } = await supabase.from('billing_events').insert({
    user_id: input.userId,
    email: input.email || 'unknown',
    subscription_id: input.subscriptionId,
    provider: 'paypal',
    event_type: input.eventType,
    plan: input.plan || null,
    billing_cycle: input.billingCycle || null,
    amount_cents: input.amountCents ?? null,
    currency: input.currency || 'USD',
    status: input.status,
    paypal_order_id: input.paypalOrderId || null,
    paypal_capture_id: input.paypalCaptureId || null,
    paypal_payment_token_id: input.paypalPaymentTokenId || null,
    error_message: input.errorMessage || null,
    metadata: input.metadata || {}
  });

  if (error) {
    console.warn('Failed to insert billing event:', error.message);
  }
}

async function processExpiredCancelledSubscription(
  supabase: any,
  subscription: ExpiringSubscription
): Promise<ExpirationResult> {
  if (!subscription.cancel_at_period_end) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription is not scheduled for cancellation.'
    };
  }

  if (!isPaidPlanValue(subscription.plan)) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription is already on a free plan.'
    };
  }

  if (!isExpandedPayPalRecord(subscription)) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription is not an Expanded Checkout subscription.'
    };
  }

  if (!subscription.current_period_end) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: 'Subscription is missing current_period_end.'
    };
  }

  const now = new Date();
  const currentPeriodEnd = new Date(subscription.current_period_end);

  if (Number.isNaN(currentPeriodEnd.getTime()) || currentPeriodEnd.getTime() > now.getTime()) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription has not reached its period end yet.'
    };
  }

  const nowIso = now.toISOString();

  const { data: lockedSubscription, error: lockError } = await supabase
    .from('subscriptions')
    .update({
      billing_mode: 'paypal_expanded_expiring',
      updated_at: nowIso
    })
    .eq('id', subscription.id)
    .eq('cancel_at_period_end', true)
    .in('status', ['active', 'pending', 'past_due'])
    .lte('current_period_end', nowIso)
    .select(EXPIRING_SUBSCRIPTION_SELECT)
    .maybeSingle();

  if (lockError) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: lockError.message
    };
  }

  if (!lockedSubscription) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription was already expired or no longer eligible.'
    };
  }

  const locked = normalizeExpiringSubscription(lockedSubscription);

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'inactive',
      billing_mode: 'paypal_expanded_expired',
      paypal_status: 'CANCELLED',
      next_renewal_at: null,
      updated_at: nowIso
    })
    .eq('id', locked.id);

  if (updateError) {
    return {
      subscriptionId: locked.id,
      userId: locked.user_id,
      result: 'failed',
      message: updateError.message
    };
  }

  await insertBillingEvent(supabase, {
    userId: locked.user_id,
    email: locked.email,
    subscriptionId: locked.id,
    eventType: 'paypal_expanded_subscription_expired',
    plan: locked.plan,
    billingCycle: locked.billing_cycle,
    status: 'expired',
    paypalOrderId: locked.paypal_order_id,
    paypalCaptureId: locked.paypal_capture_id,
    paypalPaymentTokenId: locked.paypal_payment_token_id,
    metadata: {
      previous_plan: locked.plan,
      previous_status: locked.status,
      previous_billing_mode: locked.billing_mode,
      current_period_end: locked.current_period_end,
      cancelled_at: locked.cancelled_at,
      expired_at: nowIso
    }
  });

  return {
    subscriptionId: locked.id,
    userId: locked.user_id,
    result: 'expired'
  };
}

async function expireCancelledSubscriptions(
  supabase: any,
  nowIso: string
): Promise<ExpirationResult[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(EXPIRING_SUBSCRIPTION_SELECT)
    .eq('cancel_at_period_end', true)
    .in('status', ['active', 'pending', 'past_due'])
    .lte('current_period_end', nowIso)
    .order('current_period_end', { ascending: true })
    .limit(MAX_EXPIRATIONS_PER_RUN);

  if (error) {
    return [
      {
        subscriptionId: 'unknown',
        userId: null,
        result: 'failed',
        message: error.message
      }
    ];
  }

  const subscriptions: ExpiringSubscription[] = Array.isArray(data)
    ? data.map((subscription) => normalizeExpiringSubscription(subscription))
    : [];

  const results: ExpirationResult[] = [];

  for (const subscription of subscriptions) {
    const result = await processExpiredCancelledSubscription(supabase, subscription);
    results.push(result);
  }

  return results;
}

async function processWaitingVaultSubscription(
  supabase: any,
  subscription: ExpiringSubscription
): Promise<ExpirationResult> {
  if (subscription.billing_mode !== 'paypal_expanded_waiting_for_vault') {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription is not waiting for a PayPal vault token.'
    };
  }

  if (subscription.paypal_payment_token_id) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription already has a PayPal vault token.'
    };
  }

  if (!isPaidPlanValue(subscription.plan)) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription is already on a free plan.'
    };
  }

  if (!subscription.current_period_end) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: 'Subscription is missing current_period_end.'
    };
  }

  const now = new Date();
  const currentPeriodEnd = new Date(subscription.current_period_end);

  if (Number.isNaN(currentPeriodEnd.getTime()) || currentPeriodEnd.getTime() > now.getTime()) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription has not reached its paid period end yet.'
    };
  }

  const nowIso = now.toISOString();

  const { data: lockedSubscription, error: lockError } = await supabase
    .from('subscriptions')
    .update({
      billing_mode: 'paypal_expanded_vault_expiring',
      updated_at: nowIso
    })
    .eq('id', subscription.id)
    .eq('billing_mode', 'paypal_expanded_waiting_for_vault')
    .is('paypal_payment_token_id', null)
    .in('status', ['active', 'pending', 'past_due'])
    .lte('current_period_end', nowIso)
    .select(EXPIRING_SUBSCRIPTION_SELECT)
    .maybeSingle();

  if (lockError) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: lockError.message
    };
  }

  if (!lockedSubscription) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription was already updated or no longer eligible.'
    };
  }

  const locked = normalizeExpiringSubscription(lockedSubscription);

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'inactive',
      billing_mode: 'paypal_expanded_vault_missing_expired',
      paypal_status: 'VAULT_TOKEN_MISSING',
      next_renewal_at: null,
      cancel_at_period_end: true,
      cancelled_at: locked.cancelled_at || nowIso,
      updated_at: nowIso
    })
    .eq('id', locked.id);

  if (updateError) {
    return {
      subscriptionId: locked.id,
      userId: locked.user_id,
      result: 'failed',
      message: updateError.message
    };
  }

  await insertBillingEvent(supabase, {
    userId: locked.user_id,
    email: locked.email,
    subscriptionId: locked.id,
    eventType: 'paypal_expanded_vault_missing_expired',
    plan: locked.plan,
    billingCycle: locked.billing_cycle,
    status: 'expired',
    paypalOrderId: locked.paypal_order_id,
    paypalCaptureId: locked.paypal_capture_id,
    paypalPaymentTokenId: locked.paypal_payment_token_id,
    metadata: {
      previous_plan: locked.plan,
      previous_status: locked.status,
      previous_billing_mode: locked.billing_mode,
      current_period_start: locked.current_period_start,
      current_period_end: locked.current_period_end,
      next_renewal_at: locked.next_renewal_at,
      expired_at: nowIso,
      reason:
        'PayPal captured the initial payment but did not provide a vault token before the paid period ended.'
    }
  });

  return {
    subscriptionId: locked.id,
    userId: locked.user_id,
    result: 'expired'
  };
}

async function expireWaitingForVaultSubscriptions(
  supabase: any,
  nowIso: string
): Promise<ExpirationResult[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(EXPIRING_SUBSCRIPTION_SELECT)
    .eq('billing_provider', 'paypal')
    .eq('billing_mode', 'paypal_expanded_waiting_for_vault')
    .is('paypal_payment_token_id', null)
    .in('status', ['active', 'pending', 'past_due'])
    .lte('current_period_end', nowIso)
    .order('current_period_end', { ascending: true })
    .limit(MAX_WAITING_VAULT_EXPIRATIONS_PER_RUN);

  if (error) {
    return [
      {
        subscriptionId: 'unknown',
        userId: null,
        result: 'failed',
        message: error.message
      }
    ];
  }

  const subscriptions: ExpiringSubscription[] = Array.isArray(data)
    ? data.map((subscription) => normalizeExpiringSubscription(subscription))
    : [];

  const results: ExpirationResult[] = [];

  for (const subscription of subscriptions) {
    const result = await processWaitingVaultSubscription(supabase, subscription);
    results.push(result);
  }

  return results;
}

async function markRenewalFailure(
  supabase: any,
  subscription: DueSubscription,
  error: unknown
): Promise<RenewalResult> {
  const previousAttempts = subscription.renewal_attempt_count || 0;
  const nextAttempts = previousAttempts + 1;
  const now = new Date();

  const shouldSuspend = nextAttempts >= MAX_RENEWAL_ATTEMPTS;
  const nextRetryAt = new Date(now.getTime() + RETRY_DELAY_MS).toISOString();

  const errorMessage = error instanceof Error ? error.message : 'Unknown renewal error';

  await supabase
    .from('subscriptions')
    .update({
      status: shouldSuspend ? 'suspended' : 'past_due',
      billing_mode: 'paypal_expanded_recurring',
      next_renewal_at: shouldSuspend ? subscription.next_renewal_at : nextRetryAt,
      renewal_attempt_count: nextAttempts,
      updated_at: now.toISOString()
    })
    .eq('id', subscription.id);

  await insertBillingEvent(supabase, {
    userId: subscription.user_id,
    email: subscription.email,
    subscriptionId: subscription.id,
    eventType: 'paypal_expanded_renewal_failed',
    plan: subscription.plan,
    billingCycle: subscription.billing_cycle,
    status: shouldSuspend ? 'suspended' : 'past_due',
    paypalOrderId: subscription.paypal_order_id,
    paypalCaptureId: subscription.paypal_capture_id,
    paypalPaymentTokenId: subscription.paypal_payment_token_id,
    errorMessage,
    metadata: {
      error: errorMessage,
      attempt: nextAttempts,
      next_retry_at: shouldSuspend ? null : nextRetryAt
    }
  });

  return {
    subscriptionId: subscription.id,
    userId: subscription.user_id,
    result: 'failed',
    message: errorMessage
  };
}

async function processDueSubscription(
  supabase: any,
  subscription: DueSubscription
): Promise<RenewalResult> {
  if (!subscription.paypal_payment_token_id) {
    return markRenewalFailure(
      supabase,
      subscription,
      new Error('Missing PayPal payment token ID.')
    );
  }

  const nowIso = new Date().toISOString();

  const { data: lockedSubscription, error: lockError } = await supabase
    .from('subscriptions')
    .update({
      billing_mode: 'paypal_expanded_renewing',
      updated_at: nowIso
    })
    .eq('id', subscription.id)
    .eq('billing_mode', 'paypal_expanded_recurring')
    .in('status', ['active', 'past_due'])
    .or('cancel_at_period_end.is.false,cancel_at_period_end.is.null')
    .not('paypal_payment_token_id', 'is', null)
    .lte('next_renewal_at', nowIso)
    .select(DUE_SUBSCRIPTION_SELECT)
    .maybeSingle();

  if (lockError) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: lockError.message
    };
  }

  if (!lockedSubscription) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription was already locked or no longer due.'
    };
  }

  const locked = normalizeDueSubscription(lockedSubscription);

  try {
    const plan = normalizePlan(locked.plan);
    const billingInterval = inferBillingInterval(locked);
    const amountCents = getRenewalAmountCents(plan, billingInterval);
    const paymentSourceType = await loadPaymentSourceType(supabase, locked);

    const renewalOrder = await createPayPalRenewalOrder({
      subscriptionId: locked.id,
      userId: locked.user_id || locked.email || locked.id,
      plan,
      billingInterval,
      paypalPaymentTokenId: locked.paypal_payment_token_id as string,
      amountCents,
      currency: 'USD',
      paymentSourceType,
      requestId: createRenewalRequestId(locked)
    });

    if (renewalOrder?.status !== 'COMPLETED') {
      throw new Error(
        `PayPal renewal order did not complete. Status: ${renewalOrder?.status || 'unknown'}`
      );
    }

    const now = new Date();
    const currentPeriodStart = now.toISOString();
    const currentPeriodEnd = addBillingInterval(now, billingInterval).toISOString();

    const captureId = extractPayPalCaptureId(renewalOrder);
    const captureStatus = extractPayPalCaptureStatus(renewalOrder);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        billing_provider: 'paypal',
        billing_mode: 'paypal_expanded_recurring',
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        next_renewal_at: currentPeriodEnd,
        last_renewal_at: currentPeriodStart,
        renewal_attempt_count: 0,
        paypal_status: renewalOrder.status || captureStatus || 'COMPLETED',
        paypal_order_id: renewalOrder.id || null,
        paypal_capture_id: captureId,
        updated_at: currentPeriodStart
      })
      .eq('id', locked.id);

    if (updateError) {
      throw new Error(
        `PayPal renewal succeeded, but subscription update failed: ${updateError.message}`
      );
    }

    await insertBillingEvent(supabase, {
      userId: locked.user_id,
      email: locked.email,
      subscriptionId: locked.id,
      eventType: 'paypal_expanded_renewal_succeeded',
      plan: locked.plan,
      billingCycle: locked.billing_cycle,
      amountCents,
      currency: 'USD',
      status: 'completed',
      paypalOrderId: renewalOrder.id || null,
      paypalCaptureId: captureId,
      paypalPaymentTokenId: locked.paypal_payment_token_id,
      metadata: {
        paypal_order_id: renewalOrder.id || null,
        paypal_capture_id: captureId,
        paypal_capture_status: captureStatus,
        payment_source_type: paymentSourceType,
        billing_interval: billingInterval,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd
      }
    });

    return {
      subscriptionId: locked.id,
      userId: locked.user_id,
      result: 'renewed',
      paypalOrderId: renewalOrder.id || null,
      paypalCaptureId: captureId
    };
  } catch (error) {
    return markRenewalFailure(supabase, locked, error);
  }
}

async function renewDueSubscriptions(
  supabase: any,
  nowIso: string
): Promise<RenewalResult[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(DUE_SUBSCRIPTION_SELECT)
    .eq('billing_provider', 'paypal')
    .eq('billing_mode', 'paypal_expanded_recurring')
    .in('status', ['active', 'past_due'])
    .or('cancel_at_period_end.is.false,cancel_at_period_end.is.null')
    .not('paypal_payment_token_id', 'is', null)
    .lte('next_renewal_at', nowIso)
    .order('next_renewal_at', { ascending: true })
    .limit(MAX_RENEWALS_PER_RUN);

  if (error) {
    return [
      {
        subscriptionId: 'unknown',
        userId: 'unknown',
        result: 'failed',
        message: error.message
      }
    ];
  }

  const subscriptions: DueSubscription[] = Array.isArray(data)
    ? data.map((subscription) => normalizeDueSubscription(subscription))
    : [];

  const results: RenewalResult[] = [];

  for (const subscription of subscriptions) {
    const result = await processDueSubscription(supabase, subscription);
    results.push(result);
  }

  return results;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: 'CRON_SECRET is not configured.'
      },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized'
      },
      { status: 401 }
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const expirationResults = await expireCancelledSubscriptions(supabase, nowIso);
    const waitingVaultExpirationResults = await expireWaitingForVaultSubscriptions(
      supabase,
      nowIso
    );
    const renewalResults = await renewDueSubscriptions(supabase, nowIso);

    return NextResponse.json({
      success: true,
      expiredChecked: expirationResults.length,
      waitingVaultExpiredChecked: waitingVaultExpirationResults.length,
      renewalChecked: renewalResults.length,
      expirations: expirationResults,
      waitingVaultExpirations: waitingVaultExpirationResults,
      renewals: renewalResults
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cron error'
      },
      { status: 500 }
    );
  }
}