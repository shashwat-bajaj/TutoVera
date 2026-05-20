'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Reveal from '@/components/Reveal';
import { createClient } from '@/lib/supabase/client';
import { getURL } from '@/lib/site-url';

type AccountRole = 'student' | 'parent' | 'student-parent';
type AuthAnalyticsEventName = 'signup_started' | 'login_success';

type WindowWithDataLayer = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

function pushAuthAnalyticsEvent(
  eventName: AuthAnalyticsEventName,
  eventParams: Record<string, unknown> = {}
) {
  if (typeof window === 'undefined') return;

  const windowWithDataLayer = window as WindowWithDataLayer;
  windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer || [];

  windowWithDataLayer.dataLayer.push({
    event: eventName,
    method: 'email',
    page_path: window.location.pathname,
    ...eventParams
  });
}

function getFriendlyError(value: string | null) {
  if (value === 'auth_callback_failed') {
    return 'We could not finish the sign-in. Please try again.';
  }

  if (value === 'auth_confirm_failed') {
    return 'We could not confirm this email link. Please try signing in again or request a new link.';
  }

  return '';
}

function getSafeNext(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';

  return value;
}

function cleanUsername(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

function isValidUsername(value: string) {
  if (!value) return true;
  return /^[a-z0-9._-]{3,32}$/.test(value);
}

function hasRealSupabaseIdentity(user: unknown) {
  if (!user || typeof user !== 'object') return false;

  const maybeUser = user as {
    id?: unknown;
    identities?: unknown;
  };

  if (typeof maybeUser.id !== 'string' || !maybeUser.id) return false;

  if (!Array.isArray(maybeUser.identities)) {
    return false;
  }

  return maybeUser.identities.length > 0;
}

function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent;

  return (
    /Safari/i.test(userAgent) &&
    !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android/i.test(userAgent)
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const nextPath = getSafeNext(searchParams.get('next'));
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
  const handledExternalAuthRef = useRef(false);

  const baseUrl = useMemo(() => getURL(), []);

  function getAuthCallbackUrl({ popup = false }: { popup?: boolean } = {}) {
    const callbackUrl = new URL('/auth/callback', baseUrl);

    callbackUrl.searchParams.set('next', nextPath);

    if (popup) {
      callbackUrl.searchParams.set('popup', '1');
    }

    return callbackUrl.toString();
  }

  function getConfirmUrl() {
    return `${baseUrl}auth/confirm?next=${encodeURIComponent(nextPath)}`;
  }

  useEffect(() => {
    let cancelled = false;

    function finishExternalAuthReturn() {
      if (handledExternalAuthRef.current) return;

      handledExternalAuthRef.current = true;

      pushAuthAnalyticsEvent('login_success', {
        method: 'google',
        auth_flow: 'google_oauth',
        next_path: nextPath
      });

      router.push(nextPath);
      router.refresh();
    }

    async function checkForSignedInUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!cancelled && user) {
        finishExternalAuthReturn();
      }
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        finishExternalAuthReturn();
      }
    });

    function handleFocusOrVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void checkForSignedInUser();
      }
    }

    function handleAuthPopupMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const data = event.data as { type?: string; success?: boolean };

      if (data?.type === 'tutovera-auth-complete' && data.success) {
        void checkForSignedInUser();
      }
    }

    window.addEventListener('focus', checkForSignedInUser);
    window.addEventListener('message', handleAuthPopupMessage);
    document.addEventListener('visibilitychange', handleFocusOrVisibilityChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('focus', checkForSignedInUser);
      window.removeEventListener('message', handleAuthPopupMessage);
      document.removeEventListener('visibilitychange', handleFocusOrVisibilityChange);
    };
  }, [nextPath, router, supabase]);

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
        setStatus('Display usernames can use 3–32 letters, numbers, dots, underscores, or hyphens.');
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

      pushAuthAnalyticsEvent('login_success', {
        method: 'email',
        auth_flow: 'email_password',
        next_path: nextPath
      });

      router.push(nextPath);
      router.refresh();
      return;
    }

    const displayName = normalizedUsername || trimmedFullName;

    const { data, error } = await supabase.auth.signUp({
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

    if (hasRealSupabaseIdentity(data.user)) {
      pushAuthAnalyticsEvent('signup_started', {
        method: 'email',
        auth_flow: 'email_password_confirmation_required',
        account_role: accountRole,
        next_path: nextPath
      });
    }

    setStatus(
      'Check your email for a confirmation link. If nothing arrives, this email may already be connected to an existing TutoVera account. Try signing in, or use Continue with Google if you used Google before.'
    );
    setLoading(false);
  }

  async function handleGoogleLogin() {
    if (loading) return;

    setLoading(true);

    if (isSafariBrowser()) {
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

      return;
    }

    setStatus('Opening Google sign-in in a new tab...');

    const authWindow = window.open('about:blank', '_blank', 'width=520,height=760');

    if (!authWindow) {
      setStatus(
        'Your browser blocked the Google sign-in window. Please allow pop-ups for TutoVera and try again.'
      );
      setLoading(false);
      return;
    }

    authWindow.document.title = 'Continue with Google';
    authWindow.document.body.style.fontFamily =
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    authWindow.document.body.style.padding = '24px';
    authWindow.document.body.innerHTML = '<p>Opening Google sign-in for TutoVera...</p>';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl({ popup: true }),
        skipBrowserRedirect: true
      }
    });

    if (error || !data?.url) {
      authWindow.close();
      setStatus(error?.message || 'Could not start Google sign-in. Please try again.');
      setLoading(false);
      return;
    }

    authWindow.location.href = data.url;
    setStatus('Complete Google sign-in in the new tab. This page will update once you return.');
    setLoading(false);
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
                  <label>Display name, optional</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(cleanUsername(e.target.value))}
                    placeholder="learner123"
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