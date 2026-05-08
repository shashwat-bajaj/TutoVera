import crypto from 'node:crypto';

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import {
  createPayPalRenewalOrder,
  type PayPalRenewalPaymentSourceType,
} from '@/lib/paypal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BillingInterval = 'monthly' | 'annual';
type PaidPlan = 'plus' | 'pro';

type DueSubscription = {
  id: string;
  user_id: string;
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_renewal_at: string | null;
  paypal_payment_token_id: string | null;
  renewal_attempt_count: number | null;
};

type RenewalResult = {
  subscriptionId: string;
  userId: string;
  result: 'renewed' | 'failed' | 'skipped';
  message?: string;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
};

const MAX_RENEWALS_PER_RUN = 10;
const RETRY_DELAY_MS = 24 * 60 * 60 * 1000;
const MAX_RENEWAL_ATTEMPTS = 3;

const DUE_SUBSCRIPTION_SELECT = [
  'id',
  'user_id',
  'plan',
  'status',
  'current_period_start',
  'current_period_end',
  'next_renewal_at',
  'paypal_payment_token_id',
  'renewal_attempt_count',
].join(',');

function createSupabaseAdmin(): any {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as any;
}

function normalizeDueSubscription(row: unknown): DueSubscription {
  return row as unknown as DueSubscription;
}

function normalizePlan(planValue: string | null): PaidPlan {
  const value = String(planValue || '').toLowerCase();

  if (value.includes('pro')) return 'pro';
  if (value.includes('plus')) return 'plus';

  throw new Error(`Unsupported paid plan: ${planValue || 'missing'}`);
}

function inferBillingInterval(subscription: DueSubscription): BillingInterval {
  const planValue = String(subscription.plan || '').toLowerCase();

  if (
    planValue.includes('annual') ||
    planValue.includes('yearly') ||
    planValue.includes('year')
  ) {
    return 'annual';
  }

  if (
    planValue.includes('monthly') ||
    planValue.includes('month')
  ) {
    return 'monthly';
  }

  const startDateValue = subscription.current_period_start;
  const endDateValue =
    subscription.current_period_end || subscription.next_renewal_at;

  if (!startDateValue || !endDateValue) {
    throw new Error(
      'Unable to determine billing interval safely because subscription period dates are missing.',
    );
  }

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error(
      'Unable to determine billing interval safely because subscription period dates are invalid.',
    );
  }

  const days =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  if (days >= 300) return 'annual';
  if (days >= 25 && days <= 45) return 'monthly';

  throw new Error(
    `Unable to determine billing interval safely from subscription period length: ${days.toFixed(
      2,
    )} days.`,
  );
}

function getRenewalAmountCents(
  plan: PaidPlan,
  billingInterval: BillingInterval,
): number {
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
      date.getUTCMilliseconds(),
    ),
  );

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      firstOfTargetMonth.getUTCFullYear(),
      firstOfTargetMonth.getUTCMonth() + 1,
      0,
    ),
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
      new Date().toISOString().slice(0, 10),
  ].join(':');

  const hash = crypto.createHash('sha256').update(stableKey).digest('hex');

  return `tv-renew-${hash.slice(0, 32)}`;
}

