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

function getParentWorkspaceDetails(subjectKey: string) {
  switch (subjectKey) {
    case 'math':
      return [
        'Simple explanations parents can say aloud',
        'Guided hints without just giving the answer',
        'Likely mistake and misconception support',
        'Short examples and practice prompts'
      ];
    case 'physics':
      return [
        'Concepts explained before formulas',
        'Help with variables, units, and setup',
        'Parent-friendly analogies and examples',
        'Support for common physics confusions'
      ];
    case 'chemistry':
      return [
        'Reaction and equation explanations',
        'Balancing and conversion guidance',
        'Gentle ways to explain tricky steps',
        'Practice prompts parents can use'
      ];
    case 'biology':
      return [
        'Vocabulary explained in everyday language',
        'Process comparisons like mitosis vs. meiosis',
        'Systems and relationships explained clearly',
        'Review prompts for child-friendly study'
      ];
    default:
      return [
        'Parent-friendly explanation support',
        'Talking points and examples',
        'Likely mistake guidance',
        'Practice prompts for follow-up'
      ];
  }
}

export default function ParentsPage() {
  const activeSubjects = Object.values(subjects).filter((subject) => subject.status === 'active');

  return (
    <div className="grid parentHubPage" style={{ gap: 24 }}>
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
        <section className="parentSubjectAccordion" aria-label="Parent subject workspaces">
          {activeSubjects.map((subject, index) => (
            <details
              key={subject.key}
              className="card subjectWorkspaceDetails"
              open={index === 0}
            >
              <summary className="subjectWorkspaceSummary">
                <span className="subjectWorkspaceSummaryMain">
                  <span>
                    <span className="badge">{subject.name} Parents</span>
                    <h2 style={{ margin: '8px 0 0' }}>{subject.name}</h2>
                  </span>

                  <span className="small subjectWorkspaceSummaryText">
                    {getParentWorkspaceDescription(subject.key)}
                  </span>
                </span>
              </summary>

              <div className="subjectWorkspacePanel">
                <div style={{ display: 'grid', gap: 10 }}>
                  <p className="small" style={{ margin: 0 }}>
                    {getParentWorkspaceDescription(subject.key)}
                  </p>

                  <ul className="list" style={{ marginTop: 0 }}>
                    {getParentWorkspaceDetails(subject.key).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="buttonRow">
                  <Link className="btn" href={`${subject.path}/parents`}>
                    Open {subject.name} Parent Workspace
                  </Link>
                  <Link className="btn secondary" href={`${subject.path}/history`}>
                    View {subject.name} History
                  </Link>
                  <Link className="btn secondary" href={subject.path}>
                    About {subject.name}
                  </Link>
                </div>
              </div>
            </details>
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

      <style>
        {`
          .parentSubjectAccordion {
            display: grid;
            gap: 14px;
          }

          .subjectWorkspaceDetails {
            display: grid;
            gap: 0;
            overflow: hidden;
          }

          .subjectWorkspaceSummary {
            cursor: pointer;
            list-style: none;
          }

          .subjectWorkspaceSummary::-webkit-details-marker {
            display: none;
          }

          .subjectWorkspaceSummary::after {
            content: '+';
            float: right;
            color: var(--text-soft);
            font-weight: 800;
            margin-top: -34px;
          }

          .subjectWorkspaceDetails[open] .subjectWorkspaceSummary::after {
            content: '−';
          }

          .subjectWorkspaceSummaryMain {
            display: grid;
            grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
            gap: 18px;
            align-items: center;
            padding-right: 24px;
          }

          .subjectWorkspaceSummaryText {
            margin: 0;
            color: var(--text-soft);
          }

          .subjectWorkspacePanel {
            display: grid;
            gap: 16px;
            padding-top: 16px;
            margin-top: 16px;
            border-top: 1px solid var(--border);
          }

          @media (max-width: 760px) {
            .subjectWorkspaceSummaryMain {
              grid-template-columns: 1fr;
              gap: 10px;
            }

            .subjectWorkspaceSummary::after {
              margin-top: -28px;
            }
          }
        `}
      </style>
    </div>
  );
}