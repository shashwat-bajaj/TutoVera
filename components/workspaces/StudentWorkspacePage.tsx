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

function getStudentWorkspaceCopy(subject: SubjectConfig) {
  if (subject.key === 'math') {
    return {
      badge: 'Student workspace',
      title: 'Ask a math question and keep the thread going.',
      description:
        'Use TutoVera for solving, graphing, checking mistakes, practicing, or understanding a concept step by step.'
    };
  }

  if (subject.key === 'physics') {
    return {
      badge: 'Physics workspace',
      title: 'Ask a physics question and build from there.',
      description:
        'Use TutoVera for concepts, formulas, units, word problems, and guided physics explanations.'
    };
  }

  if (subject.key === 'chemistry') {
    return {
      badge: 'Chemistry workspace',
      title: 'Ask a chemistry question and work through it clearly.',
      description:
        'Use TutoVera for reactions, formulas, stoichiometry, conversions, and chemistry reasoning.'
    };
  }

  if (subject.key === 'biology') {
    return {
      badge: 'Biology workspace',
      title: 'Ask a biology question and connect the ideas.',
      description:
        'Use TutoVera for vocabulary, processes, systems, comparisons, review, and practice questions.'
    };
  }

  return {
    badge: `${subject.name} workspace`,
    title: `Ask a ${subject.name.toLowerCase()} question and keep learning.`,
    description: `Use TutoVera for guided ${subject.name.toLowerCase()} explanations, practice, and follow-up questions.`
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
  const copy = getStudentWorkspaceCopy(subjectConfig);

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
              ' Sign in to save and continue your sessions later.'
            )}
          </p>

          {user ? (
            <div className="buttonRow" style={{ marginTop: 4 }}>
              <a className="btn secondary" href={studentHistoryHref}>
                Open {subjectConfig.name} History
              </a>
              <a className="btn secondary" href={studentWorkspaceHref}>
                New Session
              </a>
              <span className="small" style={{ alignSelf: 'center' }}>
                {savedConversationCount} saved student{' '}
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

      <Reveal delay={0.06}>
        <SubjectTutor
          subject={subjectConfig.key}
          audience="student"
          initialConversationId={selectedConversation?.id || null}
          newSessionHref={studentWorkspaceHref}
        />
      </Reveal>

      {selectedConversation && turns.length > 0 ? (
        <Reveal delay={0.12}>
          <section className="card" style={{ display: 'grid', gap: 16 }}>
            <div className="buttonRow" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <h2 style={{ margin: 0 }}>Current session thread</h2>
                <p className="small" style={{ margin: 0 }}>
                  This session was opened from history. Continue above or review the earlier thread
                  below.
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