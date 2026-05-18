'use client';

import { useState, type FormEvent } from 'react';

export default function BetaSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitSignup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

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

      setStatus('You have been added to the TutoVera updates list.');
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
    <section className="card betaSignupCard">
      <div className="betaSignupLayout">
        <div className="betaSignupCopy">
          <span className="badge betaSignupBadge">Join updates</span>

          <div className="betaSignupIntro">
            <h2 className="betaSignupTitle">Help shape TutoVera as it grows.</h2>
            <p className="small betaSignupText">
              Leave your details if you would like updates and want to share what kind of learning
              support would be most useful for you, your family, or your students.
            </p>
          </div>

          <div className="betaSignupHighlights">
            <div className="betaSignupHighlight">
              <strong>Built for real use</strong>
              <p className="small">
                Homework support, revision, parent guidance, subject-specific explanations, and
                clearer follow-up flow across active TutoVera branches.
              </p>
            </div>

            <div className="betaSignupHighlight">
              <strong>Product focus</strong>
              <p className="small">
                Tutor quality, saved sessions, parent support, subject tools, accessibility, and
                cleaner interaction design.
              </p>
            </div>
          </div>
        </div>

        <form className="betaSignupFormCard" onSubmit={submitSignup}>
          <div className="betaSignupFields">
            <div>
              <label htmlFor="beta-signup-name">Name (optional)</label>
              <input
                id="beta-signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="beta-signup-email">Email</label>
              <input
                id="beta-signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="beta-signup-goal">What would you like help with? (optional)</label>
              <textarea
                id="beta-signup-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Examples: algebra homework, physics formulas, chemistry balancing, biology revision, parent support"
              />
            </div>
          </div>

          <div className="betaSignupFooter">
            <div className="buttonRow betaSignupButtonRow">
              <button type="submit" disabled={!email.trim() || loading}>
                {loading ? 'Saving...' : 'Join Updates'}
              </button>
            </div>

            {status ? (
              <p className="small betaSignupFootnote">{status}</p>
            ) : (
              <p className="small betaSignupFootnote">
                We only use this to manage product updates and feedback.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}