'use client';

import { useState } from 'react';
import Reveal from '@/components/Reveal';

const supportEmail = 'support@tutovera.com';

type ContactLeadEvent = {
  event: 'generate_lead';
  form_name: string;
  lead_type: string;
  event_source: string;
  value: number;
  currency: string;
};

function pushContactLeadEvent() {
  if (typeof window === 'undefined') return;

  const windowWithDataLayer = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };

  windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer || [];

  const eventPayload: ContactLeadEvent = {
    event: 'generate_lead',
    form_name: 'contact_form',
    lead_type: 'contact_submit',
    event_source: 'contact_page',
    value: 1,
    currency: 'USD'
  };

  windowWithDataLayer.dataLayer.push(eventPayload);
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitContact() {
    if (loading || !email.trim() || !message.trim()) return;

    setLoading(true);
    setStatus('Sending...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || 'Could not send message.');
        return;
      }

      pushContactLeadEvent();

      setStatus('Your message has been sent. Thank you for helping improve TutoVera.');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('Something went wrong while sending your message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Contact</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Contact TutoVera.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              Share bugs, confusing moments, feature requests, product ideas, account questions, or
              anything that would make TutoVera more useful and trustworthy for students and parents.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Product feedback</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Share what feels clear, what feels awkward, and what you would want improved first.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Bug reports</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Report broken flows, confusing tutor behavior, graph issues, login problems, or
              anything that does not work as expected.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Support</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              For account, billing, or access questions, use the form below or email{' '}
              <a href={`mailto:${supportEmail}`}>
                <strong>{supportEmail}</strong>
              </a>
              .
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Message form</h2>
            <p className="small" style={{ margin: 0 }}>
              The more specific your message is, the easier it is to review and improve TutoVera in a
              meaningful way.
            </p>
          </div>

          <div className="grid" style={{ gap: 12 }}>
            <div>
              <label>Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you liked, what confused you, what broke, or what you want built next."
                disabled={loading}
              />
            </div>

            <div className="buttonRow">
              <button onClick={submitContact} disabled={loading || !email.trim() || !message.trim()}>
                {loading ? 'Sending...' : 'Send message'}
              </button>

              <a className="btn secondary" href={`mailto:${supportEmail}`}>
                Email Support
              </a>
            </div>

            {status ? <p className="small">{status}</p> : null}
          </div>
        </section>
      </Reveal>
    </div>
  );
}