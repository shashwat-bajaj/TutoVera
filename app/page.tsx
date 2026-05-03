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
        <div className="homeLeadGrid">
          <div className="homeLeadCopy">
            <h1 className="homeLeadTitle">Solve. Understand. Improve.</h1>

            <p className="homeLeadSubtext">
              TutoVera is a calm AI learning platform for Math, Physics, Chemistry, and Biology.
              Each subject has its own student and parent workspace while sharing one account, one
              history foundation, and one connected product experience.
            </p>

            <div className="buttonRow">
              <Link className="btn" href="/subjects">
                Explore Subjects
              </Link>
              <Link className="btn secondary" href="#beta">
                Join Free Beta
              </Link>
            </div>

            <div className="homeLeadProof">
              <div className="homeLeadProofItem">
                <strong>Solve</strong>
                <p className="small" style={{ margin: 0 }}>
                  Get guided help with questions, examples, practice, and follow-ups across active
                  subject branches.
                </p>
              </div>

              <div className="homeLeadProofItem">
                <strong>Understand</strong>
                <p className="small" style={{ margin: 0 }}>
                  Learn the reasoning behind the answer with clearer explanations and steady support.
                </p>
              </div>

              <div className="homeLeadProofItem">
                <strong>Improve</strong>
                <p className="small" style={{ margin: 0 }}>
                  Save sessions, continue earlier threads, and build stronger study flow over time.
                </p>
              </div>
            </div>
          </div>

          <div className="homeLeadPreviewWrap">
            <div className="homePreviewWindow">
              <div className="homePreviewBar">
                <div className="homePreviewDots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="small">TutoVera preview</span>
              </div>

              <div className="homePreviewStack">
                <div className="homePreviewPanel homePreviewChat">
                  <div className="homePreviewPrompt">
                    <p className="small" style={{ margin: 0 }}>
                      I need help learning a topic, but I want the explanation to feel clear,
                      useful, and easy to continue.
                    </p>
                  </div>

                  <div className="homePreviewResponse">
                    <p className="small" style={{ margin: 0 }}>
                      Choose the subject branch you need, then use the student workspace, parent
                      workspace, saved history, and follow-up support inside the same TutoVera
                      platform.
                    </p>
                  </div>
                </div>

                <div className="homePreviewGrid">
                  <div className="homePreviewMiniCard">
                    <span className="badge">Active now</span>
                    <p className="small" style={{ margin: 0 }}>
                      {activeSubjects.map((subject) => subject.name).join(', ')} include student
                      tutoring, parent support, and saved history.
                    </p>
                  </div>

                  <div className="homePreviewMiniCard">
                    <span className="badge">Built to grow</span>
                    <p className="small" style={{ margin: 0 }}>
                      Each subject can develop its own tools, examples, and tutor behavior without
                      becoming a separate cloned app.
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
                <span className="badge">
                  {subject.status === 'active'
                    ? 'Active'
                    : subject.status === 'beta'
                      ? 'Beta preview'
                      : 'Preparing'}
                </span>

                <h3 style={{ marginBottom: 8 }}>{subject.name}</h3>

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
            <span className="badge">Current focus</span>
            <h2 style={{ margin: 0 }}>A consistent learning experience across active branches.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 920 }}>
              The current focus is making all active branches feel stable, useful, and consistent
              while preparing launch-ready branding, paid access, and future study tools.
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
        <section id="beta">
          <BetaSignup />
        </section>
      </Reveal>
    </div>
  );
}