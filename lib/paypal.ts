import type { PlanKey } from '@/lib/plans';

export type BillingCycle = 'monthly' | 'annual';
export type PaidPlanKey = Exclude<PlanKey, 'free'>;
export type ExpandedPaymentSource = 'paypal' | 'card';

type PayPalSubscription = {
  id: string;
  status?: string;
  plan_id?: string;
  subscriber?: {
    payer_id?: string;
    email_address?: string;
  };
  billing_info?: {
    last_payment?: {
      time?: string;
    };
    next_billing_time?: string;
  };
};

type PayPalWebhookVerificationResponse = {
  verification_status?: string;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  payer?: {
    payer_id?: string;
    email_address?: string;
  };
  payment_source?: {
    paypal?: {
      email_address?: string;
      account_id?: string;
      attributes?: {
        vault?: {
          id?: string;
          status?: string;
        };
      };
    };
    card?: {
      brand?: string;
      last_digits?: string;
      expiry?: string;
      attributes?: {
        vault?: {
          id?: string;
          status?: string;
        };
      };
    };
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
};

export type ExpandedCheckoutPlan = {
  plan: PaidPlanKey;
  billingCycle: BillingCycle;
  amountCents: number;
  currency: 'USD';
  label: string;
  description: string;
  periodMonths: number;
};

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export function getConfiguredPayPalPlanIds() {
  return {
    plus: {
      monthly: process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID || '',
      annual: process.env.NEXT_PUBLIC_PAYPAL_PLUS_ANNUAL_PLAN_ID || ''
    },
    pro: {
      monthly: process.env.NEXT_PUBLIC_PAYPAL_PRO_MONTHLY_PLAN_ID || '',
      annual: process.env.NEXT_PUBLIC_PAYPAL_PRO_ANNUAL_PLAN_ID || ''
    }
  } satisfies Record<PaidPlanKey, Record<BillingCycle, string>>;
}

export function getPlanFromPayPalPlanId(paypalPlanId: string): {
  plan: PlanKey;
  billingCycle: BillingCycle;
} | null {
  const planIds = getConfiguredPayPalPlanIds();

  if (paypalPlanId && paypalPlanId === planIds.plus.monthly) {
    return { plan: 'plus', billingCycle: 'monthly' };
  }

  if (paypalPlanId && paypalPlanId === planIds.plus.annual) {
    return { plan: 'plus', billingCycle: 'annual' };
  }

  if (paypalPlanId && paypalPlanId === planIds.pro.monthly) {
    return { plan: 'pro', billingCycle: 'monthly' };
  }

  if (paypalPlanId && paypalPlanId === planIds.pro.annual) {
    return { plan: 'pro', billingCycle: 'annual' };
  }

  return null;
}

export function getExpandedCheckoutPlan({
  plan,
  billingCycle
}: {
  plan: PlanKey;
  billingCycle: BillingCycle;
}): ExpandedCheckoutPlan {
  if (plan === 'plus' && billingCycle === 'monthly') {
    return {
      plan,
      billingCycle,
      amountCents: 999,
      currency: 'USD',
      label: 'TutoVera Plus Monthly',
      description: 'Monthly TutoVera Plus access for regular study support.',
      periodMonths: 1
    };
  }

  if (plan === 'plus' && billingCycle === 'annual') {
    return {
      plan,
      billingCycle,
      amountCents: 9999,
      currency: 'USD',
      label: 'TutoVera Plus Annual',
      description: 'Annual TutoVera Plus access for regular study support.',
      periodMonths: 12
    };
  }

  if (plan === 'pro' && billingCycle === 'monthly') {
    return {
      plan,
      billingCycle,
      amountCents: 1999,
      currency: 'USD',
      label: 'TutoVera Pro Monthly',
      description: 'Monthly TutoVera Pro access for deeper study and heavier usage.',
      periodMonths: 1
    };
  }

  if (plan === 'pro' && billingCycle === 'annual') {
    return {
      plan,
      billingCycle,
      amountCents: 19999,
      currency: 'USD',
      label: 'TutoVera Pro Annual',
      description: 'Annual TutoVera Pro access for deeper study and heavier usage.',
      periodMonths: 12
    };
  }

  throw new Error('Invalid TutoVera plan or billing cycle.');
}

export function formatAmountFromCents(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

export function getNextRenewalDate({
  from = new Date(),
  billingCycle
}: {
  from?: Date;
  billingCycle: BillingCycle;
}) {
  const next = new Date(from);

  if (billingCycle === 'annual') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }

  return next;
}

export function mapPayPalStatus(paypalStatus?: string) {
  switch ((paypalStatus || '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'APPROVAL_PENDING':
    case 'APPROVED':
      return 'pending';
    case 'SUSPENDED':
      return 'suspended';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'inactive';
    default:
      return 'inactive';
  }
}

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal API credentials.');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal access token request failed: ${text}`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error('PayPal access token response did not include an access token.');
  }

  return data.access_token;
}

