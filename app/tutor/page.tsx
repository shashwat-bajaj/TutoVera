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

function getStudentWorkspaceDetails(subjectKey: string) {
  switch (subjectKey) {
    case 'math':
      return [
        'Step-by-step solving and explanation',
        'Graph support for supported math expressions',
        'Mistake diagnosis and practice prompts',
        'Saved follow-up sessions for continued learning'
      ];
    case 'physics':
      return [
        'Concept-first explanations',
        'Formula selection and variable setup',
        'Unit tracking and substitution help',
        'Guided word-problem reasoning'
      ];
    case 'chemistry':
      return [
        'Equation balancing support',
        'Stoichiometry and conversion help',
        'Reaction and bonding explanations',
        'Lab-style reasoning when relevant'
      ];
    case 'biology':
      return [
        'Vocabulary explained in simpler language',
        'Process comparisons and summaries',
        'Systems and structure-function support',
        'Practice questions for review'
      ];
    default:
      return [
        'Subject-specific tutor behavior',
        'Student-focused explanations',
        'Saved sessions and follow-ups',
        'Practice and review support'
      ];
  }
}

export default function TutorPage() {
  const activeSubjects = Object.values(subjects).filter((subject) => subject.status === 'active');

  return (
    <div className="grid studentHubPage" style={{ gap: 24 }}>
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
        <section className="studentSubjectAccordion" aria-label="Student subject workspaces">
          {activeSubjects.map((subject, index) => (
            <details
              key={subject.key}
              className="card subjectWorkspaceDetails"
              open={index === 0}
            >
              <summary className="subjectWorkspaceSummary">
                <span className="subjectWorkspaceSummaryMain">
                  <span>
                    <span className="badge">{subject.name} Students</span>
                    <h2 style={{ margin: '8px 0 0' }}>{subject.name}</h2>
                  </span>

                  <span className="small subjectWorkspaceSummaryText">
                    {getStudentWorkspaceDescription(subject.key)}
                  </span>
                </span>
              </summary>

              <div className="subjectWorkspacePanel">
                <div style={{ display: 'grid', gap: 10 }}>
                  <p className="small" style={{ margin: 0 }}>
                    {getStudentWorkspaceDescription(subject.key)}
                  </p>

                  <ul className="list" style={{ marginTop: 0 }}>
                    {getStudentWorkspaceDetails(subject.key).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="buttonRow">
                  <Link className="btn" href={`${subject.path}/tutor`}>
                    Open {subject.name} Student Workspace
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

      <style>
        {`
          .studentSubjectAccordion {
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