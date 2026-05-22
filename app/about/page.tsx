import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { subjects } from '@/lib/subjects';

export default function AboutPage() {
  const subjectList = Object.values(subjects);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Learning support built to feel clearer and more continuous.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 880 }}>
              TutoVera is a calm AI learning platform for Math, Physics, Chemistry, and Biology. It
              gives each subject its own workspace while keeping one shared account, history,
              settings, and product foundation.
            </p>
          </div>

          <div className="buttonRow">
            <Link className="btn" href="/subjects">
              Explore Subjects
            </Link>
            <Link className="btn secondary" href="/tutor">
              Open Student Workspaces
            </Link>
            <Link className="btn secondary" href="/parents">
              Open Parent Workspaces
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="card" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">The name</span>
            <h2 style={{ margin: 0 }}>Why TutoVera?</h2>
            <p className="small" style={{ margin: 0, maxWidth: 900 }}>
              TutoVera combines <strong>“Tuto,”</strong> from tutor, with{' '}
              <strong>“Vera,”</strong> a word associated with truth, faith, belief, and trust. The
              name reflects the kind of learning support this platform is meant to provide: clear,
              steady, and trustworthy guidance for students and parents.
            </p>
          </div>

          <div className="grid cols-3">
            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Guided learning</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                TutoVera is designed to help learners understand the reasoning behind an answer, not
                just copy a result.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Shared continuity</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Sessions, settings, account access, and subject history stay connected instead of
                being split across separate apps.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>Parent support</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Parent workspaces help adults guide a learner with clearer explanations, likely
                mistakes, and calmer study support.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Subject branches</span>
            <h2 style={{ margin: 0 }}>One platform, subject-specific workspaces.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 880 }}>
              Each branch adapts the examples, tutor behavior, and learning flow for its subject
              while staying connected to the broader TutoVera experience.
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
                      ? 'In progress'
                      : 'Planned'}
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

      <Reveal delay={0.2}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>What TutoVera focuses on</h2>
            <p className="small" style={{ margin: 0, maxWidth: 880 }}>
              TutoVera focuses on clearer tutor flow, saved continuity, parent support,
              subject-specific learning, accessible design, and a calmer experience for students and
              families.
            </p>
          </div>

          <div className="buttonRow">
            <Link className="btn" href="/pricing">
              View Plans
            </Link>
            <Link className="btn secondary" href="/contact">
              Contact / Feedback
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}