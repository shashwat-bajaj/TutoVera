import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import SubjectTutor from '@/components/SubjectTutor';
import ConversationThread from '@/components/ConversationThread';
import DeleteConversationButton from '@/components/DeleteConversationButton';
import Reveal from '@/components/Reveal';
import { getSubjectConfig, subjects, type SubjectConfig, type SubjectKey } from '@/lib/subjects';

type ConversationRecord = {
  id: string;
  title: string | null;
  audience: string;
  created_at: string;
  updated_at: string;
};

type TurnRecord = {
  id: string;
  turn_index: number | null;
  mode: string;
  level: string;
  prompt: string;
  response: string;
  created_at: string;
};

type StudentWorkspacePageProps = {
  searchParams: Promise<{ conversation?: string }>;
  subject?: SubjectKey;
};

function getWorkspaceIntro(subject: SubjectConfig) {
  if (subject.key === 'math') {
    return {
      badge: 'Student workspace',
      signedOutTitle: 'Ask directly, follow up naturally, and keep the math flow going.',
      signedOutDescription:
        'Use this workspace for direct math help, graphing, worked solutions, hints, mistake diagnosis, and practice questions. Signed-in users can also save sessions and revisit them later.',
      signedInTitle: 'A focused tutor workspace for actual study flow.',
      signedInDescription:
        'Ask a new question, continue a session opened from history, graph when needed, and keep follow-up questions inside the same learning thread.',
      defaultFlow: 'Auto mode, graph-aware follow-ups, and structured tutor continuity.',
      bestFor: 'Solving, graphing, revising, checking mistakes, and building on earlier work.',
      tutorDescription:
        'Ask a new question or continue an earlier student session with follow-up questions, graph requests, and guided explanation.'
    };
  }

  if (subject.key === 'physics') {
    return {
      badge: 'Physics student workspace',
      signedOutTitle: 'Work through physics concepts, formulas, units, and problem setup.',
      signedOutDescription:
        'Use this workspace for physics explanations, equation-based reasoning, variable setup, unit checks, conceptual questions, and practice prompts. Signed-in users can also save sessions and revisit them later.',
      signedInTitle: 'A focused physics workspace for concepts, units, and follow-up flow.',
      signedInDescription:
        'Ask new physics questions, continue sessions opened from history, reason through formulas, and keep the learning thread connected.',
      defaultFlow:
        'Auto mode, concept-first explanations, unit-aware reasoning, and structured tutor continuity.',
      bestFor:
        'Concepts, formulas, units, word problems, checking mistakes, and building on earlier work.',
      tutorDescription:
        'Ask a new physics question or continue an earlier Physics session with follow-up questions, formula reasoning, units, and guided explanation.'
    };
  }

  if (subject.key === 'chemistry') {
    return {
      badge: 'Chemistry student workspace',
      signedOutTitle: 'Work through chemistry reactions, formulas, conversions, and reasoning.',
      signedOutDescription:
        'Use this workspace for chemistry explanations, balancing equations, stoichiometry, molarity, unit conversions, reactions, and practice prompts. Signed-in users can also save sessions and revisit them later.',
      signedInTitle: 'A focused chemistry workspace for reactions, units, and follow-up flow.',
      signedInDescription:
        'Ask new chemistry questions, continue sessions opened from history, reason through formulas and reactions, and keep the learning thread connected.',
      defaultFlow:
        'Auto mode, reaction-aware explanations, unit-aware reasoning, and structured tutor continuity.',
      bestFor:
        'Balancing, stoichiometry, reactions, conversions, lab-style reasoning, and checking mistakes.',
      tutorDescription:
        'Ask a new chemistry question or continue an earlier Chemistry session with follow-up questions, equation support, conversions, units, and guided explanation.'
    };
  }

  if (subject.key === 'biology') {
    return {
      badge: 'Biology student workspace',
      signedOutTitle: 'Work through biology vocabulary, systems, processes, and big-picture ideas.',
      signedOutDescription:
        'Use this workspace for biology explanations, process comparisons, vocabulary support, systems thinking, review prompts, and practice questions. Signed-in users can also save sessions and revisit them later.',
      signedInTitle: 'A focused biology workspace for systems, vocabulary, and follow-up flow.',
      signedInDescription:
        'Ask new biology questions, continue sessions opened from history, compare processes, and keep the learning thread connected.',
      defaultFlow:
        'Auto mode, process-aware explanations, vocabulary support, and structured tutor continuity.',
      bestFor:
        'Processes, systems, vocabulary, diagrams, comparisons, review, and practice prompts.',
      tutorDescription:
        'Ask a new biology question or continue an earlier Biology session with follow-up questions, process explanations, comparisons, and guided review.'
    };
  }

  return {
    badge: `${subject.name} student workspace`,
    signedOutTitle: `Work through ${subject.name.toLowerCase()} questions with a clearer learning flow.`,
    signedOutDescription: `Use this workspace for ${subject.name.toLowerCase()} explanations, guided support, diagnosis, and practice prompts. Signed-in users can also save sessions and revisit them later.`,
    signedInTitle: `A focused ${subject.name.toLowerCase()} workspace for ongoing study flow.`,
    signedInDescription: `Ask new ${subject.name.toLowerCase()} questions, continue sessions opened from history, and keep the learning thread connected.`,
    defaultFlow: 'Auto mode, guided explanations, and structured tutor continuity.',
    bestFor: `Understanding, revising, checking mistakes, and building on earlier ${subject.name.toLowerCase()} work.`,
    tutorDescription: `Ask a new ${subject.name.toLowerCase()} question or continue an earlier session with follow-up questions and guided explanation.`
  };
}

