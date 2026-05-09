'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ThemePreference = 'system' | 'light' | 'dark';
type TranslationLanguage =
  | 'English'
  | 'Spanish'
  | 'Hindi'
  | 'French'
  | 'Arabic'
  | 'Portuguese'
  | 'Chinese'
  | 'Russian';
type GradeLevel = 'elementary' | 'middle-school' | 'high-school' | 'college';
type TutorMode = 'auto' | 'teach' | 'hint' | 'diagnose' | 'quiz';
type AccountRole = 'student' | 'parent' | 'student-parent';

const STORAGE_KEY = 'tutovera-theme';
const THEME_EVENT = 'tutovera-theme-change';

function resolveTheme(theme: ThemePreference) {
  if (typeof window === 'undefined') return theme === 'light' ? 'light' : 'dark';

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  return theme;
}

function normalizeRole(value: string): AccountRole {
  if (value === 'parent') return 'parent';
  if (value === 'student-parent') return 'student-parent';
  return 'student';
}

function cleanUsername(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function isValidUsername(value: string) {
  if (!value) return true;
  return /^[a-z0-9._-]{3,32}$/.test(value);
}

export default function SettingsForm({
  initialFullName,
  initialUsername,
  initialRole,
  initialThemePreference,
  initialTranslationLanguage,
  initialStudentGradeLevel,
  initialStudentTutorMode,
  initialParentGradeLevel
}: {
  initialFullName: string;
  initialUsername: string;
  initialRole: string;
  initialThemePreference: ThemePreference;
  initialTranslationLanguage: TranslationLanguage;
  initialStudentGradeLevel: GradeLevel;
  initialStudentTutorMode: TutorMode;
  initialParentGradeLevel: GradeLevel;
}) {
  const supabase = createClient();

  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(initialUsername);
  const [accountRole, setAccountRole] = useState<AccountRole>(normalizeRole(initialRole));

  const [themePreference, setThemePreference] =
    useState<ThemePreference>(initialThemePreference);
  const [translationLanguage, setTranslationLanguage] =
    useState<TranslationLanguage>(initialTranslationLanguage);

  const [studentGradeLevel, setStudentGradeLevel] =
    useState<GradeLevel>(initialStudentGradeLevel);
  const [studentTutorMode, setStudentTutorMode] =
    useState<TutorMode>(initialStudentTutorMode);

  const [parentGradeLevel, setParentGradeLevel] =
    useState<GradeLevel>(initialParentGradeLevel);

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function saveSettings() {
    if (loading) return;

    const trimmedFullName = fullName.trim();
    const normalizedUsername = cleanUsername(username);

    if (!trimmedFullName) {
      setStatus('Please enter your full name.');
      return;
    }

    if (!isValidUsername(normalizedUsername)) {
      setStatus('Usernames can use 3–32 letters, numbers, dots, underscores, or hyphens.');
      return;
    }

    setStatus('Saving settings...');
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      setStatus('You must be logged in.');
      setLoading(false);
      return;
    }

    const normalizedEmail = user.email.toLowerCase();

    const nextMetadata = {
      ...(user.user_metadata || {}),
      full_name: trimmedFullName,
      name: trimmedFullName,
      username: normalizedUsername || null,
      display_name: normalizedUsername || trimmedFullName,
      tutovera_role: accountRole,
      preferences: {
        ...(user.user_metadata?.preferences || {}),
        themePreference,
        translationLanguage,
        studentDefaults: {
          gradeLevel: studentGradeLevel,
          tutorMode: studentTutorMode
        },
        parentDefaults: {
          gradeLevel: parentGradeLevel
        }
      }
    };

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: nextMetadata
    });

    if (authUpdateError) {
      setStatus(authUpdateError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        email: normalizedEmail,
        full_name: trimmedFullName,
        username: normalizedUsername || null,
        role: accountRole,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (profileError) {
      setStatus(profileError.message);
      setLoading(false);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, themePreference);
    document.documentElement.setAttribute('data-theme', resolveTheme(themePreference));
    document.documentElement.style.colorScheme = resolveTheme(themePreference);
    document.body?.setAttribute('data-theme', resolveTheme(themePreference));
    window.dispatchEvent(new Event(THEME_EVENT));

    setUsername(normalizedUsername);
    setStatus('Settings saved.');
    setLoading(false);
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          display: 'grid',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Profile details</h3>
          <p className="small" style={{ margin: 0 }}>
            Save the name TutoVera should use across your account. Phone and address are not needed
            for the tutoring experience right now.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          <div>
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div>
            <label>Display username, optional</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(cleanUsername(e.target.value))}
              placeholder="shashwat"
              autoComplete="username"
            />
            <p className="small" style={{ margin: '6px 0 0' }}>
              Use 3–32 letters, numbers, dots, underscores, or hyphens.
            </p>
          </div>

          <div>
            <label>I use TutoVera as</label>
            <select
              value={accountRole}
              onChange={(e) => setAccountRole(e.target.value as AccountRole)}
            >
              <option value="student">Student / learner</option>
              <option value="parent">Parent / guardian</option>
              <option value="student-parent">Both student and parent</option>
            </select>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Display and language</h3>
          <p className="small" style={{ margin: 0 }}>
            Choose how TutoVera looks by default and what translation language should be ready when
            you need it.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          <div>
            <label>Theme preference</label>
            <select
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label>Default translation language</label>
            <select
              value={translationLanguage}
              onChange={(e) =>
                setTranslationLanguage(e.target.value as TranslationLanguage)
              }
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
              <option value="French">French</option>
              <option value="Arabic">Arabic</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Chinese">Chinese</option>
              <option value="Russian">Russian</option>
            </select>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Student tutor defaults</h3>
          <p className="small" style={{ margin: 0 }}>
            Auto mode follows the wording of the question more naturally, while the other modes push
            the tutor toward a more specific teaching style.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          <div>
            <label>Default learner level</label>
            <select
              value={studentGradeLevel}
              onChange={(e) => setStudentGradeLevel(e.target.value as GradeLevel)}
            >
              <option value="elementary">Elementary</option>
              <option value="middle-school">Middle school</option>
              <option value="high-school">High school</option>
              <option value="college">College</option>
            </select>
          </div>

          <div>
            <label>Default tutor mode</label>
            <select
              value={studentTutorMode}
              onChange={(e) => setStudentTutorMode(e.target.value as TutorMode)}
            >
              <option value="auto">Auto (follow my request)</option>
              <option value="teach">Teach me step by step</option>
              <option value="hint">Give hints only</option>
              <option value="diagnose">Diagnose my mistake</option>
              <option value="quiz">Turn this into practice questions</option>
            </select>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 16
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Parent tutor defaults</h3>
          <p className="small" style={{ margin: 0 }}>
            Parent workspaces stay guided by design, but you can choose the default learner level
            here.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          <div>
            <label>Default learner level</label>
            <select
              value={parentGradeLevel}
              onChange={(e) => setParentGradeLevel(e.target.value as GradeLevel)}
            >
              <option value="elementary">Elementary</option>
              <option value="middle-school">Middle school</option>
              <option value="high-school">High school</option>
              <option value="college">College</option>
            </select>
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gap: 12,
          paddingTop: 18,
          borderTop: '1px solid var(--border)'
        }}
      >
        <div className="buttonRow">
          <button type="button" onClick={saveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {status ? (
          <p className="small" style={{ margin: 0 }}>
            {status}
          </p>
        ) : (
          <p className="small" style={{ margin: 0 }}>
            Saved changes affect your default experience, but you can still adjust things inside a
            session.
          </p>
        )}
      </div>
    </div>
  );
}