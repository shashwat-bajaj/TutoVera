import { Fragment } from 'react';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';
import { plans, type PlanKey } from '@/lib/plans';
import { formatPlanName, getPlanSummarySentence, getUserPlanAccess } from '@/lib/subscriptions';

const comparisonRows = [
  {
    group: 'Included in every plan',
    rows: [
      { label: 'All subject branches', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Student workspaces', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Parent workspaces', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Text-based tutoring', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Math graphing', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Tables and math formatting', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Saved history', free: 'Basic', plus: 'Extended', pro: 'Highest allowance' },
      {
        label: 'Read aloud and translation',
        free: 'Basic access',
        plus: 'Higher access',
        pro: 'Highest access'
      },
      { label: 'Tutor requests', free: '10/day', plus: '100/day', pro: '300/day' }
    ]
  },
  {
    group: 'Plus and Pro advantages',
    rows: [
      { label: 'Image uploads', free: 'Not included', plus: '100/month', pro: '500/month' },
      { label: 'Worksheet/photo help', free: 'Not included', plus: 'Included', pro: 'Advanced' },
      { label: 'Practice generation', free: 'Basic prompts', plus: 'Included', pro: 'Advanced' },
      {
        label: 'Mistake diagnosis',
        free: 'Not included',
        plus: 'Guided diagnosis',
        pro: 'Advanced diagnosis'
      },
      { label: 'Longer saved continuity', free: 'Limited', plus: 'Included', pro: 'Highest access' }
    ]
  },
  {
    group: 'Pro-focused tools',
    rows: [
      {
        label: 'Advanced worksheet/photo help',
        free: 'Not included',
        plus: 'Standard',
        pro: 'Advanced'
      },
      {
        label: 'Revision workflows',
        free: 'Not included',
        plus: 'Guided practice',
        pro: 'Deeper revision support'
      },
      {
        label: 'Mistake pattern tools',
        free: 'Not included',
        plus: 'Basic',
        pro: 'Advanced'
      },
      {
        label: 'Advanced subject tools',
        free: 'Not included',
        plus: 'Selected access',
        pro: 'Highest access'
      },
      {
        label: 'Future diagrams and simulators',
        free: 'Not included',
        plus: 'Selected access',
        pro: 'Highest access'
      }
    ]
  }
];

function getPlanHeadline(planKey: string) {
  if (planKey === 'free') return 'Start learning with text-based support';
  if (planKey === 'plus') return 'Best for regular homework and worksheets';
  return 'Best for deeper study and heavier usage';
}

function getPlanKeyPoints(planKey: string) {
  if (planKey === 'free') {
    return [
      'Text-based tutoring across subjects',
      'Student and parent workspaces',
      'Basic saved history',
      'A good way to try TutoVera'
    ];
  }

  if (planKey === 'plus') {
    return [
      'Higher daily tutor limits',
      'Worksheet/photo support access',
      'Extended saved history',
      'Practice and mistake diagnosis'
    ];
  }

  return [
    'Highest tutor request limits',
    'Larger worksheet/photo allowance',
    'Deeper revision workflows',
    'Best access to advanced tools'
  ];
}

function getPlanShortDescription(planKey: string) {
  if (planKey === 'free') {
    return 'A simple way to try TutoVera with text-based tutoring, parent support, and basic saved history.';
  }

  if (planKey === 'plus') {
    return 'The main study plan for students and families who use TutoVera regularly for homework and guided practice.';
  }

  return 'A deeper plan for heavier study periods, larger worksheet use, advanced review, and stronger continuity.';
}

function getPayPalPlanIds(planKey: PlanKey) {
  if (planKey === 'plus') {
    return {
      monthly: process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID || '',
      annual: process.env.NEXT_PUBLIC_PAYPAL_PLUS_ANNUAL_PLAN_ID || ''
    };
  }

  if (planKey === 'pro') {
    return {
      monthly: process.env.NEXT_PUBLIC_PAYPAL_PRO_MONTHLY_PLAN_ID || '',
      annual: process.env.NEXT_PUBLIC_PAYPAL_PRO_ANNUAL_PLAN_ID || ''
    };
  }

  return {
    monthly: '',
    annual: ''
  };
}

