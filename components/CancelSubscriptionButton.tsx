'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CancelSubscriptionButtonProps = {
  planName: string;
};

export default function CancelSubscriptionButton({ planName }: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function cancelSubscription() {
    if (loading) return;

    const confirmed = window.confirm(
      `Cancel your TutoVera ${planName} subscription? This will cancel the PayPal subscription and return your account to the Free plan.`
    );

    if (!confirmed) return;

    setLoading(true);
    setStatus('Cancelling subscription...');

    try {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST'
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(result.error || 'Unable to cancel subscription.');
        return;
      }

      setStatus('Subscription cancelled. Your account has been moved to the Free plan.');
      router.refresh();
    } catch {
      setStatus('Unable to cancel subscription right now. Please contact support.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button className="secondary" onClick={cancelSubscription} disabled={loading}>
        {loading ? 'Cancelling...' : 'Cancel Subscription'}
      </button>

      {status ? (
        <p className="small" style={{ margin: 0 }}>
          {status}
        </p>
      ) : null}
    </div>
  );
}