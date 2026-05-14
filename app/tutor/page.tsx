import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { subjects } from '@/lib/subjects';

export const dynamic = 'force-dynamic';

function getStudentWorkspaceDescription(subjectKey: string) {
  switch (subjectKey) {
    case 'math':
      return 'Solve, graph, diagnose mistakes, practice, and continue saved math threads.';
    case 'physics':
      return 'Work through concepts, formulas, units, variables, and physics word problems.';
    case 'chemistry':
      return 'Balance equations, reason through reactions, handle stoichiometry, and review conversions.';
    case 'biology':
      return 'Review vocabulary, compare processes, understand systems, and practice biology concepts.';
    default:
      return 'Open a student workspace for subject-specific tutoring and saved follow-up support.';
  }
}

export default function TutorPage() {
  const activeSubjects = Object.values(subjects).filter((subject) => subject.status === 'active');

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Student workspaces</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Choose the subject you want help with.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 840 }}>
              TutoVera student workspaces are organized by subject so the tutor can use the right
              examples, language, tools, and learning flow for what you are studying.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          {activeSubjects.map((subject) => (
            <Link
              key={subject.key}
              href={`${subject.path}/tutor`}
              className="card featureCard"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                borderColor: 'var(--accent-border)'
              }}
            >
              <span className="badge">{subject.name} Students</span>

              <h2 style={{ marginBottom: 8 }}>{subject.name}</h2>

              <p className="small" style={{ margin: 0 }}>
                {getStudentWorkspaceDescription(subject.key)}
              </p>

              <p className="small" style={{ margin: '14px 0 0' }}>
                <strong>Open {subject.name} Student Workspace →</strong>
              </p>
            </Link>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>One account, subject-specific learning.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              Each subject workspace keeps its own learning context while still sharing the same
              TutoVera account, settings, and saved history foundation.
            </p>
          </div>

          <div className="buttonRow">
            <Link className="btn secondary" href="/history">
              View Global History
            </Link>
            <Link className="btn secondary" href="/settings">
              Open Settings
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}