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
      `Cancel future renewals for your TutoVera ${planName} plan? If your current paid period is already active, your access will remain available until the end of that period.`
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
        setStatus(result.error || 'Unable to cancel future renewals.');
        return;
      }

      if (result.alreadyScheduled) {
        setStatus(
          result.message ||
            'Future renewals are already cancelled. Your paid access remains active until the end of the current billing period.'
        );
      } else if (result.cancellationMode === 'period_end') {
        setStatus(
          result.message ||
            'Future renewals have been cancelled. Your paid access remains active until the end of the current billing period.'
        );
      } else {
        setStatus(result.message || 'Your plan has been cancelled.');
      }

      router.refresh();
    } catch {
      setStatus('Unable to cancel future renewals right now. Please contact support.');
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