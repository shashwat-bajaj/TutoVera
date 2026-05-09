'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Reveal from '@/components/Reveal';
import { createClient } from '@/lib/supabase/client';

function getFriendlyResetError(value: string | null) {
  if (!value) return '';

  return value.replace(/\+/g, ' ');
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const errorDescription =
    searchParams.get('error_description') || searchParams.get('error') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(
    getFriendlyResetError(errorDescription) || 'Checking your reset link...'
  );
  const [statusKind, setStatusKind] = useState<'idle' | 'success' | 'error'>(
    errorDescription ? 'error' : 'idle'
  );
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkResetSession() {
      if (errorDescription) {
        setReady(false);
        return;
      }

      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        setStatusKind('error');
        setStatus('This reset link is missing or expired. Please request a new password reset link.');
        setReady(false);
        return;
      }

      setStatusKind('idle');
      setStatus('Enter your new password below.');
      setReady(true);
    }

    void checkResetSession();
  }, [errorDescription, supabase.auth]);

  async function updatePassword() {
    if (loading || !ready) return;

    if (password.length < 6) {
      setStatusKind('error');
      setStatus('Please use a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setStatusKind('error');
      setStatus('Please make sure both password fields match.');
      return;
    }

    setLoading(true);
    setStatusKind('idle');
    setStatus('Updating your password...');

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      setStatusKind('error');
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatusKind('success');
    setStatus('Your password has been updated. Redirecting to your account...');
    setLoading(false);

    setTimeout(() => {
      router.push('/account');
      router.refresh();
    }, 900);
  }

  return (
    <div className="grid" style={{ gap: 22, maxWidth: 760 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 12 }}>
          <span className="badge">Reset password</span>
          <h1 style={{ margin: 0 }}>Choose a new TutoVera password.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 680 }}>
            Use a password you do not reuse elsewhere. After the update, you can continue to your
            account.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div>
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
              disabled={!ready || loading}
            />
          </div>

          <div>
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              disabled={!ready || loading}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void updatePassword();
                }
              }}
            />
          </div>

          <div className="buttonRow">
            <button type="button" onClick={updatePassword} disabled={!ready || loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <a className="btn secondary" href="/forgot-password">
              Request New Link
            </a>
          </div>

          {status ? (
            <p
              className="small"
              style={{
                margin: 0,
                color:
                  statusKind === 'error'
                    ? 'var(--accent-warm)'
                    : statusKind === 'success'
                      ? 'var(--accent-secondary)'
                      : 'var(--text-soft)'
              }}
            >
              {status}
            </p>
          ) : null}
        </section>
      </Reveal>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}