import { Fragment } from 'react';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import PayPalSubscriptionButton from '@/components/PayPalSubscriptionButton';
import { plans, type PlanKey } from '@/lib/plans';

const comparisonRows = [
  {
    group: 'Included in every plan',
    rows: [
      { label: 'All subjects', free: 'Included', plus: 'Included', pro: 'Included' },
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
    group: 'Included in Plus and Pro',
    rows: [
      { label: 'Image uploads', free: 'Not included', plus: '100/month', pro: '500/month' },
      { label: 'Worksheet/photo help', free: 'Not included', plus: 'Included', pro: 'Advanced' },
      { label: 'Practice generation', free: 'Basic prompts', plus: 'Included', pro: 'Advanced' },
      {
        label: 'Mistake diagnosis',
        free: 'Not included',
        plus: 'Basic diagnosis',
        pro: 'Advanced diagnosis'
      },
      { label: 'Longer saved continuity', free: 'Limited', plus: 'Included', pro: 'Highest access' }
    ]
  },
  {
    group: 'Pro-focused advantages',
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
        pro: 'Revision Mode planned'
      },
      {
        label: 'Mistake pattern tools',
        free: 'Not included',
        plus: 'Basic',
        pro: 'Mistake Map planned'
      },
      {
        label: 'Advanced subject tools',
        free: 'Not included',
        plus: 'Early access',
        pro: 'Highest access'
      },
      {
        label: 'Future diagrams and simulators',
        free: 'Not included',
        plus: 'Limited early access',
        pro: 'Highest access'
      }
    ]
  }
];

function getPlanHeadline(planKey: string) {
  if (planKey === 'free') return 'Try TutoVera';
  if (planKey === 'plus') return 'Study with worksheets and photos';
  return 'Go deeper with revision and advanced tools';
}

function getPlanKeyPoints(planKey: string) {
  if (planKey === 'free') {
    return [
      'Text-based tutoring across all subjects',
      'Student and parent workspaces',
      'Basic saved history',
      'No worksheet/photo support'
    ];
  }

  if (planKey === 'plus') {
    return [
      'Worksheet/photo support included',
      'Higher daily tutor limits',
      'Extended saved history',
      'Practice and mistake diagnosis'
    ];
  }

  return [
    'Advanced worksheet/photo help',
    'Deeper revision workflows',
    'Mistake pattern tools planned',
    'Highest access to future tools'
  ];
}

function getPlanShortDescription(planKey: string) {
  if (planKey === 'free') {
    return 'A simple way to try TutoVera with text-based tutoring and basic saved history.';
  }

  if (planKey === 'plus') {
    return 'The main study plan for regular users who want worksheets, photos, and guided practice.';
  }

  return 'A deeper study plan for heavier usage, revision workflows, and advanced subject tools.';
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

  return (
    <div className="pricingPage grid" style={{ gap: 24 }}>
      <section className="card spotlightCard pricingHero">
        <div style={{ display: 'grid', gap: 10 }}>
          <h1 style={{ margin: 0 }}>Choose the support level that fits how you study.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 920 }}>
            TutoVera is currently in free beta while sandbox billing is being tested. Free helps
            users try the tutor, Plus unlocks worksheet/photo support for regular study, and Pro is
            designed for deeper revision, mistake patterns, and advanced tools.
          </p>
        </div>

        <div className="pricingHeroNotes" aria-label="Pricing highlights">
          <div>
            <strong>Sandbox billing test</strong>
            <span>PayPal buttons are connected to sandbox plan IDs first.</span>
          </div>
          <div>
            <strong>Plus and Pro</strong>
            <span>Both include student and parent workspaces.</span>
          </div>
          <div>
            <strong>Worksheet/photo help</strong>
            <span>Planned as a paid-only feature.</span>
          </div>
        </div>
      </section>

      <section className="pricingCardsSection" aria-label="Pricing plans">
        <div className="pricingCards">
          {plans.map((plan) => {
            const paypalPlanIds = getPayPalPlanIds(plan.key);

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
                    <span className="badge">{plan.badge}</span>
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
                    <strong>Why this plan works</strong>
                  </p>

                  <ul className="list pricingFeatureList">
                    {plan.paidValue.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="buttonRow pricingButtonRow">
                  {plan.key === 'free' ? (
                    <a className="btn secondary" href={plan.ctaHref}>
                      {plan.ctaLabel}
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
          <h2 style={{ margin: 0 }}>
            Paid tiers are built around learning workflows, not just more answers.
          </h2>
          <p className="small" style={{ margin: 0, maxWidth: 900 }}>
            TutoVera should not compete only as another answer generator. The planned paid value is
            worksheet/photo support, guided practice, parent-friendly help, mistake diagnosis, saved
            continuity, and deeper revision workflows over time.
          </p>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/contact">
            Ask About Paid Access
          </a>
          <a className="btn secondary" href="/tutor">
            Try Free Tutor
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
              <h2 style={{ margin: 0 }}>What changes when users upgrade?</h2>
              <p className="small" style={{ margin: 0, maxWidth: 860 }}>
                The comparison is grouped by inclusiveness: features included in every plan first,
                then Plus and Pro features, then Pro-focused advantages.
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
          <h2 style={{ margin: 0 }}>Why worksheet and photo support is paid-only</h2>
          <p className="small" style={{ margin: 0, maxWidth: 880 }}>
            Image and worksheet support is more expensive to operate and more valuable for serious
            study. Free users can still use text-based tutoring across all subjects, while Plus and
            Pro are planned to unlock image-based help with monthly usage caps.
          </p>
        </div>

        <div className="buttonRow">
          <a className="btn" href="/tutor">
            Try Student Workspaces
          </a>
          <a className="btn secondary" href="/parents">
            Try Parent Workspaces
          </a>
          <a className="btn secondary" href="/contact">
            Ask About Paid Access
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
            .pricingHeroNotes {
              grid-template-columns: 1fr;
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