export default async function PricingPageContent() {
  const authClient = await createAuthClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  const isSignedIn = Boolean(user?.id);

  const supabase = createAdminSupabase();
  const planAccess = await getUserPlanAccess({
    supabase,
    userId: user?.id || null,
    email: user?.email || null
  });

  const currentPlanName = formatPlanName(planAccess.plan);
  const currentPlanSummary = getPlanSummarySentence(planAccess);

  return (
    <div className="pricingPage grid" style={{ gap: 24 }}>
      <section className="card spotlightCard pricingHero">
        <div style={{ display: 'grid', gap: 10 }}>
          <span className="badge">Pricing</span>
          <h1 style={{ margin: 0 }}>Choose the TutoVera plan that fits how you learn.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 920 }}>
            Start with free text-based tutoring, then upgrade when you want higher usage, worksheet
            and photo support, longer saved history, and deeper study workflows.
          </p>
        </div>

        <div className="pricingHeroNotes" aria-label="Pricing highlights">
          <div>
            <strong>One account</strong>
            <span>Your plan, settings, and history stay connected across subjects.</span>
          </div>
          <div>
            <strong>Student and parent support</strong>
            <span>Every plan includes both learning workspaces.</span>
          </div>
          <div>
            <strong>Upgrade when ready</strong>
            <span>Plus and Pro are built for regular study and worksheet-heavy use.</span>
          </div>
        </div>

        <div className="card questionSurface pricingCurrentPlan">
          <div style={{ display: 'grid', gap: 4 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>{isSignedIn ? `Current plan: ${currentPlanName}` : 'Not signed in'}</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              {isSignedIn
                ? currentPlanSummary
                : 'Log in before subscribing so TutoVera can attach the plan to your account.'}
            </p>
          </div>

          <div className="buttonRow" style={{ justifyContent: 'flex-end' }}>
            {isSignedIn ? (
              <a className="btn secondary" href="/account">
                View Account
              </a>
            ) : (
              <a className="btn secondary" href="/login?next=/pricing">
                Log in
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="pricingCardsSection" aria-label="Pricing plans">
        <div className="pricingCards">
          {plans.map((plan) => {
            const paypalPlanIds = getPayPalPlanIds(plan.key);
            const isCurrentPlan = plan.key === planAccess.plan;

            return (
              <div
                key={plan.key}
                className="card featureCard pricingPlanCard"
                style={{
                  borderColor: plan.highlighted ? 'var(--accent-warm-border)' : 'var(--border)'
                }}
              >
                <div className="pricingCardTop">
                  <div className="pricingPlanHeader">
                    <span className="badge">{isCurrentPlan ? 'Current plan' : plan.badge}</span>
                    {plan.highlighted ? (
                      <span className="pricingPlanAccent">Recommended</span>
                    ) : null}
                  </div>

                  <div className="pricingPlanTitleBlock">
                    <h2 style={{ margin: 0 }}>{plan.name}</h2>
                    <p className="small" style={{ margin: '6px 0 0' }}>
                      <strong>{getPlanHeadline(plan.key)}</strong>
                    </p>
                  </div>

                  <div className="pricingPriceBlock">
                    <div className="price">{plan.monthlyPrice}</div>
                    <p className="small" style={{ margin: 0 }}>
                      per month
                    </p>
                    <p className="small" style={{ margin: '8px 0 0' }}>
                      <strong>{plan.annualPrice}</strong>
                    </p>
                    <p className="small" style={{ margin: '4px 0 0' }}>
                      {plan.annualNote}
                    </p>
                  </div>

                  <p className="small pricingDescription">{getPlanShortDescription(plan.key)}</p>
                </div>

                <div className="pricingMiniStats">
                  <div className="card questionSurface pricingMiniStat">
                    <p className="small" style={{ margin: '0 0 4px' }}>
                      <strong>Daily tutor requests</strong>
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {plan.limits.tutorRequestsPerDay}
                    </p>
                  </div>

                  <div className="card questionSurface pricingMiniStat">
                    <p className="small" style={{ margin: '0 0 4px' }}>
                      <strong>Worksheet/photo support</strong>
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {plan.limits.imageUploadsPerMonth}
                    </p>
                  </div>

                  <div className="card questionSurface pricingMiniStat">
                    <p className="small" style={{ margin: '0 0 4px' }}>
                      <strong>Saved history</strong>
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {plan.limits.savedConversations}
                    </p>
                  </div>
                </div>

                <div className="pricingFeatureBlock pricingKeyFeatureBlock">
                  <p className="small" style={{ margin: 0 }}>
                    <strong>Key features</strong>
                  </p>

                  <ul className="list pricingFeatureList">
                    {getPlanKeyPoints(plan.key).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="pricingFeatureBlock pricingWhyBlock">
                  <p className="small" style={{ margin: 0 }}>
                    <strong>Best fit</strong>
                  </p>

                  <ul className="list pricingFeatureList">
                    {plan.paidValue.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="buttonRow pricingButtonRow">
                  {isCurrentPlan ? (
                    <a className="btn secondary" href="/account">
                      View Current Plan
                    </a>
                  ) : plan.key === 'free' ? (
                    <a className="btn secondary" href={plan.ctaHref}>
                      {isSignedIn ? 'Open Free Tutor' : plan.ctaLabel}
                    </a>
                  ) : (
                    <PayPalSubscriptionButton
                      plan={plan.key}
                      monthlyPlanId={paypalPlanIds.monthly}
                      annualPlanId={paypalPlanIds.annual}
                      isSignedIn={isSignedIn}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Paid plans are built around better study workflows.</h2>
          <p className="small" style={{ margin: 0, maxWidth: 900 }}>
            TutoVera’s paid value is not just more answers. Plus and Pro are designed around higher
            usage, worksheet and photo help, guided practice, mistake diagnosis, parent support, and
            saved continuity across subjects.
          </p>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/tutor">
            Try Student Workspace
          </a>
          <a className="btn secondary" href="/parents">
            Try Parent Workspace
          </a>
          <a className="btn secondary" href="/contact">
            Contact Support
          </a>
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 18 }}>
        <details className="pricingCompareDetails">
          <summary className="pricingCompareSummary">
            <span>
              <strong>Compare plans</strong>
            </span>
            <span className="pricingCompareSummaryText">Open full feature comparison</span>
          </summary>

          <div className="pricingComparePanel">
            <div style={{ display: 'grid', gap: 8 }}>
              <h2 style={{ margin: 0 }}>What changes when you upgrade?</h2>
              <p className="small" style={{ margin: 0, maxWidth: 860 }}>
                Free covers light text-based use. Plus is meant for regular study. Pro is meant for
                heavier study, more worksheet use, and deeper review workflows.
              </p>
            </div>

            <div className="pricingTableWrap">
              <table className="pricingTable">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>Plus</th>
                    <th>Pro</th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((group) => (
                    <Fragment key={group.group}>
                      <tr className="pricingTableGroupRow">
                        <td colSpan={4}>{group.group}</td>
                      </tr>

                      {group.rows.map((row) => (
                        <tr key={`${group.group}-${row.label}`}>
                          <td>{row.label}</td>
                          <td>{row.free}</td>
                          <td>{row.plus}</td>
                          <td>{row.pro}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Why worksheet and photo support belongs in paid plans</h2>
          <p className="small" style={{ margin: 0, maxWidth: 880 }}>
            Image-based learning support is more expensive to operate and most useful for regular
            study. Free keeps text tutoring available, while Plus and Pro are structured for higher
            usage, worksheet-heavy questions, and longer learning continuity.
          </p>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/pricing">
            Compare Plans
          </a>
          <a className="btn secondary" href="/contact">
            Ask a Question
          </a>
        </div>
      </section>

      <style>
        {`
          .pricingPage {
            width: 100%;
          }

          .pricingHero {
            display: grid;
            gap: 18px;
          }

          .pricingHeroNotes {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .pricingHeroNotes > div {
            display: grid;
            gap: 4px;
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: 18px;
            background: color-mix(in srgb, var(--surface) 88%, transparent);
          }

          .pricingHeroNotes strong {
            color: var(--text);
          }

          .pricingHeroNotes span {
            color: var(--text-soft);
            font-size: 0.9rem;
            line-height: 1.5;
          }

          .pricingCurrentPlan {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 16px;
            align-items: center;
            padding: 16px;
          }

          .pricingCardsSection {
            display: block;
            width: 100%;
            max-width: 100%;
            clear: both;
            float: none;
            grid-column: 1 / -1;
            margin-top: 2px;
            isolation: isolate;
          }

          .pricingCardsSection::before,
          .pricingCardsSection::after {
            content: '';
            display: table;
            clear: both;
          }

          .pricingCards {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            align-items: stretch;
            width: 100%;
            max-width: 100%;
            clear: both;
            float: none;
          }

          .pricingPlanCard {
            display: grid;
            grid-template-rows:
              minmax(286px, auto)
              minmax(238px, auto)
              minmax(178px, auto)
              minmax(158px, auto)
              auto;
            gap: 16px;
            min-width: 0;
            height: 100%;
            float: none;
          }

          .pricingCardTop {
            display: grid;
            gap: 12px;
            align-content: start;
            min-width: 0;
          }

          .pricingPlanHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .pricingPlanAccent {
            color: var(--accent-warm);
            font-size: 0.84rem;
            font-weight: 800;
          }

          .pricingPlanTitleBlock {
            min-height: 76px;
          }

          .pricingPriceBlock {
            min-height: 116px;
          }

          .pricingDescription {
            margin: 0;
          }

          .pricingMiniStats {
            display: grid;
            gap: 10px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
            align-content: start;
          }

          .pricingMiniStat {
            padding: 14px;
          }

          .pricingFeatureBlock {
            display: grid;
            gap: 10px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
            align-content: start;
          }

          .pricingFeatureList {
            margin-top: 0;
          }

          .pricingButtonRow {
            margin-top: auto;
            align-self: end;
          }

          .pricingCompareDetails {
            display: grid;
            gap: 16px;
          }

          .pricingCompareSummary {
            cursor: pointer;
            list-style: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
          }

          .pricingCompareSummary::-webkit-details-marker {
            display: none;
          }

          .pricingCompareSummary::after {
            content: '+';
            color: var(--text-soft);
            font-weight: 800;
            font-size: 1.2rem;
          }

          .pricingCompareDetails[open] .pricingCompareSummary::after {
            content: '−';
          }

          .pricingCompareSummaryText {
            color: var(--text-soft);
            font-size: 0.94rem;
            margin-left: auto;
          }

          .pricingComparePanel {
            display: grid;
            gap: 18px;
            padding-top: 18px;
            border-top: 1px solid var(--border);
          }

          .pricingTableWrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid var(--border);
            border-radius: 20px;
            background: color-mix(in srgb, var(--surface) 94%, transparent);
          }

          .pricingTable {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }

          .pricingTable th,
          .pricingTable td {
            text-align: left;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
          }

          .pricingTable th {
            color: var(--text);
            background: color-mix(in srgb, var(--surface-soft) 86%, transparent);
          }

          .pricingTable td {
            color: var(--text-soft);
          }

          .pricingTableGroupRow td {
            color: var(--text);
            font-weight: 750;
            background: color-mix(in srgb, var(--accent-secondary-soft) 72%, transparent);
          }

          .pricingTable tr:last-child td {
            border-bottom: 0;
          }

          @media (max-width: 1100px) {
            .pricingCards {
              grid-template-columns: 1fr;
            }

            .pricingPlanCard {
              grid-template-rows: none;
            }

            .pricingPlanTitleBlock,
            .pricingPriceBlock {
              min-height: 0;
            }
          }

          @media (max-width: 820px) {
            .pricingHeroNotes,
            .pricingCurrentPlan {
              grid-template-columns: 1fr;
            }

            .pricingCurrentPlan .buttonRow {
              justify-content: flex-start !important;
            }
          }

          @media (max-width: 760px) {
            .pricingCompareSummaryText {
              width: 100%;
              margin-left: 0;
            }
          }
        `}
      </style>
    </div>
  );
}