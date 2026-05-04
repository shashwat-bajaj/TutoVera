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
      title: 'Help a child understand math without just giving the answer.',
      description:
        'Describe what the child is learning, where they are stuck, and TutoVera will give parent-friendly guidance.'
    };
  }

  if (subject.key === 'physics') {
    return {
      badge: 'Physics parent workspace',
      title: 'Help a child understand physics more clearly.',
      description:
        'Use TutoVera for parent-friendly explanations, formulas, examples, units, and likely mistakes.'
    };
  }

  if (subject.key === 'chemistry') {
    return {
      badge: 'Chemistry parent workspace',
      title: 'Help a child work through chemistry with clearer guidance.',
      description:
        'Use TutoVera for parent-friendly reaction explanations, conversions, balancing, and practice support.'
    };
  }

  if (subject.key === 'biology') {
    return {
      badge: 'Biology parent workspace',
      title: 'Help a child connect biology ideas more clearly.',
      description:
        'Use TutoVera for parent-friendly vocabulary support, process comparisons, systems, and review prompts.'
    };
  }

  return {
    badge: `${subject.name} parent workspace`,
    title: `Help a child understand ${subject.name.toLowerCase()} more clearly.`,
    description: `Use TutoVera for parent-friendly ${subject.name.toLowerCase()} explanations, examples, and practice guidance.`
  };
}

function getParentPlaceholder(subject: SubjectConfig) {
  if (subject.key === 'math') {
    return 'Example: My child is learning long division and gets confused after the first subtraction step. How can I explain it clearly?';
  }

  if (subject.key === 'physics') {
    return "Example: My child is learning Newton's second law and keeps mixing up force, mass, and acceleration. How can I explain it clearly?";
  }

  if (subject.key === 'chemistry') {
    return 'Example: My child is learning chemical equation balancing and keeps changing only one side. How can I explain it clearly?';
  }

  if (subject.key === 'biology') {
    return 'Example: My child is learning mitosis and meiosis and keeps mixing them up. How can I explain the difference clearly?';
  }

  return `Example: My child is learning a ${subject.name.toLowerCase()} topic and feels stuck. How can I explain it clearly?`;
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

  return (
    <div className="grid" style={{ gap: 18 }}>
      <Reveal delay={0.02}>
        <section style={{ display: 'grid', gap: 10, maxWidth: 880 }}>
          <span className="badge">{copy.badge}</span>
          <h1 style={{ margin: 0 }}>{copy.title}</h1>
          <p className="small" style={{ margin: 0, maxWidth: 780 }}>
            {copy.description}
            {user?.email ? (
              <>
                {' '}
                Signed in as <strong>{user.email}</strong>.
              </>
            ) : (
              ' Sign in to save and continue your parent sessions later.'
            )}
          </p>

          {user ? (
            <div className="buttonRow" style={{ marginTop: 4 }}>
              <a className="btn secondary" href={parentHistoryHref}>
                Open {subjectConfig.name} History
              </a>
              <a className="btn secondary" href={parentWorkspaceHref}>
                New Session
              </a>
              <span className="small" style={{ alignSelf: 'center' }}>
                {savedConversationCount} saved parent{' '}
                {savedConversationCount === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          ) : (
            <div className="buttonRow" style={{ marginTop: 4 }}>
              <a className="btn secondary" href="/login">
                Log in to Save History
              </a>
            </div>
          )}
        </section>
      </Reveal>

      {selectedConversationId && user && !selectedConversation ? (
        <Reveal delay={0.04}>
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

      <Reveal delay={0.06}>
        <SubjectTutor
          subject={subjectConfig.key}
          audience="parent"
          lockedMode="hint"
          initialConversationId={selectedConversation?.id || null}
          newSessionHref={parentWorkspaceHref}
          placeholder={getParentPlaceholder(subjectConfig)}
        />
      </Reveal>

      {selectedConversation && turns.length > 0 ? (
        <Reveal delay={0.12}>
          <section className="card" style={{ display: 'grid', gap: 16 }}>
            <div className="buttonRow" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <h2 style={{ margin: 0 }}>Current parent session thread</h2>
                <p className="small" style={{ margin: 0 }}>
                  This session was opened from history. Continue above or review the earlier thread
                  below.
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