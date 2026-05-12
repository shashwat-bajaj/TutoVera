'use client';

import { useEffect, useState } from 'react';
import AnswerDisplay from '@/components/AnswerDisplay';

type ProRevisionReviewPanelProps = {
  conversationId: string;
};

type AccountPlanAccess = {
  signedIn: boolean;
  plan: string;
  hasActivePaidAccess: boolean;
};

export default function ProRevisionReviewPanel({
  conversationId
}: ProRevisionReviewPanelProps) {
  const [planAccess, setPlanAccess] = useState<AccountPlanAccess | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [review, setReview] = useState('');
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'idle' | 'info' | 'error' | 'success'>('idle');
  const [loading, setLoading] = useState(false);

  const hasProAccess =
    planAccess?.signedIn &&
    planAccess.plan === 'pro' &&
    planAccess.hasActivePaidAccess;

  useEffect(() => {
    async function loadPlanAccess() {
      setPlanLoading(true);

      try {
        const response = await fetch('/api/account/plan-access', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          setPlanAccess({
            signedIn: false,
            plan: 'free',
            hasActivePaidAccess: false
          });
          return;
        }

        const data = (await response.json()) as AccountPlanAccess;
        setPlanAccess(data);
      } catch {
        setPlanAccess({
          signedIn: false,
          plan: 'free',
          hasActivePaidAccess: false
        });
      } finally {
        setPlanLoading(false);
      }
    }

    void loadPlanAccess();
  }, []);

  async function generateRevisionReview() {
    if (loading || !conversationId) return;

    setLoading(true);
    setStatusKind('info');
    setStatus('Creating a Pro revision review from this saved session...');
    setReview('');

    try {
      const response = await fetch('/api/revision-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId
        })
      });

      const data = (await response.json()) as {
        review?: string;
        error?: string;
      };

      if (!response.ok || !data.review) {
        setStatusKind('error');
        setStatus(data.error || 'Revision Mode could not generate a review.');
        return;
      }

      setReview(data.review);
      setStatusKind('success');
      setStatus('Revision review created.');
    } catch {
      setStatusKind('error');
      setStatus('Revision Mode could not generate a review right now.');
    } finally {
      setLoading(false);
    }
  }

  if (planLoading) {
    return (
      <section className="card questionSurface proRevisionCard">
        <p className="small" style={{ margin: 0 }}>
          Checking Pro Revision Mode access...
        </p>

        <style>
          {`
            .proRevisionCard {
              display: grid;
              gap: 12px;
              padding: 16px;
              border-color: var(--accent-border);
            }
          `}
        </style>
      </section>
    );
  }

  if (!hasProAccess) {
    return (
      <section className="card questionSurface proRevisionCard">
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="badge">Pro Revision Mode</span>

          <div style={{ display: 'grid', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Turn this session into a revision review.</h3>
            <p className="small" style={{ margin: 0 }}>
              TutoVera Pro can convert saved sessions into study notes, weak-area review, practice
              questions, answer keys, and next-step revision guidance.
            </p>
          </div>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/pricing">
            View Pro Plan
          </a>
          <a className="btn secondary" href="/contact">
            Ask About Pro
          </a>
        </div>

        <style>
          {`
            .proRevisionCard {
              display: grid;
              gap: 14px;
              padding: 16px;
              border-color: var(--accent-border);
              background:
                linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 94%, transparent), var(--surface-soft)),
                radial-gradient(circle at top left, var(--accent-soft), transparent 36%);
            }
          `}
        </style>
      </section>
    );
  }

  return (
    <section className="card questionSurface proRevisionCard">
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="badge">Pro Revision Mode</span>

        <div style={{ display: 'grid', gap: 6 }}>
          <h3 style={{ margin: 0 }}>Create a revision review from this session.</h3>
          <p className="small" style={{ margin: 0 }}>
            Revision Mode turns this saved thread into study notes, weak-area review, practice
            questions, an answer key, and recommended next steps.
          </p>
        </div>
      </div>

      <div className="buttonRow">
        <button type="button" onClick={generateRevisionReview} disabled={loading}>
          {loading ? 'Creating Revision Review...' : review ? 'Regenerate Revision Review' : 'Create Revision Review'}
        </button>
      </div>

      {status ? (
        <p
          className="small"
          style={{
            margin: 0,
            color:
              statusKind === 'error'
                ? 'var(--accent-warm)'
                : statusKind === 'success'
                  ? 'var(--accent-secondary)'
                  : 'var(--text-soft)'
          }}
        >
          {status}
        </p>
      ) : null}

      {review ? (
        <div
          className="answerSurface"
          style={{
            display: 'grid',
            gap: 12,
            padding: 16,
            borderRadius: 20,
            border: '1px solid var(--border)'
          }}
        >
          <AnswerDisplay text={review} />
        </div>
      ) : null}

      <style>
        {`
          .proRevisionCard {
            display: grid;
            gap: 14px;
            padding: 16px;
            border-color: var(--accent-border);
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 94%, transparent), var(--surface-soft)),
              radial-gradient(circle at top left, var(--accent-soft), transparent 36%);
          }
        `}
      </style>
    </section>
  );
}