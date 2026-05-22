import Link from 'next/link';
import Reveal from '@/components/Reveal';
import BetaSignup from '@/components/BetaSignup';
import { subjects } from '@/lib/subjects';

export default function HomePage() {
  const subjectList = Object.values(subjects);
  const activeSubjects = subjectList.filter((subject) => subject.status === 'active');

  return (
    <div className="grid" style={{ gap: 34 }}>
      <section className="homeLead">
        <div className="homeLeadGrid" style={{ alignItems: 'center' }}>
          <div className="homeLeadCopy">
            <span className="badge">TutoVera</span>

            <h1 className="homeLeadTitle">
              Solve. Understand. <span>Improve.</span>
            </h1>

            <p className="homeLeadSubtext">
              A calm AI learning platform for students and parents. Ask questions, understand the
              reasoning, and improve through practice, saved sessions, and review.
            </p>

            <div className="buttonRow">
              <Link className="btn" href="/tutor">
                Start Learning →
              </Link>
              <Link className="btn secondary" href="/subjects">
                Explore Subjects
              </Link>
            </div>

            <p className="small" style={{ margin: 0, maxWidth: 680 }}>
              Start free with text tutoring. Upgrade when you need worksheet images, higher limits,
              or deeper revision tools.
            </p>
          </div>

          <div className="homeLeadPreviewWrap">
            <div className="homePreviewWindow">
              <div
                className="homePreviewDashboard"
                style={{
                  gridTemplateColumns: '1fr',
                  minHeight: 'auto'
                }}
              >
                <div className="homePreviewMain" style={{ padding: 20, gap: 14 }}>
                  <div className="homePreviewHeader">
                    <div>
                      <h2>Ask TutoVera</h2>
                      <p>One workspace for questions, explanations, and follow-ups.</p>
                    </div>

                    <div
                      className="homePreviewHours"
                      style={{ gridTemplateColumns: '1fr', justifyItems: 'end' }}
                    >
                      <span>Workspaces</span>
                      <strong>Student · Parent</strong>
                    </div>
                  </div>

                  <div className="homeProgressCard">
                    <div className="homeProgressLabel">
                      <span>Example question</span>
                      <strong>“Can you explain this step by step?”</strong>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                      <div
                        style={{
                          border: '1px solid var(--accent-secondary-border)',
                          borderRadius: 18,
                          background:
                            'color-mix(in srgb, var(--accent-secondary-soft) 56%, var(--surface))',
                          padding: 14
                        }}
                      >
                        <p className="small" style={{ margin: 0 }}>
                          TutoVera helps solve the question, explain the reasoning, and keep the
                          session ready for follow-ups.
                        </p>
                      </div>

                      <div
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 18,
                          background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
                          padding: 14
                        }}
                      >
                        <p className="small" style={{ margin: 0 }}>
                          Plus adds worksheet and image help. Pro adds revision and mistake review
                          from saved sessions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="buttonRow">
                    <Link className="btn secondary" href="/parents">
                      Parent Workspace
                    </Link>
                    <Link className="btn secondary" href="/pricing">
                      View Plans
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reveal delay={0.04}>
        <section className="grid cols-3">
          <div className="card featureCard">
            <h2 style={{ margin: 0 }}>Solve</h2>
            <p className="small" style={{ margin: 0 }}>
              Ask a subject question, paste your work, or share the step you are stuck on.
              TutoVera helps you start clearly without turning learning into answer-copying.
            </p>
          </div>

          <div className="card featureCard">
            <h2 style={{ margin: 0 }}>Understand</h2>
            <p className="small" style={{ margin: 0 }}>
              Get clear explanations, follow-up guidance, hints, mistake checks, and step-by-step
              reasoning that stays connected to the session.
            </p>
          </div>

          <div className="card featureCard">
            <h2 style={{ margin: 0 }}>Improve</h2>
            <p className="small" style={{ margin: 0 }}>
              Save sessions, return to earlier work, upload worksheets on paid plans, and use review
              tools when you need deeper practice.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 22 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Subjects</span>
            <h2 style={{ margin: 0 }}>Choose a subject and start learning.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 900 }}>
              TutoVera supports student and parent workspaces across active subject branches, all
              connected through one account and shared history.
            </p>
          </div>

          <div className="grid cols-3">
            {subjectList.map((subject) => (
              <Link
                key={subject.key}
                href={subject.path}
                className="card featureCard"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor:
                    subject.status === 'active' ? 'var(--accent-border)' : 'var(--border)'
                }}
              >
                <h3 style={{ margin: 0 }}>{subject.name}</h3>

                <p className="small" style={{ margin: 0 }}>
                  {subject.description}
                </p>

                <p className="small" style={{ margin: '14px 0 0' }}>
                  <strong>Open {subject.name} →</strong>
                </p>
              </Link>
            ))}
          </div>

          <div className="buttonRow">
            {activeSubjects.map((subject) => (
              <Link key={subject.key} className="btn secondary" href={subject.path}>
                {subject.name}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Plans</span>
            <h2 style={{ margin: 0 }}>Simple plans that unlock naturally.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 900 }}>
              TutoVera keeps the workspace simple. Your plan quietly changes what you can do inside
              the tutor, history, and review flow.
            </p>
          </div>

          <div className="grid cols-3">
            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Free</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Text tutoring, student and parent workspaces, math graphing, and basic saved
                history.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Plus</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Everything in Free, plus worksheet photos, screenshots, higher limits, and extended
                history.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Pro</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Everything in Plus, plus Revision Review, Mistake Review, highest limits, and deeper
                study support.
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <Link className="btn" href="/pricing">
              Compare Plans
            </Link>
            <Link className="btn secondary" href="/tutor">
              Try Free
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section id="updates">
          <BetaSignup />
        </section>
      </Reveal>
    </div>
  );
}