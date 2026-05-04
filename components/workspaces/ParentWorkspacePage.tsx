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

type ParentWorkspacePageProps = {
  searchParams: Promise<{ conversation?: string }>;
  subject?: SubjectKey;
};

function getParentWorkspaceCopy(subject: SubjectConfig) {
  if (subject.key === 'math') {
    return {
      badge: 'Parent workspace',
      signedOutTitle:
        'Guidance for helping a child learn, without jumping straight to the final answer.',
      signedOutDescription:
        'Use this workspace when you want parent-friendly explanation, simple examples, talking points, likely-mistake guidance, and practice prompts that help a child understand the concept more clearly.',
      signedInTitle: 'A focused parent workspace for helping a child learn more clearly.',
      signedInDescription:
        'Ask for simpler explanations, talking points, examples, likely-mistake guidance, and practice prompts. Sessions opened from history can be continued here.',
      defaultFlow:
        'Guided hint mode with child-level explanation and parent-friendly support.',
      bestFor:
        'Explaining concepts aloud, giving examples, spotting confusion, and supporting practice.',
      tutorDescription:
        'Use this version when you want parent-friendly guidance, simpler explanation, talking points, examples, and practice prompts without jumping straight to the full solution.',
      placeholder:
        'Example: My child is learning long division and gets confused after the first subtraction step. How can I explain it clearly?'
    };
  }

  if (subject.key === 'physics') {
    return {
      badge: 'Physics parent workspace',
      signedOutTitle:
        'Guidance for helping a child understand physics without simply giving the answer.',
      signedOutDescription:
        'Use this workspace when you want parent-friendly physics explanations, simple examples, talking points, likely-mistake guidance, and practice prompts that help a child understand the concept more clearly.',
      signedInTitle: 'A focused parent workspace for helping a child learn physics more clearly.',
      signedInDescription:
        'Ask for simpler explanations, everyday analogies, formula setup guidance, unit-checking support, and likely-mistake guidance. Sessions opened from history can be continued here.',
      defaultFlow:
        'Guided hint mode with concept-first explanation, parent-friendly language, and unit-aware support.',
      bestFor:
        'Explaining concepts aloud, connecting formulas to meaning, spotting confusion, and supporting practice.',
      tutorDescription:
        'Use this version when you want parent-friendly Physics guidance, simpler explanations, talking points, examples, and practice prompts without jumping straight to a full solution.',
      placeholder:
        "Example: My child is learning Newton's second law and keeps mixing up force, mass, and acceleration. How can I explain it clearly?"
    };
  }

  if (subject.key === 'chemistry') {
    return {
      badge: 'Chemistry parent workspace',
      signedOutTitle:
        'Guidance for helping a child understand chemistry without simply giving the answer.',
      signedOutDescription:
        'Use this workspace when you want parent-friendly chemistry explanations, simple examples, reaction reasoning, likely-mistake guidance, and practice prompts that help a child understand the concept more clearly.',
      signedInTitle:
        'A focused parent workspace for helping a child learn chemistry more clearly.',
      signedInDescription:
        'Ask for simpler explanations, reaction setup guidance, unit conversion support, and likely-mistake guidance. Sessions opened from history can be continued here.',
      defaultFlow:
        'Guided hint mode with reaction-aware explanation, parent-friendly language, and unit-aware support.',
      bestFor:
        'Explaining concepts aloud, connecting equations to meaning, spotting confusion, and supporting practice.',
      tutorDescription:
        'Use this version when you want parent-friendly Chemistry guidance, simpler explanations, talking points, examples, and practice prompts without jumping straight to a full solution.',
      placeholder:
        'Example: My child is learning chemical equation balancing and keeps changing only one side. How can I explain it clearly?'
    };
  }

  if (subject.key === 'biology') {
    return {
      badge: 'Biology parent workspace',
      signedOutTitle:
        'Guidance for helping a child understand biology concepts more clearly.',
      signedOutDescription:
        'Use this workspace when you want parent-friendly biology explanations, simple examples, vocabulary support, process comparisons, likely-mistake guidance, and practice prompts.',
      signedInTitle: 'A focused parent workspace for helping a child learn biology more clearly.',
      signedInDescription:
        'Ask for simpler explanations, everyday analogies, vocabulary breakdowns, process comparisons, and likely-mistake guidance. Sessions opened from history can be continued here.',
      defaultFlow:
        'Guided hint mode with process-aware explanation, parent-friendly language, and vocabulary support.',
      bestFor:
        'Explaining concepts aloud, connecting vocabulary to meaning, spotting confusion, and supporting review.',
      tutorDescription:
        'Use this version when you want parent-friendly Biology guidance, simpler explanations, talking points, examples, and practice prompts.',
      placeholder:
        'Example: My child is learning mitosis and meiosis and keeps mixing them up. How can I explain the difference clearly?'
    };
  }

  return {
    badge: `${subject.name} parent workspace`,
    signedOutTitle: `Guidance for helping a child understand ${subject.name.toLowerCase()} more clearly.`,
    signedOutDescription: `Use this workspace when you want parent-friendly ${subject.name.toLowerCase()} explanations, examples, talking points, likely-mistake guidance, and practice prompts.`,
    signedInTitle: `A focused parent workspace for helping a child learn ${subject.name.toLowerCase()} more clearly.`,
    signedInDescription: `Ask for simpler explanations, examples, likely-mistake guidance, and practice prompts. Sessions opened from history can be continued here.`,
    defaultFlow:
      'Guided hint mode with child-level explanation and parent-friendly support.',
    bestFor:
      'Explaining concepts aloud, giving examples, spotting confusion, and supporting practice.',
    tutorDescription: `Use this version when you want parent-friendly ${subject.name} guidance without jumping straight to the full answer.`,
    placeholder: `Example: My child is learning a ${subject.name.toLowerCase()} topic and feels stuck. How can I explain it clearly?`
  };
}

