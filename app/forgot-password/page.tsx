'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import Reveal from '@/components/Reveal';
import { getURL } from '@/lib/site-url';
import { createClient } from '@/lib/supabase/client';

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const baseUrl = useMemo(() => getURL(), []);

  function getRecoveryRedirectUrl() {
    return `${baseUrl}auth/confirm?next=${encodeURIComponent('/reset-password')}`;
  }

  async function sendResetLink() {
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatusKind('error');
      setStatus('Please enter the email connected to your TutoVera account.');
      return;
    }

    setLoading(true);
    setStatusKind('idle');
    setStatus('Sending reset link...');

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getRecoveryRedirectUrl()
    });

    if (error) {
      setStatusKind('error');
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatusKind('success');
    setStatus(
      'If this email is connected to a TutoVera account, a password reset link has been sent. Please check your inbox and spam folder.'
    );
    setLoading(false);
  }

  return (
    <div className="grid" style={{ gap: 22, maxWidth: 760 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 12 }}>
          <span className="badge">Password help</span>
          <h1 style={{ margin: 0 }}>Reset your TutoVera password.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 680 }}>
            Enter your account email and we’ll send a secure password reset link. For privacy, the
            message is the same whether or not the email is already registered.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void sendResetLink();
                }
              }}
            />
          </div>

          <div className="buttonRow">
            <button type="button" onClick={sendResetLink} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <a className="btn secondary" href="/login">
              Back to Login
            </a>
          </div>

          {status ? (
            <p
              className="small"
              style={{
                margin: 0,
                color: statusKind === 'error' ? 'var(--accent-warm)' : 'var(--text-soft)'
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}