function extractPayPalCaptureId(order: any): string | null {
  const purchaseUnits = Array.isArray(order?.purchase_units)
    ? order.purchase_units
    : [];

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
  const purchaseUnits = Array.isArray(order?.purchase_units)
    ? order.purchase_units
    : [];

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

function inferPaymentSourceTypeFromRow(
  row: Record<string, any> | null,
): PayPalRenewalPaymentSourceType {
  if (!row) return 'card';

  const explicitType = [
    row.payment_source_type,
    row.source_type,
    row.payment_method_type,
    row.method_type,
    row.type,
    row.provider_source_type,
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
      row.card_expiry,
  );

  const hasPayPalSignals = Boolean(
    row.paypal_payer_id ||
      row.payer_id ||
      row.paypal_email ||
      row.email_address,
  );

  if (hasPayPalSignals && !hasCardSignals) return 'paypal';

  return 'card';
}

async function loadPaymentSourceType(
  supabase: any,
  subscription: DueSubscription,
): Promise<PayPalRenewalPaymentSourceType> {
  const { data, error } = await supabase
    .from('paypal_payment_methods')
    .select('*')
    .eq('user_id', subscription.user_id)
    .limit(20);

  if (error || !Array.isArray(data) || data.length === 0) {
    return 'card';
  }

  const rows = data as Record<string, any>[];
  const tokenId = subscription.paypal_payment_token_id || '';

  const matchingRow =
    rows.find((row) => {
      const values = Object.values(row || {});

      return values.some((value) => {
        if (typeof value === 'string') return value === tokenId;

        if (value && typeof value === 'object') {
          return JSON.stringify(value).includes(tokenId);
        }

        return false;
      });
    }) || rows[0];

  return inferPaymentSourceTypeFromRow(matchingRow);
}

async function insertBillingEvent(
  supabase: any,
  input: {
    userId: string;
    subscriptionId: string;
    eventType: string;
    amountCents?: number | null;
    currency?: string;
    status: string;
    metadata?: Record<string, any>;
  },
) {
  const { error } = await supabase.from('billing_events').insert({
    user_id: input.userId,
    subscription_id: input.subscriptionId,
    event_type: input.eventType,
    provider: 'paypal',
    amount_cents: input.amountCents ?? null,
    currency: input.currency || 'USD',
    status: input.status,
    metadata: input.metadata || {},
  });

  if (error) {
    console.warn('Failed to insert billing event:', error.message);
  }
}

async function markRenewalFailure(
  supabase: any,
  subscription: DueSubscription,
  error: unknown,
): Promise<RenewalResult> {
  const previousAttempts = subscription.renewal_attempt_count || 0;
  const nextAttempts = previousAttempts + 1;
  const now = new Date();

  const shouldSuspend = nextAttempts >= MAX_RENEWAL_ATTEMPTS;
  const nextRetryAt = new Date(now.getTime() + RETRY_DELAY_MS).toISOString();

  const errorMessage =
    error instanceof Error ? error.message : 'Unknown renewal error';

  await supabase
    .from('subscriptions')
    .update({
      status: shouldSuspend ? 'suspended' : 'past_due',
      billing_mode: 'paypal_expanded_recurring',
      next_renewal_at: shouldSuspend ? subscription.next_renewal_at : nextRetryAt,
      renewal_attempt_count: nextAttempts,
      updated_at: now.toISOString(),
    })
    .eq('id', subscription.id);

  await insertBillingEvent(supabase, {
    userId: subscription.user_id,
    subscriptionId: subscription.id,
    eventType: 'paypal_expanded_renewal_failed',
    status: shouldSuspend ? 'suspended' : 'past_due',
    metadata: {
      error: errorMessage,
      attempt: nextAttempts,
      next_retry_at: shouldSuspend ? null : nextRetryAt,
    },
  });

  return {
    subscriptionId: subscription.id,
    userId: subscription.user_id,
    result: 'failed',
    message: errorMessage,
  };
}

async function processDueSubscription(
  supabase: any,
  subscription: DueSubscription,
): Promise<RenewalResult> {
  if (!subscription.paypal_payment_token_id) {
    return markRenewalFailure(
      supabase,
      subscription,
      new Error('Missing PayPal payment token ID.'),
    );
  }

  const { data: lockedSubscription, error: lockError } = await supabase
    .from('subscriptions')
    .update({
      billing_mode: 'paypal_expanded_renewing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)
    .eq('billing_mode', 'paypal_expanded_recurring')
    .select(DUE_SUBSCRIPTION_SELECT)
    .maybeSingle();

  if (lockError) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'failed',
      message: lockError.message,
    };
  }

  if (!lockedSubscription) {
    return {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      result: 'skipped',
      message: 'Subscription was already locked or no longer due.',
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
      userId: locked.user_id,
      plan,
      billingInterval,
      paypalPaymentTokenId: locked.paypal_payment_token_id as string,
      amountCents,
      currency: 'USD',
      paymentSourceType,
      requestId: createRenewalRequestId(locked),
    });

    if (renewalOrder?.status !== 'COMPLETED') {
      throw new Error(
        `PayPal renewal order did not complete. Status: ${
          renewalOrder?.status || 'unknown'
        }`,
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
        paypal_order_id: renewalOrder.id || null,
        paypal_capture_id: captureId,
        updated_at: currentPeriodStart,
      })
      .eq('id', locked.id);

    if (updateError) {
      throw new Error(
        `PayPal renewal succeeded, but subscription update failed: ${updateError.message}`,
      );
    }

    await insertBillingEvent(supabase, {
      userId: locked.user_id,
      subscriptionId: locked.id,
      eventType: 'paypal_expanded_renewal_succeeded',
      amountCents,
      currency: 'USD',
      status: 'completed',
      metadata: {
        paypal_order_id: renewalOrder.id || null,
        paypal_capture_id: captureId,
        paypal_capture_status: captureStatus,
        payment_source_type: paymentSourceType,
        billing_interval: billingInterval,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
      },
    });

    return {
      subscriptionId: locked.id,
      userId: locked.user_id,
      result: 'renewed',
      paypalOrderId: renewalOrder.id || null,
      paypalCaptureId: captureId,
    };
  } catch (error) {
    return markRenewalFailure(supabase, locked, error);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: 'CRON_SECRET is not configured.',
      },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { data: dueSubscriptions, error } = await supabase
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
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    const subscriptions: DueSubscription[] = Array.isArray(dueSubscriptions)
      ? dueSubscriptions.map((subscription) =>
          normalizeDueSubscription(subscription),
        )
      : [];

    const results: RenewalResult[] = [];

    for (const subscription of subscriptions) {
      const result = await processDueSubscription(supabase, subscription);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      checked: subscriptions.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cron error',
      },
      { status: 500 },
    );
  }
}