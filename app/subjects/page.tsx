import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { subjects } from '@/lib/subjects';

export default function SubjectsPage() {
  const subjectList = Object.values(subjects);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Choose the subject branch you want to work in.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 880 }}>
              TutoVera organizes learning into subject branches so students and parents can start
              with the workspace that best matches the question, topic, or study situation.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          {subjectList.map((subject) => (
            <div
              key={subject.key}
              className="card featureCard"
              style={{
                display: 'grid',
                gap: 16,
                borderColor:
                  subject.status === 'active' ? 'var(--accent-border)' : 'var(--border)'
              }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                <h2 style={{ margin: 0 }}>{subject.name}</h2>

                <p className="small" style={{ margin: 0 }}>
                  {subject.description}
                </p>
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 'auto' }}>
                <div className="buttonRow">
                  <Link className="btn" href={subject.path}>
                    Open {subject.name}
                  </Link>
                </div>

                <div className="buttonRow">
                  <Link className="btn secondary" href={`${subject.path}/tutor`}>
                    Student
                  </Link>
                  <Link className="btn secondary" href={`${subject.path}/parents`}>
                    Parent
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>One platform, subject-specific workspaces.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 900 }}>
              Each subject has its own examples, tutor behavior, parent support, and saved history
              context while still sharing the same account, settings, and product foundation.
            </p>
          </div>

          <div className="buttonRow">
            <Link className="btn" href="/tutor">
              Open Student Workspaces
            </Link>
            <Link className="btn secondary" href="/parents">
              Open Parent Workspaces
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}