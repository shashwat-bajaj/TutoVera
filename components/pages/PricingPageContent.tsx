import { Fragment } from 'react';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import PayPalExpandedCheckout from '@/components/PayPalExpandedCheckout';
import { plans, type PlanKey } from '@/lib/plans';
import { formatPlanName, getPlanSummarySentence, getUserPlanAccess } from '@/lib/subscriptions';

const comparisonRows = [
  {
    group: 'Simple difference',
    rows: [
      {
        label: 'Main purpose',
        free: 'Text tutoring',
        plus: 'Worksheet/image help',
        pro: 'Deep review'
      },
      {
        label: 'Best for',
        free: 'Trying TutoVera',
        plus: 'Regular homework',
        pro: 'Heavier study'
      }
    ]
  },
  {
    group: 'Usage',
    rows: [
      { label: 'Tutor requests', free: '10/day', plus: '100/day', pro: '300/day' },
      { label: 'Image uploads', free: 'Not included', plus: '100/month', pro: '500/month' },
      { label: 'Saved history', free: 'Basic', plus: 'Extended', pro: 'Highest allowance' }
    ]
  },
  {
    group: 'Tools',
    rows: [
      { label: 'Student workspace', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Parent workspace', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Math graphing', free: 'Included', plus: 'Included', pro: 'Included' },
      { label: 'Worksheet screenshots', free: 'Not included', plus: 'Included', pro: 'Advanced' },
      { label: 'Revision Review', free: 'Not included', plus: 'Not included', pro: 'Included' },
      { label: 'Mistake Review', free: 'Not included', plus: 'Not included', pro: 'Included' }
    ]
  }
];

function getPlanHeadline(planKey: string) {
  if (planKey === 'free') return 'Text tutoring';
  if (planKey === 'plus') return 'Worksheet and image help';
  return 'Revision and mistake review';
}

function getPlanOneLine(planKey: string) {
  if (planKey === 'free') {
    return 'Ask text questions, use student and parent workspaces, and save basic history.';
  }

  if (planKey === 'plus') {
    return 'Upload worksheet photos or screenshots and get higher limits for regular study.';
  }

  return 'Turn saved sessions into revision reviews and mistake-focused study.';
}

function getPlanKeyPoints(planKey: string) {
  if (planKey === 'free') {
    return [
      '10 tutor requests per day',
      'Text tutoring across subjects',
      'Student and parent workspaces',
      'Basic saved history'
    ];
  }

  if (planKey === 'plus') {
    return [
      '100 tutor requests per day',
      '100 image uploads per month',
      'Worksheet and screenshot help',
      'Extended saved history'
    ];
  }

  return [
    '300 tutor requests per day',
    '500 image uploads per month',
    'Revision Review and Mistake Review',
    'Highest saved-history allowance'
  ];
}

function getPlanChangeMessage(currentPlan: PlanKey) {
  if (currentPlan === 'plus') {
    return 'You already have an active Plus plan. Pro upgrades are handled through support for now so your billing stays clean.';
  }

  if (currentPlan === 'pro') {
    return 'You already have the highest TutoVera plan. Downgrades are handled through support for now so your billing stays clean.';
  }

  return 'Plan changes are handled through support for now.';
}

