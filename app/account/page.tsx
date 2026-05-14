import { redirect } from 'next/navigation';

import ActionCard from '@/components/ActionCard';
import CancelSubscriptionButton from '@/components/CancelSubscriptionButton';
import Reveal from '@/components/Reveal';
import SignOutButton from '@/components/SignOutButton';
import { getProfileDisplayName, getProfileForUser } from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';
import {
  formatBillingCycle,
  formatDate,
  formatPaymentStatus,
  formatPlanName,
  formatSubscriptionStatus,
  getPlanSummarySentence,
  getUserPlanAccess
} from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

function getCurrentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function getRemaining(limit: number, used: number) {
  return Math.max(0, Math.max(0, limit) - Math.max(0, used));
}

function getTutorUsageMessage({
  used,
  limit,
  remaining
}: {
  used: number;
  limit: number;
  remaining: number;
}) {
  if (remaining <= 0) {
    return `Limit reached: ${used}/${limit} used in the last 24 hours.`;
  }

  if (limit <= 10 && remaining <= 2) {
    return `Heads up: ${remaining} tutor ${remaining === 1 ? 'request' : 'requests'} left in this 24-hour period.`;
  }

  if (limit > 10 && remaining <= 10) {
    return `Heads up: ${remaining} tutor ${remaining === 1 ? 'request' : 'requests'} left in this 24-hour period.`;
  }

  return `${remaining} remaining in this 24-hour period.`;
}

function getImageUsageMessage({
  used,
  limit,
  remaining
}: {
  used: number;
  limit: number;
  remaining: number;
}) {
  if (limit <= 0) {
    return 'Upgrade to Plus or Pro to use worksheet and image uploads.';
  }

  if (remaining <= 0) {
    return `Limit reached: ${used}/${limit} used this month.`;
  }

  if (remaining <= 10) {
    return `Heads up: ${remaining} image ${remaining === 1 ? 'upload' : 'uploads'} left this month.`;
  }

  return `${remaining} remaining this month.`;
}

export default async function AccountPage() {
  const supabaseAuth = await createClient();
  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAdminSupabase();

  const [planAccess, profile] = await Promise.all([
    getUserPlanAccess({
      supabase,
      userId: user.id,
      email: user.email || null
    }),
    getProfileForUser({
      supabase,
      userId: user.id,
      email: user.email || null
    })
  ]);

  const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const currentMonthStart = getCurrentMonthStartIso();

  const [tutorUsageResult, imageUsageResult] = await Promise.all([
    supabase
      .from('learner_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since24Hours),
    supabase
      .from('learner_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('has_image', true)
      .gte('created_at', currentMonthStart)
  ]);

  if (tutorUsageResult.error) {
    console.error('ACCOUNT TUTOR USAGE COUNT ERROR:', tutorUsageResult.error);
  }

  if (imageUsageResult.error) {
    console.error('ACCOUNT IMAGE USAGE COUNT ERROR:', imageUsageResult.error);
  }

  const tutorRequestsUsed = tutorUsageResult.count || 0;
  const imageUploadsUsed = imageUsageResult.count || 0;

  const tutorRequestsRemaining = getRemaining(planAccess.dailyTutorLimit, tutorRequestsUsed);
  const imageUploadsRemaining = getRemaining(planAccess.imageUploadsPerMonth, imageUploadsUsed);

  const displayName = getProfileDisplayName({ profile, user });
  const planName = formatPlanName(planAccess.plan);
  const planSummary = getPlanSummarySentence(planAccess);
  const paymentStatus = formatPaymentStatus(planAccess.paypalStatus);
  const canCancelSubscription = planAccess.canCancelSubscription;
  const billingDateLabel = planAccess.cancelAtPeriodEnd ? 'Access ends' : 'Next billing date';

  return (
    <div className="grid" style={{ gap: 22 }}>
      <Reveal delay={0.02}>
        <section style={{ display: 'grid', gap: 10, maxWidth: 880 }}>
          <span className="badge">Account</span>
          <h1 style={{ margin: 0 }}>
            {displayName ? `Welcome back, ${displayName}.` : 'Your TutoVera account.'}
          </h1>
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
                {planAccess.hasActivePaidAccess ? 'View Plans' : 'Upgrade'}
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

            <div className="card innerFeatureCard" style={{ display: 'grid', gap: 8 }}>
              <p className="small" style={{ margin: 0 }}>
                <strong>Tutor requests</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {tutorRequestsUsed}/{planAccess.dailyTutorLimit} used
              </p>
              <p className="small" style={{ margin: 0 }}>
                {getTutorUsageMessage({
                  used: tutorRequestsUsed,
                  limit: planAccess.dailyTutorLimit,
                  remaining: tutorRequestsRemaining
                })}
              </p>
            </div>

            <div className="card innerFeatureCard" style={{ display: 'grid', gap: 8 }}>
              <p className="small" style={{ margin: 0 }}>
                <strong>Image support</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.imageUploadsPerMonth > 0
                  ? `${imageUploadsUsed}/${planAccess.imageUploadsPerMonth} used`
                  : 'Not included'}
              </p>
              <p className="small" style={{ margin: 0 }}>
                {getImageUsageMessage({
                  used: imageUploadsUsed,
                  limit: planAccess.imageUploadsPerMonth,
                  remaining: imageUploadsRemaining
                })}
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
                <strong>{billingDateLabel}</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {planAccess.hasActivePaidAccess
                  ? formatDate(planAccess.currentPeriodEnd)
                  : 'Not active'}
              </p>
            </div>

            <div className="card questionSurface" style={{ padding: 16 }}>
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Payment status</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {paymentStatus}
              </p>
            </div>
          </div>

          {canCancelSubscription ? (
            <div
              className="card questionSurface"
              style={{
                display: 'grid',
                gap: 12,
                padding: 16,
                borderColor: 'var(--accent-warm-border)'
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <p className="small" style={{ margin: 0 }}>
                  <strong>Subscription management</strong>
                </p>
                <p className="small" style={{ margin: 0 }}>
                  You can cancel future renewals here. If your current paid period is already
                  active, your access remains available until the end of that paid period. Plan
                  upgrades and downgrades are handled through support for now so billing stays clean.
                </p>
              </div>

              <div className="buttonRow">
                <CancelSubscriptionButton planName={planName} />
                <a className="btn secondary" href="/contact">
                  Contact Support
                </a>
              </div>
            </div>
          ) : null}

          {planAccess.cancelAtPeriodEnd && planAccess.hasActivePaidAccess ? (
            <div
              className="card questionSurface"
              style={{
                display: 'grid',
                gap: 6,
                padding: 16,
                borderColor: 'var(--accent-warm-border)'
              }}
            >
              <p className="small" style={{ margin: 0 }}>
                <strong>Renewal cancelled</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                Your paid access remains active until{' '}
                {formatDate(planAccess.currentPeriodEnd)}. You will not be charged again for this
                subscription.
              </p>
            </div>
          ) : null}

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
            description="Choose your profile, theme, translation, learner level, and tutor defaults."
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