export default async function StudentWorkspacePage({
  searchParams,
  subject = 'math'
}: StudentWorkspacePageProps) {
  const params = await searchParams;
  const selectedConversationId = (params.conversation || '').trim();

  const subjectConfig = getSubjectConfig(subject) || subjects.math;
  const studentWorkspaceHref = `${subjectConfig.path}/tutor`;
  const studentHistoryHref = `${subjectConfig.path}/history`;
  const copy = getWorkspaceIntro(subjectConfig);

  const authClient = await createAuthClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  const supabase = createAdminSupabase();

  let savedConversationCount = 0;
  let selectedConversation: ConversationRecord | null = null;
  let turns: TurnRecord[] = [];

  if (user?.id) {
    const { count } = await supabase
      .from('learner_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('subject', subjectConfig.key)
      .eq('audience', 'student');

    savedConversationCount = count || 0;

    if (selectedConversationId) {
      const { data } = await supabase
        .from('learner_conversations')
        .select('id, title, audience, created_at, updated_at')
        .eq('id', selectedConversationId)
        .eq('user_id', user.id)
        .eq('subject', subjectConfig.key)
        .eq('audience', 'student')
        .maybeSingle();

      selectedConversation = (data || null) as ConversationRecord | null;
    }
  }

  if (selectedConversation) {
    const { data } = await supabase
      .from('learner_sessions')
      .select('id, turn_index, mode, level, prompt, response, created_at')
      .eq('conversation_id', selectedConversation.id)
      .eq('subject', subjectConfig.key)
      .order('turn_index', { ascending: true })
      .order('created_at', { ascending: true });

    turns = (data || []) as TurnRecord[];
  }

  if (!user) {
    return (
      <div className="grid" style={{ gap: 24 }}>
        <Reveal delay={0.02}>
          <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
            <span className="badge">{copy.badge}</span>

            <div style={{ display: 'grid', gap: 10 }}>
              <h1 style={{ margin: 0 }}>{copy.signedOutTitle}</h1>
              <p className="small" style={{ margin: 0, maxWidth: 840 }}>
                {copy.signedOutDescription}
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <SubjectTutor
            subject={subjectConfig.key}
            audience="student"
            title={`Tutor Support for ${subjectConfig.name} Students`}
            description={copy.tutorDescription}
          />
        </Reveal>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <span className="badge">{copy.badge}</span>
            <h1 style={{ margin: 0 }}>{copy.signedInTitle}</h1>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              {copy.signedInDescription} Signed in as <strong>{user.email}</strong>.
            </p>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12
            }}
          >
            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Saved sessions</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {savedConversationCount} in your {subjectConfig.name.toLowerCase()} student history.
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Default flow</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {copy.defaultFlow}
              </p>
            </div>

            <div className="card innerFeatureCard">
              <p className="small" style={{ margin: '0 0 4px' }}>
                <strong>Best for</strong>
              </p>
              <p className="small" style={{ margin: 0 }}>
                {copy.bestFor}
              </p>
            </div>
          </div>

          <div className="buttonRow">
            <a className="btn secondary" href={studentHistoryHref}>
              Open {subjectConfig.name} History
            </a>
            <a className="btn secondary" href={studentWorkspaceHref}>
              New Session
            </a>
          </div>
        </section>
      </Reveal>

      {selectedConversationId && !selectedConversation ? (
        <Reveal delay={0.06}>
          <section className="card" style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Session not found</h2>
            <p className="small" style={{ margin: 0 }}>
              This student session was not found for your account, or it belongs to another subject
              or workspace.
            </p>
            <div className="buttonRow">
              <a className="btn secondary" href={studentHistoryHref}>
                Open History
              </a>
              <a className="btn" href={studentWorkspaceHref}>
                Start New Session
              </a>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.08}>
        <SubjectTutor
          subject={subjectConfig.key}
          audience="student"
          initialConversationId={selectedConversation?.id || null}
          newSessionHref={studentWorkspaceHref}
          title={`Tutor Support for ${subjectConfig.name} Students`}
          description={copy.tutorDescription}
        />
      </Reveal>

      {selectedConversation && turns.length > 0 ? (
        <Reveal delay={0.14}>
          <section className="card" style={{ display: 'grid', gap: 16 }}>
            <div className="buttonRow" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <h2 style={{ margin: 0 }}>Current Session Thread</h2>
                <p className="small" style={{ margin: 0 }}>
                  This session was opened from history. Continue the thread above or review the full
                  question-and-answer flow below.
                </p>
              </div>

              <DeleteConversationButton
                conversationId={selectedConversation.id}
                redirectHref={studentWorkspaceHref}
              />
            </div>

            <ConversationThread
              title={selectedConversation.title}
              audience={selectedConversation.audience}
              createdAt={selectedConversation.created_at}
              updatedAt={selectedConversation.updated_at}
              turns={turns}
              showDeleteTurnControls
              redirectHref={`${studentWorkspaceHref}?conversation=${selectedConversation.id}`}
              graphingEnabled={subjectConfig.features.graphing}
            />
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}