export default async function ParentWorkspacePage({
  searchParams,
  subject = 'math'
}: ParentWorkspacePageProps) {
  const params = await searchParams;
  const selectedConversationId = (params.conversation || '').trim();

  const subjectConfig = getSubjectConfig(subject) || subjects.math;
  const parentWorkspaceHref = `${subjectConfig.path}/parents`;
  const parentHistoryHref = `${subjectConfig.path}/history`;
  const copy = getParentWorkspaceCopy(subjectConfig);

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
      .eq('audience', 'parent');

    savedConversationCount = count || 0;

    if (selectedConversationId) {
      const { data } = await supabase
        .from('learner_conversations')
        .select('id, title, audience, created_at, updated_at')
        .eq('id', selectedConversationId)
        .eq('user_id', user.id)
        .eq('subject', subjectConfig.key)
        .eq('audience', 'parent')
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
            audience="parent"
            lockedMode="hint"
            title={`Tutor Support for ${subjectConfig.name} Parents`}
            description={copy.tutorDescription}
            placeholder={copy.placeholder}
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
                {savedConversationCount} in your {subjectConfig.name.toLowerCase()} parent history.
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
            <a className="btn secondary" href={parentHistoryHref}>
              Open {subjectConfig.name} History
            </a>
            <a className="btn secondary" href={parentWorkspaceHref}>
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
              This parent session was not found for your account, or it belongs to another subject
              or workspace.
            </p>
            <div className="buttonRow">
              <a className="btn secondary" href={parentHistoryHref}>
                Open History
              </a>
              <a className="btn" href={parentWorkspaceHref}>
                Start New Session
              </a>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal delay={0.08}>
        <SubjectTutor
          subject={subjectConfig.key}
          audience="parent"
          lockedMode="hint"
          initialConversationId={selectedConversation?.id || null}
          newSessionHref={parentWorkspaceHref}
          title={`Tutor Support for ${subjectConfig.name} Parents`}
          description={copy.tutorDescription}
          placeholder={copy.placeholder}
        />
      </Reveal>

      {selectedConversation && turns.length > 0 ? (
        <Reveal delay={0.14}>
          <section className="card" style={{ display: 'grid', gap: 16 }}>
            <div className="buttonRow" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <h2 style={{ margin: 0 }}>Current Session Thread</h2>
                <p className="small" style={{ margin: 0 }}>
                  This parent session was opened from history. Continue the thread above or review
                  the full question-and-answer flow below.
                </p>
              </div>

              <DeleteConversationButton
                conversationId={selectedConversation.id}
                redirectHref={parentWorkspaceHref}
              />
            </div>

            <ConversationThread
              title={selectedConversation.title}
              audience={selectedConversation.audience}
              createdAt={selectedConversation.created_at}
              updatedAt={selectedConversation.updated_at}
              turns={turns}
              showDeleteTurnControls
              redirectHref={`${parentWorkspaceHref}?conversation=${selectedConversation.id}`}
              graphingEnabled={subjectConfig.features.graphing}
            />
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}