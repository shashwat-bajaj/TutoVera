import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import {
  getPayPalSubscription,
  getPlanFromPayPalPlanId,
  mapPayPalStatus,
  verifyPayPalWebhookSignature,
  type BillingCycle
} from '@/lib/paypal';
import type { PlanKey } from '@/lib/plans';

export const dynamic = 'force-dynamic';

type PayPalWebhookResource = {
  id?: string;
  status?: string;
  plan_id?: string;
  billing_agreement_id?: string;
  customer?: {
    id?: string;
    email_address?: string;
  };
  subscriber?: {
    payer_id?: string;
    email_address?: string;
  };
  payment_source?: {
    card?: {
      brand?: string;
      last_digits?: string;
      expiry?: string;
    };
    paypal?: {
      account_id?: string;
      email_address?: string;
    };
  };
  billing_info?: {
    last_payment?: {
      time?: string;
    };
    next_billing_time?: string;
  };
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
};

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: PayPalWebhookResource;
};

type ExistingSubscriptionRecord = {
  id: string;
  user_id: string | null;
  email: string;
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

function getHeader(request: NextRequest, name: string) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || '';
}

function getSubscriptionIdFromEvent(event: PayPalWebhookEvent) {
  const eventType = event.event_type || '';
  const resource = event.resource || {};

  if (eventType.startsWith('BILLING.SUBSCRIPTION.')) {
    return resource.id || '';
  }

  if (eventType.startsWith('PAYMENT.SALE.')) {
    return resource.billing_agreement_id || '';
  }

  return resource.id || resource.billing_agreement_id || '';
}

function getWebhookStatusOverride(eventType: string) {
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      return 'inactive';

    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      return 'suspended';

    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
    case 'PAYMENT.SALE.REVERSED':
      return 'past_due';

    default:
      return '';
  }
}

function normalizePaidPlan(value: string | null | undefined): Exclude<PlanKey, 'free'> | null {
  if (value === 'plus' || value === 'pro') return value;
  return null;
}

function normalizeBillingCycle(value: string | null | undefined): BillingCycle | null {
  if (value === 'monthly' || value === 'annual') return value;
  return null;
}