export async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal subscription lookup failed: ${text}`);
  }

  return (await response.json()) as PayPalSubscription;
}

export async function cancelPayPalSubscription({
  subscriptionId,
  reason = 'User requested cancellation from TutoVera account.'
}: {
  subscriptionId: string;
  reason?: string;
}) {
  const accessToken = await getPayPalAccessToken();

  const cleanReason = reason.trim().slice(0, 128) || 'User requested cancellation.';

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: cleanReason
      }),
      cache: 'no-store'
    }
  );

  if (response.status === 204) {
    return true;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal subscription cancellation failed: ${text}`);
  }

  return true;
}

function buildPaymentSource({
  source,
  returnUrl,
  cancelUrl
}: {
  source: ExpandedPaymentSource;
  returnUrl: string;
  cancelUrl: string;
}) {
  if (source === 'card') {
    return {
      card: {
        attributes: {
          verification: {
            method: 'SCA_WHEN_REQUIRED'
          },
          vault: {
            store_in_vault: 'ON_SUCCESS',
            usage_type: 'MERCHANT',
            usage_pattern: 'SUBSCRIPTION_PREPAID'
          }
        }
      }
    };
  }

  return {
    paypal: {
      experience_context: {
        brand_name: 'TutoVera',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      attributes: {
        vault: {
          store_in_vault: 'ON_SUCCESS',
          usage_type: 'MERCHANT',
          usage_pattern: 'SUBSCRIPTION_PREPAID'
        }
      }
    }
  };
}

export async function createPayPalExpandedOrder({
  plan,
  billingCycle,
  userId,
  email,
  source,
  returnUrl,
  cancelUrl
}: {
  plan: PaidPlanKey;
  billingCycle: BillingCycle;
  userId: string;
  email: string;
  source: ExpandedPaymentSource;
  returnUrl: string;
  cancelUrl: string;
}) {
  const accessToken = await getPayPalAccessToken();
  const planConfig = getExpandedCheckoutPlan({ plan, billingCycle });
  const amountValue = formatAmountFromCents(planConfig.amountCents);

  const requestBody = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: `${plan}-${billingCycle}-${userId}`,
        custom_id: userId,
        description: planConfig.description,
        amount: {
          currency_code: planConfig.currency,
          value: amountValue,
          breakdown: {
            item_total: {
              currency_code: planConfig.currency,
              value: amountValue
            }
          }
        },
        items: [
          {
            name: planConfig.label,
            description: planConfig.description,
            quantity: '1',
            category: 'DIGITAL_GOODS',
            unit_amount: {
              currency_code: planConfig.currency,
              value: amountValue
            }
          }
        ]
      }
    ],
    payment_source: buildPaymentSource({
      source,
      returnUrl,
      cancelUrl
    })
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `tutovera-${userId}-${Date.now()}`
    },
    body: JSON.stringify(requestBody),
    cache: 'no-store'
  });

  const data = (await response.json()) as PayPalOrderResponse & { message?: string };

  if (!response.ok) {
    throw new Error(
      `PayPal expanded order creation failed: ${data.message || JSON.stringify(data)}`
    );
  }

  if (!data.id) {
    throw new Error('PayPal expanded order response did not include an order ID.');
  }

  return {
    order: data,
    planConfig,
    requestBody
  };
}

