'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Reveal from '@/components/Reveal';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/site-url';

type AccountRole = 'student' | 'parent' | 'student-parent';

function getFriendlyError(value: string | null) {
  if (value === 'auth_callback_failed') {
    return 'We could not finish the sign-in. Please try again.';
  }

  if (value === 'auth_confirm_failed') {
    return 'We could not confirm this email link. Please try signing in again or request a new link.';
  }

  return '';
}

function cleanUsername(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function isValidUsername(value: string) {
  if (!value) return true;
  return /^[a-z0-9._-]{3,32}$/.test(value);
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextPath = searchParams.get('next') || '/account';
  const errorMessage = getFriendlyError(searchParams.get('error'));

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [accountRole, setAccountRole] = useState<AccountRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(errorMessage);
  const [loading, setLoading] = useState(false);

  const baseUrl = useMemo(() => getURL(), []);

  function getAuthCallbackUrl() {
    return `${baseUrl}auth/callback?next=${encodeURIComponent(nextPath)}`;
  }

  function getConfirmUrl() {
    return `${baseUrl}auth/confirm?next=${encodeURIComponent(nextPath)}`;
  }

  function switchMode(nextMode: 'login' | 'signup') {
    setMode(nextMode);
    setStatus('');
  }

  async function handleEmailAuth() {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFullName = fullName.trim();
    const normalizedUsername = cleanUsername(username);

    if (!normalizedEmail || !password) {
      setStatus('Please enter your email and password.');
      return;
    }

    if (password.length < 6) {
      setStatus('Please use a password with at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!trimmedFullName) {
        setStatus('Please enter your full name.');
        return;
      }

      if (password !== confirmPassword) {
        setStatus('Please make sure both password fields match.');
        return;
      }

      if (!isValidUsername(normalizedUsername)) {
        setStatus('Usernames can use 3–32 letters, numbers, dots, underscores, or hyphens.');
        return;
      }
    }

    setLoading(true);
    setStatus(mode === 'login' ? 'Signing in...' : 'Creating your account...');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
      return;
    }

    const displayName = normalizedUsername || trimmedFullName;

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: getConfirmUrl(),
        data: {
          full_name: trimmedFullName,
          name: trimmedFullName,
          username: normalizedUsername || null,
          display_name: displayName,
          tutovera_role: accountRole
        }
      }
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatus(
      'Check your email for a confirmation link. If nothing arrives, this email may already be connected to an existing TutoVera account. Try signing in, or use Continue with Google if you used Google before.'
    );
    setLoading(false);
  }

  async function handleGoogleLogin() {
    if (loading) return;

    setLoading(true);
    setStatus('Redirecting to Google...');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl()
      }
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="loginPage grid" style={{ gap: 22, maxWidth: 980 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard loginHero">
          <div style={{ display: 'grid', gap: 10 }}>
            <span className="badge">TutoVera account</span>
            <h1 style={{ margin: 0 }}>Continue your learning without losing the thread.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 760 }}>
              One account keeps your tutor sessions, history, settings, and plan access connected
              across TutoVera.
            </p>
          </div>

          <div className="loginTrustRow">
            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Saved sessions</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                Return to earlier Student and Parent threads.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Plan access</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                Keep Free, Plus, and Pro access tied to your account.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Personalized defaults</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                Save your name, theme, level, and tutor preferences.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="card loginCard">
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">{mode === 'login' ? 'Sign in' : 'Create account'}</span>
            <h2 style={{ margin: 0 }}>
              {mode === 'login' ? 'Welcome back.' : 'Start with a TutoVera account.'}
            </h2>
            <p className="small" style={{ margin: 0 }}>
              Google sign-in is the fastest option. Email and password is available too.
            </p>
          </div>

          <button
            className="loginGoogleButton"
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading}
          >
            Continue with Google
          </button>

          <div className="loginDivider">
            <span />
            <p className="small" style={{ margin: 0 }}>
              or use email
            </p>
            <span />
          </div>

          <div className="buttonRow loginModeRow">
            <button
              className={mode === 'login' ? '' : 'secondary'}
              onClick={() => switchMode('login')}
              type="button"
              disabled={loading}
            >
              Sign in
            </button>
            <button
              className={mode === 'signup' ? '' : 'secondary'}
              onClick={() => switchMode('signup')}
              type="button"
              disabled={loading}
            >
              Create account
            </button>
          </div>

          <div className="grid" style={{ gap: 12 }}>
            {mode === 'signup' ? (
              <>
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
                  <label>I am using TutoVera as</label>
                  <select
                    value={accountRole}
                    onChange={(e) => setAccountRole(e.target.value as AccountRole)}
                  >
                    <option value="student">Student / learner</option>
                    <option value="parent">Parent / guardian</option>
                    <option value="student-parent">Both student and parent</option>
                  </select>
                </div>
              </>
            ) : null}

            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Enter your password' : 'Choose a secure password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && mode === 'login') {
                    event.preventDefault();
                    void handleEmailAuth();
                  }
                }}
              />
            </div>

            {mode === 'signup' ? (
              <div>
                <label>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleEmailAuth();
                    }
                  }}
                />
              </div>
            ) : null}

            {mode === 'login' ? (
              <div className="buttonRow" style={{ justifyContent: 'space-between' }}>
                <a className="small" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
            ) : null}

            <button onClick={handleEmailAuth} type="button" disabled={loading}>
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign in with email'
                  : 'Create account with email'}
            </button>

            {status ? (
              <p className="small loginStatus" style={{ margin: 0 }}>
                {status}
              </p>
            ) : null}
          </div>
        </section>
      </Reveal>

      <style>
        {`
          .loginHero {
            display: grid;
            gap: 18px;
          }

          .loginTrustRow {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .loginCard {
            display: grid;
            gap: 18px;
            max-width: 620px;
          }

          .loginGoogleButton {
            width: 100%;
          }

          .loginDivider {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 12px;
            align-items: center;
          }

          .loginDivider span {
            height: 1px;
            background: var(--border);
          }

          .loginModeRow {
            gap: 10px;
          }

          .loginStatus {
            color: var(--text-soft);
          }

          @media (max-width: 760px) {
            .loginTrustRow {
              grid-template-columns: 1fr;
            }

            .loginCard {
              max-width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}