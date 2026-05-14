import Reveal from '@/components/Reveal';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { formatPlanName, getUserPlanAccess } from '@/lib/subscriptions';
import type { PlanKey } from '@/lib/plans';

export const dynamic = 'force-dynamic';

type ToolPlan = 'free' | 'signed-in' | 'plus' | 'pro';

const planRank: Record<PlanKey, number> = {
  free: 0,
  plus: 1,
  pro: 2
};

const tools: Array<{
  title: string;
  badge: string;
  requiredPlan: ToolPlan;
  description: string;
  activeDescription: string;
  href: string;
  cta: string;
}> = [
  {
    title: 'Student Tutor Workspace',
    badge: 'Core tool',
    requiredPlan: 'free',
    description:
      'Ask questions, get step-by-step explanations, request hints, diagnose mistakes, generate practice, and continue saved sessions.',
    activeDescription: 'Available on every plan.',
    href: '/tutor',
    cta: 'Open Student Workspace'
  },
  {
    title: 'Parent Workspace',
    badge: 'Core tool',
    requiredPlan: 'free',
    description:
      'Get parent-friendly explanations, talking points, likely mistake guidance, simple examples, and practice prompts.',
    activeDescription: 'Available on every plan.',
    href: '/parents',
    cta: 'Open Parent Workspace'
  },
  {
    title: 'Math Graphing',
    badge: 'Core tool',
    requiredPlan: 'free',
    description:
      'Graph math functions and continue graph-based follow-ups such as explaining intercepts, vertex behavior, or curve shape.',
    activeDescription: 'Available on every plan inside Math.',
    href: '/math/tutor',
    cta: 'Open Math Tutor'
  },
  {
    title: 'Personalized Tutor Memory',
    badge: 'Signed-in tool',
    requiredPlan: 'signed-in',
    description:
      'TutoVera quietly remembers short learning patterns across signed-in sessions so future answers can better match the learner’s style, weak areas, and recent learning context.',
    activeDescription:
      'Active for signed-in accounts. This runs internally and does not replace saved history.',
    href: '/settings',
    cta: 'Open Settings'
  },
  {
    title: 'Image and Worksheet Support',
    badge: 'Plus and Pro',
    requiredPlan: 'plus',
    description:
      'Upload worksheet photos, screenshots, and image-based questions so TutoVera can explain visible work and guide the next step.',
    activeDescription: 'Included with Plus and Pro.',
    href: '/tutor',
    cta: 'Use Image Support'
  },
  {
    title: 'Revision Review',
    badge: 'Pro study tool',
    requiredPlan: 'pro',
    description:
      'Turn a saved session into a structured study review with a session summary, key concepts, clean notes, practice questions, answer key, and next review steps.',
    activeDescription: 'Included with Pro inside Study Tools.',
    href: '/history',
    cta: 'Open History'
  },
  {
    title: 'Mistake Review',
    badge: 'Pro study tool',
    requiredPlan: 'pro',
    description:
      'Review confirmed mistakes, possible weak areas, corrected reasoning, and targeted practice drills from a saved session.',
    activeDescription: 'Included with Pro inside Study Tools.',
    href: '/history',
    cta: 'Open History'
  },
  {
    title: 'Highest Usage Limits',
    badge: 'Pro access',
    requiredPlan: 'pro',
    description:
      'Use the highest tutor request limit, highest image upload limit, and strongest saved-history allowance for heavier study periods.',
    activeDescription: 'Included with Pro.',
    href: '/account',
    cta: 'View Account Usage'
  }
];

function hasToolAccess({
  requiredPlan,
  currentPlan,
  signedIn
}: {
  requiredPlan: ToolPlan;
  currentPlan: PlanKey;
  signedIn: boolean;
}) {
  if (requiredPlan === 'free') return true;
  if (requiredPlan === 'signed-in') return signedIn;
  return planRank[currentPlan] >= planRank[requiredPlan];
}

function getToolStatus({
  requiredPlan,
  currentPlan,
  signedIn
}: {
  requiredPlan: ToolPlan;
  currentPlan: PlanKey;
  signedIn: boolean;
}) {
  if (hasToolAccess({ requiredPlan, currentPlan, signedIn })) {
    return 'Active';
  }

  if (requiredPlan === 'signed-in') return 'Sign in to use';
  if (requiredPlan === 'plus') return 'Included with Plus';
  if (requiredPlan === 'pro') return 'Included with Pro';
  return 'Available';
}

function getLockedHref(requiredPlan: ToolPlan) {
  if (requiredPlan === 'signed-in') return '/login?next=/learning-tools';
  return '/pricing';
}

function getLockedCta(requiredPlan: ToolPlan) {
  if (requiredPlan === 'signed-in') return 'Log In';
  return 'View Plans';
}

