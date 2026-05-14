import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { subjects } from '@/lib/subjects';

export const dynamic = 'force-dynamic';

function getParentWorkspaceDescription(subjectKey: string) {
  switch (subjectKey) {
    case 'math':
      return 'Get parent-friendly explanations, examples, hints, and talking points for math learning.';
    case 'physics':
      return 'Help a child understand physics concepts, formulas, units, and common confusions.';
    case 'chemistry':
      return 'Explain reactions, balancing, conversions, and chemistry reasoning in simpler language.';
    case 'biology':
      return 'Break down biology vocabulary, systems, processes, and comparisons for a child.';
    default:
      return 'Open a parent workspace for subject-specific guidance and child-friendly explanations.';
  }
}

export default function ParentsPage() {
  const activeSubjects = Object.values(subjects).filter((subject) => subject.status === 'active');

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Parent workspaces</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Choose the subject your child needs help with.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 840 }}>
              TutoVera parent workspaces are designed for adults helping a child learn. Choose a
              subject to get simpler explanations, talking points, likely-mistake guidance, examples,
              and practice prompts.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          {activeSubjects.map((subject) => (
            <Link
              key={subject.key}
              href={`${subject.path}/parents`}
              className="card featureCard"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                borderColor: 'var(--accent-border)'
              }}
            >
              <span className="badge">{subject.name} Parents</span>

              <h2 style={{ marginBottom: 8 }}>{subject.name}</h2>

              <p className="small" style={{ margin: 0 }}>
                {getParentWorkspaceDescription(subject.key)}
              </p>

              <p className="small" style={{ margin: '14px 0 0' }}>
                <strong>Open {subject.name} Parent Workspace →</strong>
              </p>
            </Link>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Guided help without replacing the learning.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              Parent workspaces are intentionally shaped around guidance, explanation, and support
              rather than simply giving a child the final answer.
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