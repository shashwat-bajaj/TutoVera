import { redirect } from 'next/navigation';

import Reveal from '@/components/Reveal';
import SettingsForm from '@/components/SettingsForm';
import {
  getFallbackNameFromEmail,
  getProfileDisplayName,
  getProfileForUser
} from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';
import { formatPlanName, getUserPlanAccess } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

function getMetadataString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function SettingsPage() {
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

  const preferences = user.user_metadata?.preferences || {};
  const displayName = getProfileDisplayName({ profile, user });

  const initialFullName =
    profile?.full_name ||
    getMetadataString(user.user_metadata?.full_name) ||
    getMetadataString(user.user_metadata?.name) ||
    getFallbackNameFromEmail(user.email);

  const initialUsername =
    profile?.username ||
    getMetadataString(user.user_metadata?.username) ||
    getMetadataString(user.user_metadata?.display_name);

  const initialRole =
    profile?.role ||
    getMetadataString(user.user_metadata?.tutovera_role) ||
    'student';

  return (
    <div className="grid" style={{ gap: 24, maxWidth: 920 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Settings</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>
              {displayName
                ? `Adjust TutoVera for ${displayName}.`
                : 'Adjust TutoVera to fit how you learn and study.'}
            </h1>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              Manage your profile, display preferences, translation defaults, learner levels, tutor
              behavior, and account plan awareness from one place.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Plan access</span>
            <h2 style={{ margin: 0 }}>{formatPlanName(planAccess.plan)}</h2>
            <p className="small" style={{ margin: 0, maxWidth: 760 }}>
              Your current plan allows {planAccess.dailyTutorLimit} tutor requests per day
              {planAccess.imageUploadsPerMonth > 0
                ? ` and includes ${planAccess.imageUploadsPerMonth} image uploads per month once image support is enabled.`
                : '. Image and worksheet support are planned for Plus and Pro.'}
            </p>
          </div>

          <div className="buttonRow">
            <a className="btn secondary" href="/pricing">
              View Pricing
            </a>
            <a className="btn secondary" href="/account">
              Open Account
            </a>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Profile details</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Save your name and display details so TutoVera feels more personal when you return.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Student defaults</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Set the starting level and tutor mode used in the student workspace before each new
              session begins.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Parent defaults</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Keep the parent workspace better aligned with the child’s level so explanations feel
              clearer and more usable right away.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Preference controls</h2>
            <p className="small" style={{ margin: 0 }}>
              Changes saved here shape your default TutoVera experience, while still letting you
              adjust things inside a session whenever needed.
            </p>
          </div>

          <SettingsForm
            initialFullName={initialFullName}
            initialUsername={initialUsername}
            initialRole={initialRole}
            initialThemePreference={preferences.themePreference || 'system'}
            initialTranslationLanguage={preferences.translationLanguage || 'English'}
            initialStudentGradeLevel={preferences.studentDefaults?.gradeLevel || 'high-school'}
            initialStudentTutorMode={preferences.studentDefaults?.tutorMode || 'auto'}
            initialParentGradeLevel={preferences.parentDefaults?.gradeLevel || 'elementary'}
          />
        </section>
      </Reveal>
    </div>
  );
}