export async function capturePayPalExpandedOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `tutovera-capture-${orderId}-${Date.now()}`
      },
      cache: 'no-store'
    }
  );

  const data = (await response.json()) as PayPalOrderResponse & { message?: string };

  if (!response.ok) {
    throw new Error(`PayPal expanded order capture failed: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

export function extractPayPalCaptureId(order: PayPalOrderResponse) {
  return order.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
}

export function extractPayPalCaptureStatus(order: PayPalOrderResponse) {
  return order.purchase_units?.[0]?.payments?.captures?.[0]?.status || order.status || '';
}

export function extractPayPalVaultTokenId(order: PayPalOrderResponse) {
  return (
    order.payment_source?.card?.attributes?.vault?.id ||
    order.payment_source?.paypal?.attributes?.vault?.id ||
    ''
  );
}

export function extractPayPalPayerId(order: PayPalOrderResponse) {
  return order.payer?.payer_id || order.payment_source?.paypal?.account_id || '';
}

export function extractCardSummary(order: PayPalOrderResponse) {
  const expiry = order.payment_source?.card?.expiry || '';
  const [expiryYear = '', expiryMonth = ''] = expiry.includes('-') ? expiry.split('-') : ['', ''];

  return {
    brand: order.payment_source?.card?.brand || null,
    lastDigits: order.payment_source?.card?.last_digits || null,
    expiryMonth: expiryMonth || null,
    expiryYear: expiryYear || null
  };
}

export async function verifyPayPalWebhookSignature({
  transmissionId,
  transmissionTime,
  certUrl,
  authAlgo,
  transmissionSig,
  webhookEvent
}: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookEvent: unknown;
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    throw new Error('Missing PAYPAL_WEBHOOK_ID.');
  }

  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal webhook verification failed: ${text}`);
  }

  const data = (await response.json()) as PayPalWebhookVerificationResponse;

  return data.verification_status === 'SUCCESS';
}

export type PayPalRenewalPaymentSourceType = 'card' | 'paypal';

export type CreatePayPalRenewalOrderInput = {
  subscriptionId: string;
  userId: string;
  plan: 'plus' | 'pro';
  billingInterval: 'monthly' | 'annual';
  paypalPaymentTokenId: string;
  amountCents: number;
  currency?: string;
  paymentSourceType?: PayPalRenewalPaymentSourceType;
  requestId?: string;
};

function getPayPalRenewalApiBaseUrl(): string {
  const mode = (
    process.env.PAYPAL_ENVIRONMENT ||
    process.env.PAYPAL_MODE ||
    process.env.PAYPAL_ENV ||
    ''
  )
    .trim()
    .toLowerCase();

  if (mode === 'live' || mode === 'production') {
    return 'https://api-m.paypal.com';
  }

  if (mode === 'sandbox' || mode === 'test' || mode === 'development') {
    return 'https://api-m.sandbox.paypal.com';
  }

  throw new Error(
    'Missing PayPal environment. Set PAYPAL_ENVIRONMENT to either "live" or "sandbox".',
  );
}

function formatPayPalRenewalAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

async function getPayPalRenewalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET.');
  }

  const response = await fetch(`${getPayPalRenewalApiBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      )}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(
      `Failed to get PayPal access token: ${
        typeof data?.message === 'string'
          ? data.message
          : JSON.stringify(data)
      }`,
    );
  }

  return data.access_token as string;
}

export async function createPayPalRenewalOrder(
  input: CreatePayPalRenewalOrderInput,
): Promise<any> {
  const accessToken = await getPayPalRenewalAccessToken();

  const currency = input.currency || 'USD';
  const paymentSourceType = input.paymentSourceType || 'card';

  const paymentSource =
    paymentSourceType === 'paypal'
      ? {
          paypal: {
            vault_id: input.paypalPaymentTokenId,
          },
        }
      : {
          card: {
            vault_id: input.paypalPaymentTokenId,
          },
        };

  const requestId =
    input.requestId ||
    `tutovera-renewal-${input.subscriptionId}-${Date.now()}`;

  const response = await fetch(`${getPayPalRenewalApiBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.subscriptionId,
          custom_id: `subscription:${input.subscriptionId}`,
          description: `TutoVera ${input.plan.toUpperCase()} ${input.billingInterval} renewal`,
          amount: {
            currency_code: currency,
            value: formatPayPalRenewalAmount(input.amountCents),
          },
        },
      ],
      payment_source: paymentSource,
    }),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Failed to create PayPal renewal order: ${
        typeof data?.message === 'string'
          ? data.message
          : JSON.stringify(data)
      }`,
    );
  }

  return data;
}