function extractOrderIdFromVaultLinks(resource: PayPalWebhookResource) {
  const links = resource.links || [];

  for (const link of links) {
    const href = link.href || '';
    const match = href.match(/\/v2\/checkout\/orders\/([^/?#]+)/);

    if (match?.[1]) {
      return match[1];
    }
  }

  return '';
}

function extractVaultTokenId(resource: PayPalWebhookResource) {
  return resource.id || '';
}

function extractVaultCustomerId(resource: PayPalWebhookResource) {
  return resource.customer?.id || resource.payment_source?.paypal?.account_id || '';
}

function extractVaultEmail(resource: PayPalWebhookResource) {
  return (
    resource.customer?.email_address?.trim().toLowerCase() ||
    resource.payment_source?.paypal?.email_address?.trim().toLowerCase() ||
    ''
  );
}

function extractVaultPaymentSource(resource: PayPalWebhookResource) {
  if (resource.payment_source?.card) return 'card';
  if (resource.payment_source?.paypal) return 'paypal';
  return 'unknown';
}

function extractVaultCardSummary(resource: PayPalWebhookResource) {
  const expiry = resource.payment_source?.card?.expiry || '';
  const [expiryYear = '', expiryMonth = ''] = expiry.includes('-') ? expiry.split('-') : ['', ''];

  return {
    brand: resource.payment_source?.card?.brand || null,
    lastDigits: resource.payment_source?.card?.last_digits || null,
    expiryMonth: expiryMonth || null,
    expiryYear: expiryYear || null
  };
}

async function markWebhookEvent({
  supabase,
  paypalEventId,
  status,
  errorMessage
}: {
  supabase: any;
  paypalEventId: string;
  status: 'processed' | 'ignored' | 'error';
  errorMessage?: string;
}) {
  await supabase
    .from('paypal_webhook_events')
    .update({
      processing_status: status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString()
    })
    .eq('paypal_event_id', paypalEventId);
}

async function getExistingSubscription({
  supabase,
  paypalSubscriptionId,
  email
}: {
  supabase: any;
  paypalSubscriptionId: string;
  email: string;
}): Promise<ExistingSubscriptionRecord | null> {
  if (paypalSubscriptionId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email')
      .eq('paypal_subscription_id', paypalSubscriptionId)
      .maybeSingle();

    if (data) {
      return data as ExistingSubscriptionRecord;
    }
  }

  if (email) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email')
      .eq('email', email)
      .maybeSingle();

    if (data) {
      return data as ExistingSubscriptionRecord;
    }
  }

  return null;
}

async function upsertSubscriptionFromPayPal({
  supabase,
  eventType,
  paypalSubscription
}: {
  supabase: any;
  eventType: string;
  paypalSubscription: Awaited<ReturnType<typeof getPayPalSubscription>>;
}) {
  const paypalSubscriptionId = paypalSubscription.id;
  const paypalPlanId = paypalSubscription.plan_id || '';
  const planMapping = getPlanFromPayPalPlanId(paypalPlanId);

  if (!paypalSubscriptionId) {
    return {
      ok: false,
      ignored: true,
      reason: 'Webhook subscription payload did not include a PayPal subscription ID.'
    };
  }

  if (!planMapping) {
    return {
      ok: false,
      ignored: true,
      reason: `PayPal plan ID is not configured in TutoVera: ${paypalPlanId || 'missing'}`
    };
  }

  const subscriberEmail = paypalSubscription.subscriber?.email_address?.trim().toLowerCase() || '';

  const existingSubscription = await getExistingSubscription({
    supabase,
    paypalSubscriptionId,
    email: subscriberEmail
  });

  const email = existingSubscription?.email || subscriberEmail;

  if (!email) {
    return {
      ok: false,
      ignored: true,
      reason: 'Webhook could not resolve an email for this PayPal subscription.'
    };
  }

  const paypalStatus = paypalSubscription.status || 'UNKNOWN';
  const overrideStatus = getWebhookStatusOverride(eventType);
  const status = overrideStatus || mapPayPalStatus(paypalStatus);

  const plan = planMapping.plan as PlanKey;
  const billingCycle = planMapping.billingCycle as BillingCycle;

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: existingSubscription?.user_id || null,
      email,
      plan,
      billing_cycle: billingCycle,
      status,
      billing_provider: 'paypal',
      billing_mode: 'paypal_subscriptions',
      paypal_subscription_id: paypalSubscriptionId,
      paypal_plan_id: paypalPlanId,
      paypal_status: paypalStatus,
      paypal_payer_id: paypalSubscription.subscriber?.payer_id || null,
      current_period_start: paypalSubscription.billing_info?.last_payment?.time || null,
      current_period_end: paypalSubscription.billing_info?.next_billing_time || null,
      cancel_at_period_end:
        eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
        eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
        eventType === 'BILLING.SUBSCRIPTION.EXPIRED',
      updated_at: new Date().toISOString()
    },
    { onConflict: 'email' }
  );

  if (error) {
    return {
      ok: false,
      ignored: false,
      reason: error.message
    };
  }

  return {
    ok: true,
    ignored: false,
    reason: ''
  };
}

async function findExpandedOrderForVaultEvent({
  supabase,
  orderId,
  email
}: {
  supabase: any;
  orderId: string;
  email: string;
}): Promise<ExpandedOrderRecord | null> {
  if (orderId) {
    const { data } = await supabase
      .from('paypal_expanded_orders')
      .select('id, user_id, email, paypal_order_id, plan, billing_cycle, amount_cents, currency, status')
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    if (data) {
      return data as ExpandedOrderRecord;
    }
  }

  if (email) {
    const { data } = await supabase
      .from('paypal_expanded_orders')
      .select('id, user_id, email, paypal_order_id, plan, billing_cycle, amount_cents, currency, status')
      .eq('email', email)
      .in('status', ['captured_waiting_for_vault', 'capture_pending', 'captured'])
      .order('updated_at', { ascending: false })
      .limit(1);

    if (data?.[0]) {
      return data[0] as ExpandedOrderRecord;
    }
  }

  return null;
}

async function findWaitingExpandedSubscription({
  supabase,
  email,
  orderId
}: {
  supabase: any;
  email: string;
  orderId: string;
}) {
  if (orderId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email, plan, billing_cycle, paypal_order_id')
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    if (data) {
      return data;
    }
  }

  if (email) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, email, plan, billing_cycle, paypal_order_id')
      .eq('email', email)
      .in('billing_mode', ['paypal_expanded_waiting_for_vault', 'paypal_expanded_recurring'])
      .order('updated_at', { ascending: false })
      .limit(1);

    if (data?.[0]) {
      return data[0];
    }
  }

  return null;
}

