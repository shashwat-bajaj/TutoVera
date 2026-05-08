'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CancelSubscriptionButtonProps = {
  planName: string;
};

type CancelSubscriptionResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  cancellationMode?: 'period_end' | 'immediate';
  currentPeriodEnd?: string | null;
  alreadyScheduled?: boolean;
};

export default function CancelSubscriptionButton({
  planName
}: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  async function cancelSubscription() {
    if (loading) return;

    const confirmed = window.confirm(
      `Cancel future renewals for your TutoVera ${planName} subscription? If your current plan period is already paid, your access will remain active until the end of that period.`
    );

    if (!confirmed) return;

    setLoading(true);
    setStatus('Cancelling future renewals...');

    try {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST'
      });

      const result = (await response.json()) as CancelSubscriptionResponse;

      if (!response.ok) {
        setStatus(result.error || 'Unable to cancel subscription.');
        return;
      }

      if (result.alreadyScheduled) {
        setStatus(
          result.message ||
            'Your subscription is already scheduled to end at the end of the current billing period.'
        );
      } else if (result.cancellationMode === 'period_end') {
        setStatus(
          result.message ||
            'Your renewal has been cancelled. Your paid access remains active until the end of the current billing period.'
        );
      } else {
        setStatus(result.message || 'Subscription cancelled.');
      }

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
        {loading ? 'Cancelling...' : 'Cancel Renewal'}
      </button>

      {status ? (
        <p className="small" style={{ margin: 0 }}>
          {status}
        </p>
      ) : null}
    </div>
  );
}