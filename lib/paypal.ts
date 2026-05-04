import type { PlanKey } from '@/lib/plans';

export type BillingCycle = 'monthly' | 'annual';

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
  } satisfies Record<Exclude<PlanKey, 'free'>, Record<BillingCycle, string>>;
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

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal subscription lookup failed: ${text}`);
  }

  return (await response.json()) as PayPalSubscription;
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