async function handleVaultPaymentTokenCreated({
  supabase,
  webhookEvent,
  paypalEventId
}: {
  supabase: any;
  webhookEvent: PayPalWebhookEvent;
  paypalEventId: string;
}) {
  const resource = webhookEvent.resource || {};
  const tokenId = extractVaultTokenId(resource);
  const customerId = extractVaultCustomerId(resource);
  const eventEmail = extractVaultEmail(resource);
  const orderIdFromLinks = extractOrderIdFromVaultLinks(resource);
  const paymentSource = extractVaultPaymentSource(resource);
  const cardSummary = extractVaultCardSummary(resource);

  if (!tokenId) {
    return {
      status: 'ignored' as const,
      reason: 'VAULT.PAYMENT-TOKEN.CREATED did not include a vault token ID.'
    };
  }

  const expandedOrder = await findExpandedOrderForVaultEvent({
    supabase,
    orderId: orderIdFromLinks,
    email: eventEmail
  });

  const resolvedEmail = expandedOrder?.email || eventEmail;
  const waitingSubscription = await findWaitingExpandedSubscription({
    supabase,
    email: resolvedEmail,
    orderId: expandedOrder?.paypal_order_id || orderIdFromLinks
  });

  if (!resolvedEmail && !waitingSubscription) {
    return {
      status: 'ignored' as const,
      reason:
        'Vault token was received, but TutoVera could not match it to an expanded checkout order or subscription yet.'
    };
  }

  const userId = expandedOrder?.user_id || waitingSubscription?.user_id || null;
  const email = resolvedEmail || waitingSubscription?.email || '';
  const plan = normalizePaidPlan(expandedOrder?.plan || waitingSubscription?.plan || '');
  const billingCycle = normalizeBillingCycle(
    expandedOrder?.billing_cycle || waitingSubscription?.billing_cycle || ''
  );

  if (!email || !plan || !billingCycle) {
    return {
      status: 'ignored' as const,
      reason: 'Vault token could not be matched to a valid TutoVera plan.'
    };
  }

  await supabase.from('paypal_payment_methods').upsert(
    {
      user_id: userId,
      email,
      paypal_payment_token_id: tokenId,
      payment_source: paymentSource,
      payer_id: customerId || null,
      brand: cardSummary.brand,
      last_digits: cardSummary.lastDigits,
      expiry_month: cardSummary.expiryMonth,
      expiry_year: cardSummary.expiryYear,
      status: 'active',
      raw_payload: resource,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'paypal_payment_token_id' }
  );

  if (expandedOrder) {
    await supabase
      .from('paypal_expanded_orders')
      .update({
        paypal_payment_token_id: tokenId,
        status: 'captured',
        updated_at: new Date().toISOString()
      })
      .eq('id', expandedOrder.id);
  }

  const subscriptionFilterOrderId = expandedOrder?.paypal_order_id || orderIdFromLinks;

  let subscriptionUpdateQuery = supabase
    .from('subscriptions')
    .update({
      plan,
      billing_cycle: billingCycle,
      status: 'active',
      billing_provider: 'paypal',
      billing_mode: 'paypal_expanded_recurring',
      paypal_payment_token_id: tokenId,
      paypal_status: 'VAULTED',
      updated_at: new Date().toISOString()
    });

  if (subscriptionFilterOrderId) {
    subscriptionUpdateQuery = subscriptionUpdateQuery.eq('paypal_order_id', subscriptionFilterOrderId);
  } else {
    subscriptionUpdateQuery = subscriptionUpdateQuery.eq('email', email);
  }

  const { error: subscriptionUpdateError } = await subscriptionUpdateQuery;

  if (subscriptionUpdateError) {
    return {
      status: 'error' as const,
      reason: subscriptionUpdateError.message
    };
  }

  await supabase.from('billing_events').insert({
    user_id: userId,
    email,
    event_type: 'vault_payment_token_created',
    plan,
    billing_cycle: billingCycle,
    status: 'recorded',
    paypal_order_id: subscriptionFilterOrderId || null,
    paypal_payment_token_id: tokenId,
    metadata: {
      paypalEventId,
      resource
    }
  });

  return {
    status: 'processed' as const,
    reason: ''
  };
}

