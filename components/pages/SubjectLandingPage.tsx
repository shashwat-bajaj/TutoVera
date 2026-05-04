import Link from 'next/link';
import Reveal from '@/components/Reveal';
import type { SubjectConfig } from '@/lib/subjects';

type SubjectLandingPageProps = {
  subject: SubjectConfig;
};

function getStatusDescription(subject: SubjectConfig) {
  if (subject.status === 'active') {
    return `TutoVera ${subject.name} is active now with student, parent, and history workspaces.`;
  }

  if (subject.status === 'beta') {
    return `${subject.name} is being prepared as one of the next TutoVera subject branches. Active TutoVera branches are available now while this workspace is still being prepared.`;
  }

  return `${subject.name} is being prepared as a TutoVera subject branch. Active TutoVera branches are available now while this workspace is still being refined.`;
}

function getPreviewPrompt(subject: SubjectConfig) {
  return subject.tutor.examplePrompts[0] || `Help me understand a ${subject.name} topic.`;
}

function getPreviewResponse(subject: SubjectConfig) {
  switch (subject.key) {
    case 'physics':
      return 'TutoVera Physics helps identify the concept, organize known values, check units, connect formulas, and explain each step clearly.';
    case 'chemistry':
      return 'TutoVera Chemistry helps explain reactions, balance equations, track units, and connect calculations to chemical reasoning.';
    case 'biology':
      return 'TutoVera Biology helps clarify vocabulary, compare processes, explain systems, and connect details to the bigger concept.';
    case 'math':
    default:
      return 'TutoVera Math helps explain the steps, show the reasoning, support follow-up questions, and keep the learning thread connected.';
  }
}

function getPreviewCards(subject: SubjectConfig) {
  switch (subject.key) {
    case 'physics':
      return [
        {
          label: 'Concept first',
          text: 'Explain the physical idea before choosing formulas.'
        },
        {
          label: 'Units matter',
          text: 'Track variables, units, and substitutions clearly.'
        }
      ];
    case 'chemistry':
      return [
        {
          label: 'Equation support',
          text: 'Balance reactions and walk through stoichiometry.'
        },
        {
          label: 'Lab reasoning',
          text: 'Connect observations, units, conversions, and formulas.'
        }
      ];
    case 'biology':
      return [
        {
          label: 'Vocabulary clarity',
          text: 'Break down terms before connecting them to systems.'
        },
        {
          label: 'Process review',
          text: 'Compare processes and connect details to the big picture.'
        }
      ];
    case 'math':
    default:
      return [
        {
          label: 'Step-by-step help',
          text: 'Explain the reasoning without skipping key steps.'
        },
        {
          label: 'Visual support',
          text: 'Use graphs when a function or curve helps the explanation.'
        }
      ];
  }
}

function getUseCases(subject: SubjectConfig) {
  switch (subject.key) {
    case 'physics':
      return [
        {
          title: 'Concept first',
          text: 'Explain forces, energy, waves, circuits, and motion before jumping into equations.'
        },
        {
          title: 'Formula reasoning',
          text: 'Help students choose formulas, understand variables, check units, and follow each step.'
        },
        {
          title: 'Problem setup',
          text: 'Turn word problems into known values, unknown values, diagrams, and a clear path forward.'
        }
      ];
    case 'chemistry':
      return [
        {
          title: 'Chemical reasoning',
          text: 'Explain reactions, bonding, acids and bases, molarity, and why each step makes sense.'
        },
        {
          title: 'Equation support',
          text: 'Guide balancing, stoichiometry, conversions, units, and formula use without skipping logic.'
        },
        {
          title: 'Lab-style thinking',
          text: 'Support observation-based reasoning, calculations, and interpretation of experiment-style questions.'
        }
      ];
    case 'biology':
      return [
        {
          title: 'Process clarity',
          text: 'Explain systems like mitosis, DNA replication, respiration, evolution, and physiology clearly.'
        },
        {
          title: 'Vocabulary support',
          text: 'Break down biology terms in simple language and connect them to real biological processes.'
        },
        {
          title: 'Big-picture learning',
          text: 'Help students connect details, diagrams, structures, and functions into a clearer overall picture.'
        }
      ];
    case 'math':
    default:
      return [
        {
          title: 'Step-by-step help',
          text: 'Support algebra, calculus, statistics, and problem-solving with clear intermediate steps.'
        },
        {
          title: 'Graph-aware support',
          text: 'Graphable math questions can show a visual graph when a function or curve helps the explanation.'
        },
        {
          title: 'Mistake diagnosis',
          text: 'Help users identify where their setup, sign, arithmetic, algebra, or reasoning went wrong.'
        }
      ];
  }
}

function getFinalHeading(subject: SubjectConfig) {
  if (subject.status === 'active') {
    return `TutoVera ${subject.name} is active now.`;
  }

  if (subject.status === 'beta') {
    return `${subject.name} is being prepared inside TutoVera.`;
  }

  return `${subject.name} is being refined inside TutoVera.`;
}

