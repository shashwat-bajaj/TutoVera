'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BillingCycle, ExpandedPaymentSource, PaidPlanKey } from '@/lib/paypal';

type PayPalExpandedCheckoutProps = {
  plan: PaidPlanKey;
  isSignedIn: boolean;
};

type PayPalCardField = {
  render: (selectorOrElement: string | HTMLElement) => Promise<void>;
};

type PayPalCardFieldsInstance = {
  isEligible: () => boolean;
  NameField: (config?: Record<string, unknown>) => PayPalCardField;
  NumberField: (config?: Record<string, unknown>) => PayPalCardField;
  ExpiryField: (config?: Record<string, unknown>) => PayPalCardField;
  CVVField: (config?: Record<string, unknown>) => PayPalCardField;
  submit: () => Promise<void>;
  close?: () => void;
};

declare global {
  interface Window {
    paypal?: any;
  }
}

let expandedPayPalScriptPromise: Promise<void> | null = null;
let expandedPayPalScriptClientId = '';

function loadExpandedPayPalScript(clientId: string) {
  if (typeof window === 'undefined') return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-tutovera-paypal-expanded]'
  );

  const existingClientId = existingScript?.dataset.paypalClientId || '';

  if (window.paypal?.CardFields && expandedPayPalScriptClientId === clientId) {
    return Promise.resolve();
  }

  if (window.paypal?.CardFields && existingClientId === clientId) {
    expandedPayPalScriptClientId = clientId;
    return Promise.resolve();
  }

  if (
    expandedPayPalScriptPromise &&
    expandedPayPalScriptClientId === clientId
  ) {
    return expandedPayPalScriptPromise;
  }

  if (existingScript && existingClientId && existingClientId !== clientId) {
    existingScript.remove();
    window.paypal = undefined;
    expandedPayPalScriptPromise = null;
    expandedPayPalScriptClientId = '';
  }

  const matchingScript = document.querySelector<HTMLScriptElement>(
    `script[data-tutovera-paypal-expanded][data-paypal-client-id="${clientId}"]`
  );

  if (matchingScript) {
    expandedPayPalScriptClientId = clientId;

    expandedPayPalScriptPromise = new Promise<void>((resolve, reject) => {
      if (window.paypal?.CardFields) {
        resolve();
        return;
      }

      matchingScript.addEventListener('load', () => resolve());
      matchingScript.addEventListener('error', () =>
        reject(new Error('PayPal secure card checkout failed to load.'))
      );
    });

    return expandedPayPalScriptPromise;
  }

  expandedPayPalScriptClientId = clientId;

  expandedPayPalScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      currency: 'USD',
      intent: 'capture',
      components: 'card-fields',
      'disable-funding': 'paylater,venmo'
    });

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.tutoveraPaypalExpanded = 'true';
    script.dataset.paypalClientId = clientId;

    script.addEventListener('load', () => resolve());

    script.addEventListener('error', () => {
      expandedPayPalScriptPromise = null;
      expandedPayPalScriptClientId = '';
      reject(new Error('PayPal secure card checkout failed to load.'));
    });

    document.body.appendChild(script);
  });

  return expandedPayPalScriptPromise;
}

function getPlanName(plan: PaidPlanKey) {
  return plan === 'pro' ? 'Pro' : 'Plus';
}

function getBillingLabel(billingCycle: BillingCycle) {
  return billingCycle === 'annual' ? 'Annual' : 'Monthly';
}

function getPriceLabel(plan: PaidPlanKey, billingCycle: BillingCycle) {
  if (plan === 'plus' && billingCycle === 'monthly') return '$9.99/month';
  if (plan === 'plus' && billingCycle === 'annual') return '$99.99/year';
  if (plan === 'pro' && billingCycle === 'monthly') return '$19.99/month';
  return '$199.99/year';
}

function getPlanDescription(plan: PaidPlanKey) {
  if (plan === 'plus') {
    return 'Higher usage, worksheet and image support, extended history, and guided practice for regular study.';
  }

  return 'The highest TutoVera access for heavier study, larger worksheet use, and deeper revision workflows.';
}