async function handleVaultPaymentTokenDeleted({
  supabase,
  webhookEvent
}: {
  supabase: any;
  webhookEvent: PayPalWebhookEvent;
}) {
  const resource = webhookEvent.resource || {};
  const tokenId = extractVaultTokenId(resource);

  if (!tokenId) {
    return {
      status: 'ignored' as const,
      reason: 'Vault deletion event did not include a token ID.'
    };
  }

  await supabase
    .from('paypal_payment_methods')
    .update({
      status: 'inactive',
      raw_payload: resource,
      updated_at: new Date().toISOString()
    })
    .eq('paypal_payment_token_id', tokenId);

  await supabase
    .from('subscriptions')
    .update({
      billing_mode: 'paypal_expanded_payment_method_deleted',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq('paypal_payment_token_id', tokenId);

  await supabase.from('billing_events').insert({
    email: extractVaultEmail(resource) || 'unknown',
    event_type: 'vault_payment_token_deleted',
    status: 'recorded',
    paypal_payment_token_id: tokenId,
    metadata: resource
  });

  return {
    status: 'processed' as const,
    reason: ''
  };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  let webhookEvent: PayPalWebhookEvent;

  try {
    webhookEvent = (await request.json()) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook JSON.' }, { status: 400 });
  }

  const paypalEventId = webhookEvent.id || '';
  const eventType = webhookEvent.event_type || '';
  const paypalResourceId = getSubscriptionIdFromEvent(webhookEvent);

  if (!paypalEventId || !eventType) {
    return NextResponse.json({ error: 'Missing PayPal webhook event ID or type.' }, { status: 400 });
  }

  const transmissionId = getHeader(request, 'paypal-transmission-id');
  const transmissionTime = getHeader(request, 'paypal-transmission-time');
  const certUrl = getHeader(request, 'paypal-cert-url');
  const authAlgo = getHeader(request, 'paypal-auth-algo');
  const transmissionSig = getHeader(request, 'paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'Missing PayPal webhook signature headers.' }, { status: 400 });
  }

  try {
    const isVerified = await verifyPayPalWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookEvent
    });

    if (!isVerified) {
      return NextResponse.json(
        { error: 'PayPal webhook signature verification failed.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PAYPAL WEBHOOK VERIFICATION ERROR:', error);

    return NextResponse.json(
      { error: 'PayPal webhook signature verification failed.' },
      { status: 400 }
    );
  }

  const { error: insertEventError } = await supabase.from('paypal_webhook_events').insert({
    paypal_event_id: paypalEventId,
    event_type: eventType,
    paypal_resource_id: paypalResourceId || webhookEvent.resource?.id || null,
    payload: webhookEvent,
    processing_status: 'received'
  });

  if (insertEventError) {
    if (insertEventError.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    console.error('PAYPAL WEBHOOK EVENT INSERT ERROR:', insertEventError);

    return NextResponse.json(
      { error: 'Could not record PayPal webhook event.' },
      { status: 500 }
    );
  }

  try {
    if (eventType === 'VAULT.PAYMENT-TOKEN.CREATED') {
      const result = await handleVaultPaymentTokenCreated({
        supabase,
        webhookEvent,
        paypalEventId
      });

      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: result.status,
        errorMessage: result.reason || undefined
      });

      return NextResponse.json({
        ok: result.status !== 'error',
        status: result.status,
        reason: result.reason || undefined
      });
    }

    if (
      eventType === 'VAULT.PAYMENT-TOKEN.DELETED' ||
      eventType === 'VAULT.PAYMENT-TOKEN.DELETION-INITIATED'
    ) {
      const result = await handleVaultPaymentTokenDeleted({
        supabase,
        webhookEvent
      });

      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: result.status,
        errorMessage: result.reason || undefined
      });

      return NextResponse.json({
        ok: true,
        status: result.status,
        reason: result.reason || undefined
      });
    }

    if (!paypalResourceId) {
      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: 'ignored',
        errorMessage: 'No PayPal subscription/resource ID was found for this event.'
      });

      return NextResponse.json({ ok: true, ignored: true });
    }

    const paypalSubscription = await getPayPalSubscription(paypalResourceId);

    const result = await upsertSubscriptionFromPayPal({
      supabase,
      eventType,
      paypalSubscription
    });

    if (!result.ok && result.ignored) {
      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: 'ignored',
        errorMessage: result.reason
      });

      return NextResponse.json({ ok: true, ignored: true, reason: result.reason });
    }

    if (!result.ok) {
      await markWebhookEvent({
        supabase,
        paypalEventId,
        status: 'error',
        errorMessage: result.reason
      });

      return NextResponse.json(
        { error: 'Could not process PayPal webhook event.' },
        { status: 500 }
      );
    }

    await markWebhookEvent({
      supabase,
      paypalEventId,
      status: 'processed'
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown PayPal webhook processing error.';

    console.error('PAYPAL WEBHOOK PROCESSING ERROR:', error);

    await markWebhookEvent({
      supabase,
      paypalEventId,
      status: 'error',
      errorMessage: message
    });

    return NextResponse.json(
      { error: 'Could not process PayPal webhook event.' },
      { status: 500 }
    );
  }
}