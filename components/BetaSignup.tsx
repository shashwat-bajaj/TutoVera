'use client';

import { useState } from 'react';

export default function BetaSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitSignup() {
    if (!email.trim() || loading) return;

    setLoading(true);
    setStatus('Saving...');

    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, goal })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || 'Could not save your interest.');
        return;
      }

      setStatus('You have been added to the TutoVera early access list.');
      setName('');
      setEmail('');
      setGoal('');
    } catch {
      setStatus('Something went wrong while saving your interest.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="card"
      style={{
        display: 'grid',
        gap: 24,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(320px, 1.1fr)',
          gap: 24,
          alignItems: 'start'
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <span className="badge">Join early access</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h2 style={{ margin: 0 }}>Help shape TutoVera as it grows.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 520 }}>
              Leave your details so we can understand real study needs, improve the learning flow,
              and shape Math, Physics, Chemistry, Biology, and future tools around actual learners
              and families.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'grid', gap: 5 }}>
              <strong style={{ fontSize: '0.98rem' }}>Built for real use</strong>
              <p className="small" style={{ margin: 0 }}>
                Homework support, revision, parent guidance, subject-specific explanations, and
                clearer follow-up flow across active TutoVera branches.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 5 }}>
              <strong style={{ fontSize: '0.98rem' }}>Early access focus</strong>
              <p className="small" style={{ margin: 0 }}>
                Tutor quality, saved sessions, parent support, subject tools, accessibility, and
                cleaner interaction design.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 14,
            padding: 18,
            borderRadius: 24,
            border: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--surface-soft) 90%, transparent)'
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label>Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label>What do you want help with? (optional)</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Examples: algebra homework, physics formulas, chemistry balancing, biology revision, parent support"
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border)'
            }}
          >
            <div className="buttonRow">
              <button onClick={submitSignup} disabled={!email.trim() || loading}>
                {loading ? 'Saving...' : 'Join early access'}
              </button>
            </div>

            {status ? (
              <p className="small" style={{ margin: 0 }}>
                {status}
              </p>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                We only use this to manage early access interest and product feedback.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}