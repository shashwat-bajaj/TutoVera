import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import SignOutButton from '@/components/SignOutButton';
import ActionCard from '@/components/ActionCard';
import Reveal from '@/components/Reveal';
import {
  formatBillingCycle,
  formatPlanName,
  getUserPlanAccess
} from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabaseAuth = await createClient();
  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAdminSupabase();
  const planAccess = await getUserPlanAccess({
    supabase,
    userId: user.id,
    email: user.email || null
  });

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Account</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Your TutoVera account and saved learning workspace.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              Signed in as <strong>{user.email}</strong>. Your account keeps session history,
              preferences, plan access, and tutor defaults connected across visits.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Current plan</span>
            <h2 style={{ margin: 0 }}>{formatPlanName(planAccess.plan)}</h2>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              {planAccess.isPaidPlan
                ? `Your ${formatPlanName(planAccess.plan)} access is currently ${planAccess.status}.`
                : 'You are currently on the Free plan. You can continue using text-based tutoring and upgrade whenever you are ready.'}
            </p>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12
            }}
          >
            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Billing cycle</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {formatBillingCycle(planAccess.billingCycle)}
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Tutor requests</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.dailyTutorLimit}/day
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Image support</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.imageUploadsPerMonth > 0
                  ? `${planAccess.imageUploadsPerMonth}/month`
                  : 'Not included'}
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Saved history</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.savedHistoryLabel}
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <a className="btn" href="/pricing">
              Manage Plan
            </a>
            <a className="btn secondary" href="/history">
              Open History
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Saved history</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Revisit saved conversations, continue older threads, and keep track of learning work
              across active TutoVera subject branches.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Learning preferences</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Control theme, translation language, learner level, and default tutor behavior from one
              account-wide place.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Account access</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Stay signed in while working through sessions, or sign out whenever you are done using
              TutoVera on this device.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="grid cols-3">
          <ActionCard
            title="Account history"
            description="View sessions attached to your account and continue older tutor threads more naturally."
            action={
              <a className="btn secondary" href="/history">
                Open History
              </a>
            }
          />

          <ActionCard
            title="Settings"
            description="Choose your defaults for theme, translation, learner level, and tutor behavior."
            action={
              <a className="btn secondary" href="/settings">
                Open Settings
              </a>
            }
          />

          <ActionCard
            title="Account access"
            description="Sign out when you are done using TutoVera on this device."
            action={<SignOutButton />}
          />
        </section>
      </Reveal>
    </div>
  );
}