export default function SubjectLandingPage({ subject }: SubjectLandingPageProps) {
  const isActive = subject.status === 'active';
  const previewPrompt = getPreviewPrompt(subject);
  const previewResponse = getPreviewResponse(subject);
  const previewCards = getPreviewCards(subject);
  const useCases = getUseCases(subject);

  return (
    <div className="grid" style={{ gap: 34 }}>
      <section className="homeLead">
        <div className="homeLeadGrid" style={{ alignItems: 'start' }}>
          <div className="homeLeadCopy">
            <h1 className="homeLeadTitle">
              {subject.name} support shaped for the TutoVera learning system.
            </h1>

            <p className="homeLeadSubtext">{subject.description}</p>

            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              {getStatusDescription(subject)}
            </p>

            <div className="buttonRow">
              {isActive ? (
                <>
                  <Link className="btn" href={`${subject.path}/tutor`}>
                    Open Student Workspace
                  </Link>
                  <Link className="btn secondary" href={`${subject.path}/parents`}>
                    Open Parent Workspace
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn" href="/tutor">
                    Choose Student Workspace
                  </Link>
                  <Link className="btn secondary" href="/parents">
                    Choose Parent Workspace
                  </Link>
                </>
              )}
            </div>

            <div className="homeLeadProof">
              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">✦</span>
                <div>
                  <strong>Ask in context</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Start with a {subject.name.toLowerCase()} question, example, topic, or confusing
                    step.
                  </p>
                </div>
              </div>

              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">↗</span>
                <div>
                  <strong>Follow the reasoning</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Work through explanations that match the subject instead of getting a generic
                    answer.
                  </p>
                </div>
              </div>

              <div className="homeLeadProofItem">
                <span className="homeLeadProofIcon">◎</span>
                <div>
                  <strong>Keep learning</strong>
                  <p className="small" style={{ margin: 0 }}>
                    Use follow-ups, saved history, and parent support to continue from where you
                    left off.
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
                      <h2>TutoVera {subject.name} preview</h2>
                      <p>Subject-specific help inside the same calm workspace.</p>
                    </div>

                    <div
                      className="homePreviewHours"
                      style={{ gridTemplateColumns: '1fr', justifyItems: 'end' }}
                    >
                      <span>Mode</span>
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
                          “{previewPrompt}”
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
                          {previewResponse}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="homeRecommendedCard">
                    <span>What this branch supports</span>

                    <div className="homeRecommendedList">
                      {previewCards.map((card, index) => (
                        <div
                          key={card.label}
                          className="homeRecommendedItem"
                          style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}
                        >
                          <i aria-hidden="true">{index === 0 ? '✣' : '✦'}</i>
                          <strong>{card.label}</strong>
                        </div>
                      ))}
                    </div>

                    <p className="small" style={{ margin: 0 }}>
                      {previewCards.map((card) => card.text).join(' ')}
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
            <span className="badge">How it’s used</span>
            <h2 style={{ margin: 0 }}>One {subject.name.toLowerCase()} workspace, two ways in.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 1120 }}>
              Students can work through {subject.name.toLowerCase()} questions, explanations, and
              follow-ups. Parents can get simpler guidance, examples, talking points, and practice
              support without jumping straight to the final answer.
            </p>
          </div>

          <div className="sectionSplit">
            <div className="sectionCell">
              <span className="badge">Students</span>
              <h3 style={{ margin: 0 }}>Work through {subject.name.toLowerCase()}, then keep going.</h3>
              <p className="small" style={{ margin: 0, maxWidth: 640 }}>
                Best for explanations, guided reasoning, checking mistakes, practice prompts, and
                asking the next question without restarting the whole flow.
              </p>
              <div className="buttonRow">
                <Link className="btn" href={`${subject.path}/tutor`}>
                  Go to Students
                </Link>
              </div>
            </div>

            <div className="sectionCell">
              <span className="badge">Parents</span>
              <h3 style={{ margin: 0 }}>Support a child more clearly.</h3>
              <p className="small" style={{ margin: 0, maxWidth: 640 }}>
                Best for simpler explanations, parent talking points, child-friendly examples, and
                guided help that supports learning instead of replacing it.
              </p>
              <div className="buttonRow">
                <Link className="btn secondary" href={`${subject.path}/parents`}>
                  Go to Parents
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Example prompts</span>
            <h2 style={{ margin: 0 }}>What users may ask in {subject.name}.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              These examples come from the subject configuration and help shape the kind of
              subject-specific tutor behavior this branch supports.
            </p>
          </div>

          <div className="grid cols-3">
            {subject.tutor.examplePrompts.map((prompt) => (
              <div key={prompt} className="card questionSurface" style={{ padding: 14 }}>
                <p className="small" style={{ margin: 0 }}>
                  {prompt}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="badge">Best for</span>
            <h2 style={{ margin: 0 }}>{subject.name} learning support that stays practical.</h2>
            <p className="small" style={{ margin: 0, maxWidth: 840 }}>
              Each branch keeps the same TutoVera structure while adapting the examples, explanations,
              and guidance to the subject.
            </p>
          </div>

          <div className="grid cols-3">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="card featureCard">
                <h3 style={{ margin: 0 }}>{useCase.title}</h3>
                <p className="small" style={{ margin: 0 }}>
                  {useCase.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>{getFinalHeading(subject)}</h2>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              {isActive
                ? `TutoVera ${subject.name} has its own student workspace, parent workspace, and subject-specific history while still sharing the broader TutoVera foundation.`
                : `This ${subject.name} branch is connected to the broader TutoVera foundation so it can support its own tutor behavior, examples, history, and learning flow without splitting into a separate app.`}
            </p>
          </div>

          <div className="buttonRow">
            {isActive ? (
              <>
                <Link className="btn" href={`${subject.path}/tutor`}>
                  Open Student Workspace
                </Link>
                <Link className="btn secondary" href={`${subject.path}/parents`}>
                  Open Parent Workspace
                </Link>
              </>
            ) : (
              <>
                <Link className="btn" href="/tutor">
                  Choose Student Workspace
                </Link>
                <Link className="btn secondary" href="/parents">
                  Choose Parent Workspace
                </Link>
                <Link className="btn secondary" href="/contact">
                  Contact / Feedback
                </Link>
              </>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}