function getPlanActionLabel(planKey: PlanKey, isSignedIn: boolean) {
  if (planKey === 'free') return isSignedIn ? 'Open Tutor' : 'Start Free';
  if (planKey === 'plus') return 'Choose Plus';
  return 'Choose Pro';
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
          <h1 style={{ margin: 0 }}>Start simple. Upgrade when you need more.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 900 }}>
            Free is for text tutoring. Plus adds worksheet and image support. Pro adds deeper
            review tools for saved sessions and the highest limits.
          </p>
        </div>

        <div className="pricingHeroNotes" aria-label="Pricing summary">
          <div>
            <strong>Free</strong>
            <span>Text tutoring, student and parent workspaces, and basic history.</span>
          </div>
          <div>
            <strong>Plus</strong>
            <span>Worksheet photos, screenshots, higher limits, and extended history.</span>
          </div>
          <div>
            <strong>Pro</strong>
            <span>Revision Review, Mistake Review, highest limits, and deeper study.</span>
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
                : 'Log in before checking out so TutoVera can attach the plan to your account.'}
            </p>
          </div>

          <div className="buttonRow" style={{ justifyContent: 'flex-end' }}>
            {isSignedIn ? (
              <a className="btn secondary" href="/account">
                View Account
              </a>
            ) : (
              <a className="btn secondary" href="/login?next=/pricing">
                Log In
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="pricingCardsSection" aria-label="Pricing plans">
        <div className="pricingCards">
          {plans.map((plan) => {
            const isCurrentPlan = plan.key === planAccess.plan;
            const isPaidPlan = plan.key === 'plus' || plan.key === 'pro';
            const blockPlanChange = planAccess.hasActivePaidAccess && isPaidPlan && !isCurrentPlan;

            return (
              <div
                key={plan.key}
                className="card featureCard pricingPlanCard"
                style={{
                  borderColor: plan.highlighted ? 'var(--accent-warm-border)' : 'var(--border)'
                }}
              >
                <div className="pricingCardTop pricingCardSection">
                  <div className="pricingPlanHeader">
                    <span className="badge">{isCurrentPlan ? 'Current plan' : plan.badge}</span>
                    {plan.highlighted ? (
                      <span className="pricingPlanAccent">Recommended</span>
                    ) : null}
                  </div>

                  <div className="pricingPlanIntro">
                    <h2 style={{ margin: 0 }}>{plan.name}</h2>
                    <p className="small" style={{ margin: 0 }}>
                      <strong>{getPlanHeadline(plan.key)}</strong>
                    </p>
                    <p className="small pricingDescription">{getPlanOneLine(plan.key)}</p>
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
                </div>

                <div className="pricingFeatureBlock pricingCardSection">
                  <p className="small" style={{ margin: 0 }}>
                    <strong>Includes</strong>
                  </p>

                  <ul className="list pricingFeatureList">
                    {getPlanKeyPoints(plan.key).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="pricingBestFitBlock pricingCardSection">
                  <p className="small" style={{ margin: 0 }}>
                    <strong>Best fit</strong>
                  </p>
                  <p className="small" style={{ margin: 0 }}>
                    {plan.audience}
                  </p>
                </div>

                <div className="pricingButtonRow">
                  {isCurrentPlan ? (
                    <a className="btn secondary" href="/account">
                      View Current Plan
                    </a>
                  ) : plan.key === 'free' ? (
                    <a className="btn secondary" href={plan.ctaHref}>
                      {getPlanActionLabel(plan.key, isSignedIn)}
                    </a>
                  ) : blockPlanChange ? (
                    <div className="card questionSurface pricingPlanChangeNotice">
                      <p className="small" style={{ margin: 0 }}>
                        {getPlanChangeMessage(planAccess.plan)}
                      </p>
                      <div className="buttonRow">
                        <a className="btn secondary" href="/contact">
                          Contact Support
                        </a>
                      </div>
                    </div>
                  ) : (
                    <PayPalExpandedCheckout plan={plan.key} isSignedIn={isSignedIn} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 18 }}>
        <details className="pricingCompareDetails">
          <summary className="pricingCompareSummary">
            <span>
              <strong>Compare details</strong>
            </span>
            <span className="pricingCompareSummaryText">Open full comparison</span>
          </summary>

          <div className="pricingComparePanel">
            <div style={{ display: 'grid', gap: 8 }}>
              <h2 style={{ margin: 0 }}>What changes when you upgrade?</h2>
              <p className="small" style={{ margin: 0, maxWidth: 880 }}>
                Free keeps tutoring simple. Plus is for regular homework with images and worksheets.
                Pro is for deeper review after saved sessions.
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
          <h2 style={{ margin: 0 }}>Which plan should I choose?</h2>
          <p className="small" style={{ margin: 0, maxWidth: 880 }}>
            Use Free to try TutoVera. Choose Plus when you want worksheet or screenshot help. Choose
            Pro when you want saved sessions turned into review and mistake-focused study.
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

          .pricingCards {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-rows: repeat(4, auto);
            gap: 18px;
            align-items: stretch;
            width: 100%;
            max-width: 100%;
            clear: both;
            float: none;
          }

          .pricingPlanCard {
            display: grid;
            grid-template-rows: subgrid;
            grid-row: span 4;
            gap: 0;
            min-width: 0;
            height: 100%;
            float: none;
            align-content: stretch;
            align-items: stretch;
            overflow: visible;
          }

          .pricingPlanCard,
          .pricingPlanCard * {
            min-width: 0;
            max-width: 100%;
          }

          .pricingCardSection {
            display: grid;
            align-content: start;
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: normal;
          }

          .pricingCardTop {
            gap: 14px;
            padding-bottom: 16px;
          }

          .pricingPlanIntro {
            display: grid;
            gap: 8px;
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

          .pricingPriceBlock {
            display: grid;
            gap: 2px;
          }

          .pricingDescription {
            margin: 0;
          }

          .pricingFeatureBlock,
          .pricingBestFitBlock {
            gap: 10px;
            padding-top: 16px;
            padding-bottom: 16px;
            border-top: 1px solid var(--border);
          }

          .pricingFeatureList {
            margin-top: 0;
          }

          .pricingButtonRow {
            display: grid;
            gap: 12px;
            align-self: stretch;
            align-content: start;
            min-width: 0;
            padding-top: 16px;
            border-top: 1px solid var(--border);
          }

          .pricingPlanChangeNotice {
            display: grid;
            gap: 10px;
            padding: 16px;
            min-width: 0;
          }

          @supports not (grid-template-rows: subgrid) {
            .pricingCards {
              grid-template-rows: none;
            }

            .pricingPlanCard {
              grid-template-rows: auto auto auto auto;
              grid-row: auto;
            }

            .pricingCardTop {
              min-height: 300px;
            }

            .pricingFeatureBlock {
              min-height: 190px;
            }

            .pricingBestFitBlock {
              min-height: 125px;
            }
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
              grid-template-rows: none;
            }

            .pricingPlanCard {
              grid-template-rows: none;
              grid-row: auto;
              gap: 16px;
              height: auto;
              overflow: visible;
            }

            .pricingCardTop,
            .pricingFeatureBlock,
            .pricingBestFitBlock,
            .pricingButtonRow {
              min-height: 0;
              padding-top: 0;
              padding-bottom: 0;
            }

            .pricingFeatureBlock,
            .pricingBestFitBlock,
            .pricingButtonRow {
              border-top: 1px solid var(--border);
              padding-top: 16px;
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