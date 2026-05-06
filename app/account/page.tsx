import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import SignOutButton from '@/components/SignOutButton';
import ActionCard from '@/components/ActionCard';
import Reveal from '@/components/Reveal';
import {
  formatBillingCycle,
  formatDate,
  formatPlanName,
  formatSubscriptionStatus,
  getPlanSummarySentence,
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

  const planName = formatPlanName(planAccess.plan);
  const planSummary = getPlanSummarySentence(planAccess);
  const rawPayPalStatus = planAccess.paypalStatus || planAccess.subscription?.paypal_status || '';

  return (
    <div className="grid" style={{ gap: 22 }}>
      <Reveal delay={0.02}>
        <section style={{ display: 'grid', gap: 10, maxWidth: 880 }}>
          <span className="badge">Account</span>
          <h1 style={{ margin: 0 }}>Your TutoVera account.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 820 }}>
            Signed in as <strong>{user.email}</strong>. Your account keeps session history,
            preferences, plan access, and tutor defaults connected across visits.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 16,
              alignItems: 'start'
            }}
          >
            <div style={{ display: 'grid', gap: 8 }}>
              <span className="badge">Current plan</span>
              <h2 style={{ margin: 0 }}>
                {planAccess.hasActivePaidAccess
                  ? `You're on TutoVera ${planName}.`
                  : 'You are on TutoVera Free.'}
              </h2>
              <p className="small" style={{ margin: 0, maxWidth: 820 }}>
                {planSummary}
              </p>
            </div>

            <div className="buttonRow" style={{ justifyContent: 'flex-end' }}>
              <a className="btn" href="/pricing">
                {planAccess.hasActivePaidAccess ? 'Manage Plan' : 'View Plans'}
              </a>
            </div>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
              gap: 12
            }}
          >
            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Plan status</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {formatSubscriptionStatus(planAccess.status)}
              </p>
            </div>

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
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12
            }}
          >
            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Saved history</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.savedHistoryLabel}
              </p>
            </div>

            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Next billing date</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.hasActivePaidAccess
                  ? formatDate(planAccess.currentPeriodEnd)
                  : 'Not active'}
              </p>
            </div>

            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>PayPal status</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {rawPayPalStatus || 'Not connected'}
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <a className="btn secondary" href="/history">
              Open History
            </a>
            <a className="btn secondary" href="/settings">
              Open Settings
            </a>
            <a className="btn secondary" href="/tutor">
              Start Learning
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="grid cols-3">
          <ActionCard
            title="Account history"
            description="View sessions attached to your account and continue older tutor threads naturally."
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