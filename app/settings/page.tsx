import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import SettingsForm from '@/components/SettingsForm';
import Reveal from '@/components/Reveal';
import { formatPlanName, getUserPlanAccess } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  const preferences = user.user_metadata?.preferences || {};

  return (
    <div className="grid" style={{ gap: 24, maxWidth: 920 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Settings</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Adjust TutoVera to fit how you learn and study.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              Manage your display preferences, translation defaults, learner levels, tutor behavior,
              and account plan awareness from one place.
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
            <h3 style={{ marginTop: 0 }}>Display preferences</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Control theme behavior and language defaults so TutoVera feels more comfortable to use
              over time.
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