import Link from 'next/link';
import Reveal from '@/components/Reveal';
import type { SubjectConfig } from '@/lib/subjects';

type SubjectAboutPageContentProps = {
  subject: SubjectConfig;
};

function getAboutCopy(subject: SubjectConfig) {
  switch (subject.key) {
    case 'physics':
      return {
        title: 'Built to make physics feel clearer, calmer, and easier to reason through.',
        intro:
          'TutoVera Physics is a concept-first physics workspace for students and parents. The goal is to help users understand what is happening, connect formulas to meaning, check units, and continue from one question to the next without losing the thread.',
        cards: [
          {
            title: 'Concepts before formulas',
            text: 'Physics support should explain the physical idea first, then connect it to variables, equations, and units.'
          },
          {
            title: 'Built for word problems',
            text: 'The workspace helps turn a situation into known values, unknown values, formula choices, and a clearer path forward.'
          },
          {
            title: 'Parent-friendly support',
            text: 'The parent workspace helps adults explain ideas aloud using simpler language, examples, and likely-mistake guidance.'
          }
        ],
        visionTitle: 'What TutoVera Physics is trying to become',
        vision:
          'The long-term vision is a physics support system that feels less like a generic chatbot and more like a structured study environment — something that can explain concepts, guide formula setup, check units, support practice, and preserve context across sessions.',
        currentFocus:
          'Right now the Physics branch is focused on strengthening concept-first tutoring, formula reasoning, unit-aware explanations, parent guidance, saved history, and a calmer overall study flow.'
      };

    case 'chemistry':
      return {
        title: 'Built to make chemistry reasoning easier to follow.',
        intro:
          'TutoVera Chemistry is a learning workspace for reactions, formulas, conversions, lab-style reasoning, and conceptual chemistry support. The goal is to help students and parents understand why each step makes sense instead of memorizing disconnected procedures.',
        cards: [
          {
            title: 'Chemical reasoning',
            text: 'Support should explain why a reaction, formula, or conversion step makes sense.'
          },
          {
            title: 'Equation support',
            text: 'Chemistry support can help with balancing, stoichiometry, molarity, and unit conversions.'
          },
          {
            title: 'Lab-style thinking',
            text: 'The branch can support observation, calculation, and interpretation in lab-style questions.'
          }
        ],
        visionTitle: 'What TutoVera Chemistry is trying to become',
        vision:
          'The goal is a chemistry workspace that explains reactions, units, equations, conversions, and lab reasoning clearly while staying connected to the broader TutoVera account and history system.',
        currentFocus:
          'Right now the Chemistry branch is focused on clearer reaction reasoning, balancing support, stoichiometry guidance, parent-friendly explanations, saved history, and smoother subject-specific tutoring.'
      };

    case 'biology':
      return {
        title: 'Built to make biology systems and vocabulary easier to connect.',
        intro:
          'TutoVera Biology is a learning workspace for cells, genetics, evolution, anatomy, physiology, ecology, and biological processes. The goal is to help users connect vocabulary, structures, processes, and systems into a clearer bigger picture.',
        cards: [
          {
            title: 'Vocabulary clarity',
            text: 'Support should explain biology terms in everyday language before connecting them to formal definitions.'
          },
          {
            title: 'Process understanding',
            text: 'Biology support can compare processes, summarize systems, and explain how details connect.'
          },
          {
            title: 'Big-picture learning',
            text: 'The branch helps users move from memorizing isolated facts to understanding living systems.'
          }
        ],
        visionTitle: 'What TutoVera Biology is trying to become',
        vision:
          'The goal is a biology workspace that makes vocabulary, diagrams, systems, structures, functions, and processes easier to understand and review.',
        currentFocus:
          'Right now the Biology branch is focused on clearer process explanations, vocabulary support, system comparisons, parent-friendly guidance, saved history, and smoother subject-specific tutoring.'
      };

    case 'math':
    default:
      return {
        title: 'Built to make math feel clearer, calmer, and easier to continue.',
        intro:
          'TutoVera Math is a learning-first math workspace for students and parents. The goal is not just to produce answers, but to help users understand what is happening, ask better follow-up questions, and return to earlier work without losing the thread.',
        cards: [
          {
            title: 'Learning over answer dumping',
            text: 'The product is designed around explanation, guided support, diagnosis, and practice rather than one-click answer output.'
          },
          {
            title: 'Built for real follow-ups',
            text: 'Sessions are meant to continue naturally, so users can ask the next question without starting from zero each time.'
          },
          {
            title: 'Accessible by design',
            text: 'Read aloud, translation, cleaner structure, and graph support help make the experience easier to use across different learning styles.'
          }
        ],
        visionTitle: 'What TutoVera Math is trying to become',
        vision:
          'The long-term vision is a math support system that feels less like a generic chatbot and more like a structured study environment — something that can teach, graph, diagnose, adapt, and remember context in a way that is actually useful for learning.',
        currentFocus:
          'Right now the Math branch is focused on cleaner responses, better follow-up flow, graph support, session history, parent guidance, and a more polished overall interface.'
      };
  }
}

export default function SubjectAboutPageContent({ subject }: SubjectAboutPageContentProps) {
  const copy = getAboutCopy(subject);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">About TutoVera {subject.name}</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>{copy.title}</h1>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              {copy.intro}
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          {copy.cards.map((card) => (
            <div key={card.title} className="card innerFeatureCard">
              <h3 style={{ marginTop: 0 }}>{card.title}</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                {card.text}
              </p>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>{copy.visionTitle}</h2>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              {copy.vision}
            </p>
          </div>

          <div className="grid cols-3">
            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>For students</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                A workspace for asking questions, understanding reasoning, checking mistakes,
                practicing similar prompts, and revisiting saved sessions later.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>For parents</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                A guided support flow for adults helping a child learn, with simpler phrasing,
                examples, talking points, and parent-friendly explanation.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>For TutoVera</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                A calmer interface, better continuity, stronger subject-specific support, and more
                intentional interaction design than a typical homework-help tool.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: 0 }}>Current focus</h2>
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              {copy.currentFocus}
            </p>
          </div>

          <div className="buttonRow">
            <Link className="btn" href={`${subject.path}/tutor`}>
              Open Student Workspace
            </Link>
            <Link className="btn secondary" href={`${subject.path}/parents`}>
              Open Parent Workspace
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}