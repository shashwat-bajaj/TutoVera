'use client';

import { useEffect, useState } from 'react';
import AnswerDisplay from '@/components/AnswerDisplay';

type ProRevisionReviewPanelProps = {
  conversationId?: string | null;
};

type AccountPlanAccess = {
  signedIn: boolean;
  plan: string;
  hasActivePaidAccess: boolean;
};

type ReviewType = 'revision' | 'mistake';

type ReviewState = {
  revision: string;
  mistake: string;
};

function getReviewLabel(reviewType: ReviewType) {
  return reviewType === 'mistake' ? 'Mistake Review' : 'Revision Review';
}

function getLoadingMessage(reviewType: ReviewType) {
  if (reviewType === 'mistake') {
    return 'Creating a mistake review from this saved session...';
  }

  return 'Creating a revision review from this saved session...';
}

function getFailureMessage(reviewType: ReviewType) {
  if (reviewType === 'mistake') {
    return 'Mistake Review could not generate a review right now.';
  }

  return 'Revision Review could not generate a review right now.';
}

export default function ProRevisionReviewPanel({
  conversationId
}: ProRevisionReviewPanelProps) {
  const [planAccess, setPlanAccess] = useState<AccountPlanAccess | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [activeReviewType, setActiveReviewType] = useState<ReviewType>('revision');
  const [reviews, setReviews] = useState<ReviewState>({
    revision: '',
    mistake: ''
  });
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'idle' | 'info' | 'error' | 'success'>('idle');
  const [loadingReviewType, setLoadingReviewType] = useState<ReviewType | null>(null);

  const hasProAccess =
    planAccess?.signedIn &&
    planAccess.plan === 'pro' &&
    planAccess.hasActivePaidAccess;

  const hasSavedSession = Boolean(conversationId);
  const activeReview = reviews[activeReviewType];

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

  async function generateReview(reviewType: ReviewType) {
    if (loadingReviewType || !conversationId) return;

    setActiveReviewType(reviewType);
    setLoadingReviewType(reviewType);
    setStatusKind('info');
    setStatus(getLoadingMessage(reviewType));

    setReviews((current) => ({
      ...current,
      [reviewType]: ''
    }));

    try {
      const response = await fetch('/api/revision-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          reviewType
        })
      });

      const data = (await response.json()) as {
        review?: string;
        error?: string;
      };

      if (!response.ok || !data.review) {
        setStatusKind('error');
        setStatus(data.error || `${getReviewLabel(reviewType)} could not generate a review.`);
        return;
      }

      setReviews((current) => ({
        ...current,
        [reviewType]: data.review || ''
      }));

      setStatusKind('success');
      setStatus(`${getReviewLabel(reviewType)} created.`);
    } catch {
      setStatusKind('error');
      setStatus(getFailureMessage(reviewType));
    } finally {
      setLoadingReviewType(null);
    }
  }

  if (planLoading) {
    return (
      <section className="card questionSurface studyToolsCard">
        <p className="small" style={{ margin: 0 }}>
          Checking Study Tools access...
        </p>

        <style>
          {`
            .studyToolsCard {
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
      <section className="card questionSurface studyToolsCard">
        <div style={{ display: 'grid', gap: 8 }}>
          <span className="badge">Study Tools</span>

          <div style={{ display: 'grid', gap: 6 }}>
            <h3 style={{ margin: 0 }}>Turn saved sessions into deeper study support.</h3>
            <p className="small" style={{ margin: 0 }}>
              TutoVera Study Tools can convert saved sessions into revision reviews, mistake
              reviews, study notes, weak-area checks, targeted practice, answer keys, and next-step
              guidance. Revision Review and Mistake Review are included with Pro.
            </p>
          </div>
        </div>

        <div className="studyToolPreviewGrid" aria-label="Study tool previews">
          <div className="card innerFeatureCard studyToolPreview">
            <p className="small" style={{ margin: 0 }}>
              <strong>Revision Review</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              Summaries, key concepts, clean notes, practice questions, and review next steps.
            </p>
          </div>

          <div className="card innerFeatureCard studyToolPreview">
            <p className="small" style={{ margin: 0 }}>
              <strong>Mistake Review</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              Confirmed mistakes, likely weak areas, corrected reasoning, and targeted drills.
            </p>
          </div>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/pricing">
            View Plans
          </a>
          <a className="btn secondary" href="/contact">
            Ask About Pro
          </a>
        </div>

        <style>
          {`
            .studyToolsCard {
              display: grid;
              gap: 14px;
              padding: 16px;
              border-color: var(--accent-border);
              background:
                linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 94%, transparent), var(--surface-soft)),
                radial-gradient(circle at top left, var(--accent-soft), transparent 36%);
            }

            .studyToolPreviewGrid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 12px;
            }

            .studyToolPreview {
              display: grid;
              gap: 6px;
              padding: 14px;
            }
          `}
        </style>
      </section>
    );
  }

  return (
    <section className="card questionSurface studyToolsCard">
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="badge">Study Tools</span>

        <div style={{ display: 'grid', gap: 6 }}>
          <h3 style={{ margin: 0 }}>Create deeper reviews from this saved session.</h3>
          <p className="small" style={{ margin: 0 }}>
            Use Revision Review for broad study notes, or Mistake Review for a focused weak-area
            and corrected-reasoning breakdown.
          </p>
        </div>
      </div>

      {!hasSavedSession ? (
        <div
          className="card innerFeatureCard"
          style={{
            display: 'grid',
            gap: 6,
            padding: 14
          }}
        >
          <p className="small" style={{ margin: 0 }}>
            <strong>Ask TutoVera at least once first.</strong>
          </p>
          <p className="small" style={{ margin: 0 }}>
            Once this workspace has a saved session, Study Tools can generate a Revision Review or
            Mistake Review from the conversation.
          </p>
        </div>
      ) : null}

      <div className="studyToolGrid">
        <div className="card innerFeatureCard studyToolCard">
          <div style={{ display: 'grid', gap: 6 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Revision Review</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              Create a full study review with summary, key concepts, clean notes, practice
              questions, answer key, and next steps.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void generateReview('revision')}
            disabled={!hasSavedSession || Boolean(loadingReviewType)}
          >
            {loadingReviewType === 'revision'
              ? 'Creating Revision Review...'
              : reviews.revision
                ? 'Regenerate Revision Review'
                : 'Create Revision Review'}
          </button>
        </div>

        <div className="card innerFeatureCard studyToolCard">
          <div style={{ display: 'grid', gap: 6 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Mistake Review</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              Create a targeted review of confirmed mistakes, possible weak areas, corrected
              reasoning, and practice drills.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void generateReview('mistake')}
            disabled={!hasSavedSession || Boolean(loadingReviewType)}
          >
            {loadingReviewType === 'mistake'
              ? 'Creating Mistake Review...'
              : reviews.mistake
                ? 'Regenerate Mistake Review'
                : 'Create Mistake Review'}
          </button>
        </div>
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

      {(reviews.revision || reviews.mistake) ? (
        <div className="studyToolTabs" role="tablist" aria-label="Generated study reviews">
          <button
            type="button"
            className={`secondary studyToolTab ${
              activeReviewType === 'revision' ? 'active' : ''
            }`}
            onClick={() => setActiveReviewType('revision')}
            disabled={!reviews.revision}
          >
            Revision Review
          </button>

          <button
            type="button"
            className={`secondary studyToolTab ${
              activeReviewType === 'mistake' ? 'active' : ''
            }`}
            onClick={() => setActiveReviewType('mistake')}
            disabled={!reviews.mistake}
          >
            Mistake Review
          </button>
        </div>
      ) : null}

      {activeReview ? (
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
          <AnswerDisplay text={activeReview} />
        </div>
      ) : null}

      <style>
        {`
          .studyToolsCard {
            display: grid;
            gap: 14px;
            padding: 16px;
            border-color: var(--accent-border);
            background:
              linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 94%, transparent), var(--surface-soft)),
              radial-gradient(circle at top left, var(--accent-soft), transparent 36%);
          }

          .studyToolGrid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .studyToolCard {
            display: grid;
            gap: 12px;
            padding: 14px;
            align-content: space-between;
          }

          .studyToolTabs {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .studyToolTab.active {
            border-color: var(--accent-border);
            color: var(--text);
          }

          @media (max-width: 760px) {
            .studyToolGrid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </section>
  );
}