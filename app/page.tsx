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
        <div className="homeLeadGrid" style={{ alignItems: 'start' }}>
          <div className="homeLeadCopy">
            <h1 className="homeLeadTitle">
              Solve. Understand. <span>Improve.</span>
            </h1>

            <p className="homeLeadSubtext">
              TutoVera is a calm AI learning platform for Math, Physics, Chemistry, and Biology.
              It helps students work through real questions, understand the reasoning, and continue
              learning through saved sessions, follow-ups, and practice.
            </p>

            <div className="buttonRow">
              <Link className="btn" href="/subjects">
                Explore Subjects →
              </Link>
              <Link className="btn secondary" href="#updates">
                Join Updates
              </Link>
            </div>

            <div className="homeLeadProof">
              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">✦</span>
                <div>
                  <strong>Solve real questions</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Start with the exact homework problem, topic, example, or study question in
                    front of you.
                  </p>
                </div>
              </div>

              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">↗</span>
                <div>
                  <strong>Understand each step</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Follow the reasoning behind the answer, ask follow-ups, and clear up the parts
                    that feel confusing.
                  </p>
                </div>
              </div>

              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">◎</span>
                <div>
                  <strong>Improve over time</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Save sessions, return to earlier explanations, and turn questions into stronger
                    study habits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="homeLeadPreviewWrap">
            <div className="homePreviewWindow">
              <div
                className="homePreviewDashboard"
                style={{ gridTemplateColumns: '1fr', minHeight: 'auto' }}
              >
                <div className="homePreviewMain" style={{ padding: 20, gap: 12 }}>
                  <div className="homePreviewHeader">
                    <div>
                      <h2>TutoVera workspace</h2>
                      <p>Choose a subject, ask clearly, and keep learning from there.</p>
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
                      <span>Student workspace</span>
                      <strong>Ask a question, then understand the reasoning.</strong>
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
                          “Can you help me solve this step by step, but explain why each step works?”
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
                          TutoVera guides the solution, explains the reasoning, and keeps the thread
                          ready for follow-up questions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="homeRecommendedCard">
                    <span>What TutoVera helps you do</span>

                    <div className="homeRecommendedList">
                      <div
                        className="homeRecommendedItem"
                        style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}
                      >
                        <i aria-hidden="true">✣</i>
                        <strong>Open a subject branch</strong>
                      </div>

                      <div
                        className="homeRecommendedItem"
                        style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}
                      >
                        <i aria-hidden="true">✣</i>
                        <strong>Continue a saved session</strong>
                      </div>
                    </div>

                    <p className="small" style={{ margin: 0 }}>
                      Start with Math, Physics, Chemistry, or Biology, then continue the learning
                      thread when you need to ask a follow-up or review earlier work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reveal delay={0.04}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 22 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Subjects</span>
            <h2 style={{ margin: 0 }}>Choose a TutoVera branch.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 1120 }}>
              Each subject branch has its own homepage, examples, tutor behavior, and visual identity
              while sharing the same core account, history, settings, deployment, and backend
              structure.
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
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Learning foundation</span>
            <h2 style={{ margin: 0 }}>A consistent experience across every active branch.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 920 }}>
              TutoVera is built around clear explanations, saved continuity, parent support, and
              subject-specific workspaces that stay connected through one account.
            </p>
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
        <section id="updates">
          <BetaSignup />
        </section>
      </Reveal>
    </div>
  );
}