export default function PayPalExpandedCheckout({ plan, isSignedIn }: PayPalExpandedCheckoutProps) {
  const router = useRouter();

  const cardNameRef = useRef<HTMLDivElement | null>(null);
  const cardNumberRef = useRef<HTMLDivElement | null>(null);
  const cardExpiryRef = useRef<HTMLDivElement | null>(null);
  const cardCvvRef = useRef<HTMLDivElement | null>(null);
  const cardFieldsRef = useRef<PayPalCardFieldsInstance | null>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [showCardCheckout, setShowCardCheckout] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusKind, setStatusKind] = useState<'idle' | 'info' | 'success' | 'error'>('idle');
  const [isWorking, setIsWorking] = useState(false);
  const [cardFieldsEligible, setCardFieldsEligible] = useState(false);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);
  const [cardFieldsPreparing, setCardFieldsPreparing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const planName = getPlanName(plan);
  const selectedPrice = getPriceLabel(plan, billingCycle);

  function clearRenderedCardFields() {
    if (cardNameRef.current) cardNameRef.current.innerHTML = '';
    if (cardNumberRef.current) cardNumberRef.current.innerHTML = '';
    if (cardExpiryRef.current) cardExpiryRef.current.innerHTML = '';
    if (cardCvvRef.current) cardCvvRef.current.innerHTML = '';
  }

  function closeCurrentCardFields() {
    if (cardFieldsRef.current?.close) {
      cardFieldsRef.current.close();
    }

    cardFieldsRef.current = null;
    clearRenderedCardFields();
  }

  async function createOrder(source: ExpandedPaymentSource) {
    const response = await fetch('/api/paypal/expanded/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan,
        billingCycle,
        source
      })
    });

    const result = (await response.json()) as { id?: string; error?: string };

    if (!response.ok || !result.id) {
      throw new Error(result.error || 'Unable to create secure card checkout order.');
    }

    return result.id;
  }

  async function captureOrder(orderId: string) {
    setIsWorking(true);
    setStatusKind('info');
    setStatusMessage('Confirming your TutoVera checkout...');

    const response = await fetch('/api/paypal/expanded/capture-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId
      })
    });

    const result = (await response.json()) as {
      error?: string;
      hasPaymentToken?: boolean;
      nextRenewalAt?: string;
    };

    setIsWorking(false);

    if (!response.ok) {
      throw new Error(
        result.error ||
          'The payment was approved, but TutoVera could not complete the account update.'
      );
    }

    setStatusKind('success');

    if (result.hasPaymentToken) {
      setStatusMessage(
        `You're on TutoVera ${planName}. Your access is active and recurring billing has been set up.`
      );
    } else {
      setStatusMessage(
        `You're on TutoVera ${planName}. Your access is active while PayPal finishes attaching the saved payment method.`
      );
    }

    router.refresh();
  }

  useEffect(() => {
    let isMounted = true;

    async function renderCardCheckout() {
      setCardFieldsEligible(false);
      setCardFieldsReady(false);
      setCardFieldsPreparing(false);

      if (!isSignedIn || !showCardCheckout) return;

      if (!clientId) {
        setStatusKind('error');
        setStatusMessage('Secure card checkout is not configured yet.');
        return;
      }

      if (
        !cardNameRef.current ||
        !cardNumberRef.current ||
        !cardExpiryRef.current ||
        !cardCvvRef.current
      ) {
        setStatusKind('error');
        setStatusMessage('Secure card checkout could not find the card field containers.');
        return;
      }

      setCardFieldsPreparing(true);
      closeCurrentCardFields();

      try {
        await loadExpandedPayPalScript(clientId);

        if (!isMounted || !window.paypal) return;

        if (!window.paypal.CardFields) {
          setCardFieldsEligible(false);
          setCardFieldsPreparing(false);
          setStatusKind('error');
          setStatusMessage(
            'Secure card checkout is not available for this PayPal setup yet. Please contact support or try again later.'
          );
          return;
        }

        const cardFields = window.paypal.CardFields({
          style: {
            input: {
              color: '#0B1D3A',
              'font-size': '16px',
              'font-family':
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
            },
            '.invalid': {
              color: '#FF7A1A'
            },
            ':focus': {
              color: '#0B1D3A'
            }
          },
          createOrder: async () => {
            return createOrder('card');
          },
          onApprove: async (data: unknown) => {
            const orderId =
              typeof data === 'object' && data
                ? ((data as { orderID?: string; orderId?: string }).orderID ||
                    (data as { orderID?: string; orderId?: string }).orderId ||
                    '')
                : '';

            if (!orderId) {
              throw new Error('Secure card checkout did not return an order ID.');
            }

            await captureOrder(orderId);
          },
          onError: (error: unknown) => {
            console.error(error);
            setStatusKind('error');
            setStatusMessage('The secure card checkout could not be completed.');
            setIsWorking(false);
            setCardFieldsPreparing(false);
          },
          onCancel: () => {
            setStatusKind('info');
            setStatusMessage('Card checkout was cancelled.');
            setCardFieldsPreparing(false);
          }
        });

        cardFieldsRef.current = cardFields;

        if (!cardFields.isEligible()) {
          setCardFieldsEligible(false);
          setCardFieldsReady(false);
          setCardFieldsPreparing(false);
          setStatusKind('error');
          setStatusMessage(
            'Secure card checkout is not available for this PayPal setup yet. This usually needs PayPal card-payment eligibility to be enabled on the PayPal business account.'
          );
          return;
        }

        setCardFieldsEligible(true);

        await Promise.all([
          cardFields.NameField({
            placeholder: 'Name on card'
          }).render(cardNameRef.current),
          cardFields.NumberField({
            placeholder: 'Card number'
          }).render(cardNumberRef.current),
          cardFields.ExpiryField({
            placeholder: 'MM/YY'
          }).render(cardExpiryRef.current),
          cardFields.CVVField({
            placeholder: 'CVV'
          }).render(cardCvvRef.current)
        ]);

        if (!isMounted) return;

        setCardFieldsReady(true);
        setCardFieldsPreparing(false);
        setStatusKind('idle');
        setStatusMessage('');
      } catch (error) {
        console.error(error);
        setCardFieldsEligible(false);
        setCardFieldsReady(false);
        setCardFieldsPreparing(false);
        setStatusKind('error');
        setStatusMessage(
          error instanceof Error ? error.message : 'Secure card checkout failed to load.'
        );
      }
    }

    void renderCardCheckout();

    return () => {
      isMounted = false;
      closeCurrentCardFields();
      setCardFieldsPreparing(false);
    };
  }, [billingCycle, clientId, isSignedIn, plan, planName, router, showCardCheckout]);

  function resetCheckoutForBillingCycle(nextBillingCycle: BillingCycle) {
    setBillingCycle(nextBillingCycle);
    setStatusKind('idle');
    setStatusMessage('');
    setCardFieldsEligible(false);
    setCardFieldsReady(false);
    setCardFieldsPreparing(false);
    closeCurrentCardFields();
  }

  function openCardCheckout() {
    setShowCardCheckout(true);
    setStatusKind('idle');
    setStatusMessage('');
  }

  function closeCardCheckout() {
    setShowCardCheckout(false);
    setStatusKind('idle');
    setStatusMessage('');
    setCardFieldsEligible(false);
    setCardFieldsReady(false);
    setCardFieldsPreparing(false);
    closeCurrentCardFields();
  }

  async function submitCardFields() {
    if (!cardFieldsRef.current || isWorking || !cardFieldsReady) return;

    setIsWorking(true);
    setStatusKind('info');
    setStatusMessage('Securely submitting card details...');

    try {
      await cardFieldsRef.current.submit();
    } catch (error) {
      console.error(error);
      setIsWorking(false);
      setStatusKind('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'The card payment could not be submitted. Please check the details and try again.'
      );
    }
  }

  if (!isSignedIn) {
    return (
      <div style={{ display: 'grid', gap: 10, width: '100%', minWidth: 0 }}>
        <a className="btn" href="/login?next=/pricing">
          Log in to check out
        </a>
        <p className="small" style={{ margin: 0 }}>
          Sign in first so TutoVera can attach the plan to your account.
        </p>
      </div>
    );
  }

  if (statusKind === 'success') {
    return (
      <div
        className="card questionSurface expandedCheckoutCard"
        style={{
          display: 'grid',
          gap: 12,
          width: '100%',
          padding: 16,
          borderColor: 'var(--accent-border)'
        }}
      >
        <p className="small expandedCheckoutStatus" style={{ margin: 0 }}>
          <strong>{statusMessage}</strong>
        </p>

        <div className="buttonRow">
          <a className="btn" href="/account">
            View Account
          </a>
          <a className="btn secondary" href="/tutor">
            Start Learning
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card questionSurface expandedCheckoutCard"
      style={{
        display: 'grid',
        gap: 14,
        width: '100%',
        padding: 16
      }}
    >
      <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
        <p className="small" style={{ margin: 0 }}>
          <strong>Secure TutoVera checkout</strong>
        </p>
        <p className="small" style={{ margin: 0 }}>
          {getPlanDescription(plan)}
        </p>
      </div>

      <div className="themeSwitcher expandedBillingSwitcher">
        <button
          type="button"
          className={`themeOption ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => resetCheckoutForBillingCycle('monthly')}
          disabled={isWorking}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`themeOption ${billingCycle === 'annual' ? 'active' : ''}`}
          onClick={() => resetCheckoutForBillingCycle('annual')}
          disabled={isWorking}
        >
          Annual
        </button>
      </div>

      <div
        className="card innerFeatureCard"
        style={{
          display: 'grid',
          gap: 4,
          padding: 14,
          minWidth: 0
        }}
      >
        <p className="small" style={{ margin: 0 }}>
          Selected plan
        </p>
        <p className="small expandedCheckoutStatus" style={{ margin: 0 }}>
          <strong>
            TutoVera {planName} · {getBillingLabel(billingCycle)} · {selectedPrice}
          </strong>
        </p>
      </div>

      {!showCardCheckout ? (
        <div
          className="card innerFeatureCard"
          style={{
            display: 'grid',
            gap: 10,
            padding: 14,
            minWidth: 0
          }}
        >
          <p className="small" style={{ margin: 0 }}>
            Pay securely with a credit or debit card.
          </p>

          <button type="button" onClick={openCardCheckout} disabled={isWorking}>
            Continue to secure card checkout
          </button>

          <p className="small" style={{ margin: 0 }}>
            Secure card processing by PayPal. TutoVera stores only the PayPal order, capture,
            and saved-payment identifiers needed for recurring access.
          </p>
        </div>
      ) : (
        <div
          className="card innerFeatureCard"
          style={{
            display: 'grid',
            gap: 10,
            padding: 14,
            minWidth: 0
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 8,
              minWidth: 0
            }}
          >
            <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
              <p className="small" style={{ margin: 0 }}>
                <strong>Card details</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                Enter your card details below:
              </p>
            </div>

            <button
              type="button"
              className="secondary expandedBackButton"
              onClick={closeCardCheckout}
              disabled={isWorking}
            >
              Back to checkout summary
            </button>
          </div>

          <div className="expandedCardFieldsGrid">
            <div className="expandedCardFieldFull">
              <label>Name on card</label>
              <div ref={cardNameRef} className="expandedCardField" />
            </div>

            <div className="expandedCardFieldFull">
              <label>Card number</label>
              <div ref={cardNumberRef} className="expandedCardField" />
            </div>

            <div>
              <label>Expiration</label>
              <div ref={cardExpiryRef} className="expandedCardField" />
            </div>

            <div>
              <label>Security code</label>
              <div ref={cardCvvRef} className="expandedCardField" />
            </div>

            <button
              type="button"
              onClick={submitCardFields}
              disabled={!cardFieldsReady || isWorking}
              className="expandedCardSubmit"
            >
              {isWorking ? 'Processing...' : `Start ${planName} · ${selectedPrice}`}
            </button>
          </div>

          {!cardFieldsReady && cardFieldsPreparing ? (
            <p className="small" style={{ margin: 0 }}>
              Preparing secure card fields...
            </p>
          ) : null}

          {!cardFieldsReady && !cardFieldsPreparing && !cardFieldsEligible && statusKind !== 'error' ? (
            <p className="small" style={{ margin: 0 }}>
              Secure card checkout is preparing. If it does not appear, PayPal card checkout may
              not be enabled for this account yet.
            </p>
          ) : null}

          <p className="small" style={{ margin: 0 }}>
            Secure card processing by PayPal. TutoVera stores only the PayPal order, capture,
            and saved-payment identifiers needed for recurring access.
          </p>
        </div>
      )}

      {isWorking || statusMessage ? (
        <p
          className="small expandedCheckoutStatus"
          style={{
            margin: 0,
            color: statusKind === 'error' ? 'var(--accent-warm)' : 'var(--text-soft)'
          }}
        >
          {statusMessage}
        </p>
      ) : null}

      <style>
        {`
          .expandedCheckoutCard {
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
          }

          .expandedCheckoutCard * {
            max-width: 100%;
            min-width: 0;
          }

          .expandedCheckoutStatus {
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
            white-space: pre-wrap;
          }

          .expandedBillingSwitcher {
            width: fit-content;
            max-width: 100%;
            flex-wrap: wrap;
          }

          .expandedCardFieldsGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            max-width: 100%;
            min-width: 0;
          }

          .expandedCardFieldFull {
            grid-column: 1 / -1;
          }

          .expandedCardFieldFull label,
          .expandedCardFieldsGrid label {
            display: block;
            margin: 0 0 6px;
            font-size: 0.88rem;
            color: var(--text-soft);
          }

          .expandedCardField {
            min-height: 50px;
            border-radius: 16px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            padding: 0;
            overflow: hidden;
            transition:
              border-color 0.2s var(--ease-premium),
              box-shadow 0.2s var(--ease-premium);
          }

          .expandedCardField > iframe {
            min-height: 50px !important;
          }

          .expandedCardField:focus-within {
            border-color: color-mix(in srgb, var(--accent-secondary) 58%, white 42%);
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-secondary) 14%, transparent);
          }

          .expandedCardSubmit {
            grid-column: 1 / -1;
            width: 100%;
          }

          .expandedBackButton {
            width: fit-content;
          }

          @media (max-width: 640px) {
            .expandedCardFieldsGrid {
              grid-template-columns: 1fr;
            }

            .expandedBackButton,
            .expandedBillingSwitcher {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}