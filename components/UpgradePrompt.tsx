import Link from 'next/link';
import type { PlanKey } from '@/lib/plans';

type UpgradePromptProps = {
  title?: string;
  description?: string;
  featureLabel?: string;
  recommendedPlan?: Exclude<PlanKey, 'free'>;
  compact?: boolean;
};

export default function UpgradePrompt({
  title = 'Upgrade to unlock this feature.',
  description = 'This feature is included with paid TutoVera plans so regular learners can access higher limits and more advanced study tools.',
  featureLabel = 'Paid feature',
  recommendedPlan = 'plus',
  compact = false
}: UpgradePromptProps) {
  const planName = recommendedPlan === 'pro' ? 'Pro' : 'Plus';

  return (
    <section
      className="card"
      style={{
        display: 'grid',
        gap: compact ? 12 : 16,
        padding: compact ? 16 : 20,
        borderColor: 'var(--accent-border)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 92%, transparent), var(--surface-soft)), radial-gradient(circle at top left, var(--accent-soft), transparent 34%)'
      }}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="badge">{featureLabel}</span>

        <div style={{ display: 'grid', gap: 6 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p className="small" style={{ margin: 0 }}>
            {description}
          </p>
        </div>
      </div>

      <div className="buttonRow">
        <Link className="btn" href="/pricing">
          View Plans
        </Link>
        <Link className="btn secondary" href="/contact">
          Ask About {planName}
        </Link>
      </div>
    </section>
  );
}