'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BillingCycle } from '@/lib/paypal';
import type { PlanKey } from '@/lib/plans';

type PayPalSubscriptionButtonProps = {
  plan: Exclude<PlanKey, 'free'>;
  monthlyPlanId: string;
  annualPlanId: string;
  isSignedIn: boolean;
};

type PayPalActions = {
  subscription: {
    create: (details: { plan_id: string }) => Promise<string>;
  };
};

type PayPalButtonsConfig = {
  style?: Record<string, string | number | boolean>;
  createSubscription: (_data: unknown, actions: PayPalActions) => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => Promise<void> | void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
};

type PayPalButtonInstance = {
  render: (selectorOrElement: string | HTMLElement) => Promise<void>;
  close?: () => void;
};

type PayPalNamespace = {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonInstance;
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let paypalScriptPromise: Promise<void> | null = null;

function loadPayPalScript(clientId: string) {
  if (typeof window === 'undefined') return Promise.resolve();

  if (window.paypal) return Promise.resolve();

  if (paypalScriptPromise) return paypalScriptPromise;

  paypalScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-tutovera-paypal]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('PayPal SDK failed to load.')));
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      vault: 'true',
      intent: 'subscription',
      currency: 'USD',
      components: 'buttons'
    });

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.tutoveraPaypal = 'true';
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('PayPal SDK failed to load.')));

    document.body.appendChild(script);
  });

  return paypalScriptPromise;
}

export default function PayPalSubscriptionButton({
  plan,
  monthlyPlanId,
  annualPlanId,
  isSignedIn
}: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  const selectedPlanId = useMemo(() => {
    return billingCycle === 'monthly' ? monthlyPlanId : annualPlanId;
  }, [annualPlanId, billingCycle, monthlyPlanId]);

  useEffect(() => {
    let isMounted = true;
    let renderedButtons: PayPalButtonInstance | null = null;

    async function renderButtons() {
      setStatusMessage('');

      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';

      if (!isSignedIn) {
        return;
      }

      if (!clientId) {
        setStatusMessage('PayPal client ID is not configured yet.');
        return;
      }

      if (!selectedPlanId) {
        setStatusMessage('PayPal plan ID is not configured yet.');
        return;
      }

      try {
        await loadPayPalScript(clientId);

        if (!isMounted || !containerRef.current || !window.paypal) return;

        renderedButtons = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'rect',
            color: 'gold',
            label: 'subscribe'
          },
          createSubscription: async (_data, actions) => {
            return actions.subscription.create({
              plan_id: selectedPlanId
            });
          },
          onApprove: async (data) => {
            const subscriptionId = data.subscriptionID;

            if (!subscriptionId) {
              setStatusMessage('PayPal did not return a subscription ID.');
              return;
            }

            setIsSaving(true);
            setStatusMessage('Saving your subscription...');

            const response = await fetch('/api/paypal/subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                subscriptionId,
                plan,
                billingCycle,
                paypalPlanId: selectedPlanId
              })
            });

            const result = (await response.json()) as { error?: string };

            setIsSaving(false);

            if (!response.ok) {
              setStatusMessage(result.error || 'Subscription was approved, but could not be saved.');
              return;
            }

            setStatusMessage('Subscription saved. Your TutoVera access is being updated.');
          },
          onCancel: () => {
            setStatusMessage('PayPal subscription approval was cancelled.');
          },
          onError: (error) => {
            console.error(error);
            setStatusMessage('PayPal could not load the subscription approval flow.');
          }
        });

        await renderedButtons.render(containerRef.current);
      } catch (error) {
        console.error(error);
        setStatusMessage(error instanceof Error ? error.message : 'PayPal button failed to load.');
      }
    }

    renderButtons();

    return () => {
      isMounted = false;

      if (renderedButtons?.close) {
        renderedButtons.close();
      }
    };
  }, [billingCycle, clientId, isSignedIn, monthlyPlanId, annualPlanId, plan, selectedPlanId]);

  if (!isSignedIn) {
    return (
      <div style={{ display: 'grid', gap: 10, width: '100%' }}>
        <a className="btn" href="/login">
          Log in to subscribe
        </a>
        <p className="small" style={{ margin: 0 }}>
          Sign in first so TutoVera can attach the subscription to your account.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 10, width: '100%' }}>
      <div className="themeSwitcher" style={{ width: 'fit-content' }}>
        <button
          type="button"
          className={`themeOption ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`themeOption ${billingCycle === 'annual' ? 'active' : ''}`}
          onClick={() => setBillingCycle('annual')}
        >
          Annual
        </button>
      </div>

      <div ref={containerRef} />

      {isSaving || statusMessage ? (
        <p className="small" style={{ margin: 0 }}>
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}