export default async function LearningToolsPage() {
  const authClient = await createAuthClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  const signedIn = Boolean(user?.id);
  const supabase = createAdminSupabase();

  const planAccess = user?.id
    ? await getUserPlanAccess({
        supabase,
        userId: user.id,
        email: user.email || null
      })
    : null;

  const currentPlan: PlanKey = planAccess?.plan || 'free';
  const currentPlanName = signedIn ? formatPlanName(currentPlan) : 'Free';

  const activeTools = tools.filter((tool) =>
    hasToolAccess({
      requiredPlan: tool.requiredPlan,
      currentPlan,
      signedIn
    })
  );

  const lockedTools = tools.filter(
    (tool) =>
      !hasToolAccess({
        requiredPlan: tool.requiredPlan,
        currentPlan,
        signedIn
      })
  );

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <span className="badge">Learning Tools</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Your TutoVera learning tools.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 900 }}>
              See which study tools are active on your plan and where to use them. TutoVera keeps
              core tutoring simple, then adds worksheet support, personalized continuity, and deeper
              Pro review tools as your plan grows.
            </p>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12
            }}
          >
            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Current access</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {signedIn ? `TutoVera ${currentPlanName}` : 'Signed-out Free view'}
              </p>
            </div>

            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Active tools</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {activeTools.length} available now
              </p>
            </div>

            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>More tools</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {lockedTools.length > 0
                  ? `${lockedTools.length} available with sign-in or upgrade`
                  : 'All listed tools are active'}
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <a className="btn" href="/tutor">
              Start Learning
            </a>
            <a className="btn secondary" href="/pricing">
              View Plans
            </a>
            <a className="btn secondary" href="/account">
              View Account
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid" style={{ gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Active on your current access</h2>
            <p className="small" style={{ margin: 0 }}>
              These tools are available based on your current sign-in and plan status.
            </p>
          </div>

          <div className="grid cols-3">
            {activeTools.map((tool) => (
              <div key={tool.title} className="card featureCard" style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <span className="badge">{tool.badge}</span>
                  <h3 style={{ margin: 0 }}>{tool.title}</h3>
                  <p className="small" style={{ margin: 0 }}>
                    {tool.description}
                  </p>
                </div>

                <div className="card questionSurface" style={{ padding: 14 }}>
                  <p className="small" style={{ margin: 0 }}>
                    <strong>{getToolStatus({ requiredPlan: tool.requiredPlan, currentPlan, signedIn })}</strong>
                  </p>
                  <p className="small" style={{ margin: '4px 0 0' }}>
                    {tool.activeDescription}
                  </p>
                </div>

                <div className="buttonRow" style={{ marginTop: 'auto' }}>
                  <a className="btn secondary" href={tool.href}>
                    {tool.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {lockedTools.length > 0 ? (
        <Reveal delay={0.1}>
          <section className="grid" style={{ gap: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <h2 style={{ margin: 0 }}>Tools you can unlock</h2>
              <p className="small" style={{ margin: 0 }}>
                These tools become available when you sign in or move to the matching plan.
              </p>
            </div>

            <div className="grid cols-3">
              {lockedTools.map((tool) => (
                <div
                  key={tool.title}
                  className="card featureCard"
                  style={{
                    display: 'grid',
                    gap: 14,
                    borderColor: 'var(--accent-border)'
                  }}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <span className="badge">{tool.badge}</span>
                    <h3 style={{ margin: 0 }}>{tool.title}</h3>
                    <p className="small" style={{ margin: 0 }}>
                      {tool.description}
                    </p>
                  </div>

                  <div className="card questionSurface" style={{ padding: 14 }}>
                    <p className="small" style={{ margin: 0 }}>
                      <strong>
                        {getToolStatus({
                          requiredPlan: tool.requiredPlan,
                          currentPlan,
                          signedIn
                        })}
                      </strong>
                    </p>
                  </div>

                  <div className="buttonRow" style={{ marginTop: 'auto' }}>
                    <a className="btn secondary" href={getLockedHref(tool.requiredPlan)}>
                      {getLockedCta(tool.requiredPlan)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.14}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>How the tools fit together</h2>
          <p className="small" style={{ margin: 0, maxWidth: 880 }}>
            Use the Student or Parent workspace to learn in the moment. Use image support when the
            question is on a worksheet or screenshot. Use Study Tools after a saved session to turn
            the conversation into revision or mistake review. TutoVera’s internal personalization
            helps future answers better match the way the learner studies.
          </p>

          <div className="buttonRow">
            <a className="btn" href="/subjects">
              Explore Subjects
            </a>
            <a className="btn secondary" href="/history">
              Open History
            </a>
          </div>
        </section>
      </Reveal>
    </div>
  );
}