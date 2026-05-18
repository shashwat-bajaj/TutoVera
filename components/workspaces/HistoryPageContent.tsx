import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import DeleteConversationButton from '@/components/DeleteConversationButton';
import ConversationThread from '@/components/ConversationThread';
import Reveal from '@/components/Reveal';
import { getSubjectConfig, subjectKeys, type SubjectKey } from '@/lib/subjects';

type ConversationRecord = {
  id: string;
  title: string | null;
  audience: string;
  subject: string;
  created_at: string;
  updated_at: string;
};

type TurnPreviewRecord = {
  conversation_id: string;
  prompt: string;
  turn_index: number | null;
  created_at: string;
};

type TurnRecord = {
  id: string;
  conversation_id: string;
  turn_index: number | null;
  mode: string;
  level: string;
  prompt: string;
  response: string;
  created_at: string;
};

type HistoryPageContentProps = {
  searchParams: Promise<{ email?: string; conversation?: string }>;
  historyHref?: string;
  subject?: SubjectKey;
};

type ConversationGroup = {
  subject: string;
  subjectName: string;
  conversations: ConversationRecord[];
};

type AudienceKey = 'student' | 'parent' | 'other';

type AudienceGroup = {
  audience: AudienceKey;
  label: string;
  conversations: ConversationRecord[];
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function makePreview(text: string, max = 110) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > max ? `${cleaned.slice(0, max)}...` : cleaned;
}

function buildHistoryHref({
  historyHref,
  conversationId
}: {
  historyHref: string;
  conversationId: string;
}) {
  return `${historyHref}?conversation=${conversationId}`;
}

function getSubjectName(value: string) {
  const subjectConfig = getSubjectConfig(value);

  if (subjectConfig) {
    return subjectConfig.name;
  }

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown Subject';
}

function getAudienceKey(value: string): AudienceKey {
  if (value === 'parent') return 'parent';
  if (value === 'student') return 'student';
  return 'other';
}

function getAudienceLabel(value: string) {
  if (value === 'parent') return 'Parent';
  if (value === 'student') return 'Student';
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

function buildWorkspaceHref(conversation: ConversationRecord) {
  const subjectConfig = getSubjectConfig(conversation.subject);

  if (!subjectConfig) {
    return conversation.audience === 'parent'
      ? `/parents?conversation=${conversation.id}`
      : `/tutor?conversation=${conversation.id}`;
  }

  const workspacePath = conversation.audience === 'parent' ? 'parents' : 'tutor';

  return `${subjectConfig.path}/${workspacePath}?conversation=${conversation.id}`;
}

function getHistoryTitle(subject?: SubjectKey) {
  if (!subject) {
    return 'Revisit earlier sessions across every subject.';
  }

  const subjectConfig = getSubjectConfig(subject);
  const subjectName = subjectConfig?.name || 'this subject';

  return `Revisit earlier ${subjectName} sessions without losing the thread.`;
}

function getHistoryDescription({
  subject,
  userEmail
}: {
  subject?: SubjectKey;
  userEmail?: string | null;
}) {
  const subjectName = subject ? getSubjectName(subject).toLowerCase() : '';

  if (userEmail) {
    if (subject) {
      return (
        <>
          Signed in as <strong>{userEmail}</strong>. Your saved {subjectName} conversations are split
          into Student and Parent sessions so you can preview the thread or continue it in the
          correct workspace.
        </>
      );
    }

    return (
      <>
        Signed in as <strong>{userEmail}</strong>. Your saved conversations are grouped by subject,
        then split into Student and Parent sessions so you can return to the right TutoVera thread.
      </>
    );
  }

  if (subject) {
    return (
      <>
        History is private. Please log in to view your saved {subjectName} conversations and continue
        earlier Student or Parent sessions.
      </>
    );
  }

  return (
    <>
      History is private. Please log in to view your saved TutoVera conversations across Math,
      Physics, Chemistry, and Biology.
    </>
  );
}

function getEmptyMessage(subject?: SubjectKey) {
  if (!subject) {
    return 'No saved conversations were found in your account yet.';
  }

  const subjectConfig = getSubjectConfig(subject);
  const subjectName = subjectConfig?.name.toLowerCase() || subject;

  return `No saved ${subjectName} conversations were found in your account yet.`;
}

function buildConversationGroups(conversations: ConversationRecord[]): ConversationGroup[] {
  const grouped = new Map<string, ConversationRecord[]>();

  for (const conversation of conversations) {
    const key = conversation.subject || 'unknown';
    const existing = grouped.get(key) || [];
    existing.push(conversation);
    grouped.set(key, existing);
  }

  const knownGroups = subjectKeys.map((subjectKey) => ({
    subject: subjectKey,
    subjectName: getSubjectName(subjectKey),
    conversations: grouped.get(subjectKey) || []
  }));

  const unknownGroups = Array.from(grouped.keys())
    .filter((key) => !subjectKeys.includes(key as SubjectKey))
    .sort()
    .map((subjectKey) => ({
      subject: subjectKey,
      subjectName: getSubjectName(subjectKey),
      conversations: grouped.get(subjectKey) || []
    }));

  return [...knownGroups, ...unknownGroups];
}

function buildAudienceGroups(conversations: ConversationRecord[]): AudienceGroup[] {
  const studentConversations = conversations.filter(
    (conversation) => getAudienceKey(conversation.audience) === 'student'
  );
  const parentConversations = conversations.filter(
    (conversation) => getAudienceKey(conversation.audience) === 'parent'
  );
  const otherConversations = conversations.filter(
    (conversation) => getAudienceKey(conversation.audience) === 'other'
  );

  const groups: AudienceGroup[] = [
    {
      audience: 'student',
      label: 'Student Sessions',
      conversations: studentConversations
    },
    {
      audience: 'parent',
      label: 'Parent Sessions',
      conversations: parentConversations
    }
  ];

  if (otherConversations.length > 0) {
    groups.push({
      audience: 'other',
      label: 'Other Sessions',
      conversations: otherConversations
    });
  }

  return groups;
}

function getConversationFirstPrompt({
  conversation,
  firstPromptByConversation
}: {
  conversation: ConversationRecord;
  firstPromptByConversation: Record<string, string>;
}) {
  return firstPromptByConversation[conversation.id] || conversation.title || 'Untitled conversation';
}

function ConversationHistoryCard({
  conversation,
  firstPrompt,
  isActive,
  historyHref
}: {
  conversation: ConversationRecord;
  firstPrompt: string;
  isActive: boolean;
  historyHref: string;
}) {
  const viewHref = buildHistoryHref({
    historyHref,
    conversationId: conversation.id
  });

  const continueHref = buildWorkspaceHref(conversation);

  return (
    <div
      className={`sessionItem ${isActive ? 'active' : ''}`}
      style={{ display: 'grid', gap: 10 }}
    >
      <a href={viewHref}>
        <p className="small" style={{ margin: '0 0 6px' }}>
          <strong>{makePreview(firstPrompt)}</strong>
        </p>
        <p className="small" style={{ margin: 0 }}>
          {getSubjectName(conversation.subject)} • {getAudienceLabel(conversation.audience)} •
          Updated {formatDate(conversation.updated_at)}
        </p>
      </a>

      <div className="buttonRow" style={{ justifyContent: 'flex-start' }}>
        <a className="btn secondary" href={viewHref}>
          Preview Thread
        </a>

        <a className="btn" href={continueHref}>
          Continue in Workspace
        </a>

        <DeleteConversationButton conversationId={conversation.id} redirectHref={historyHref} compact />
      </div>
    </div>
  );
}

function AudienceHistoryDetails({
  audienceGroup,
  selectedConversation,
  firstPromptByConversation,
  historyHref
}: {
  audienceGroup: AudienceGroup;
  selectedConversation: ConversationRecord | null;
  firstPromptByConversation: Record<string, string>;
  historyHref: string;
}) {
  return (
    <details className="historyAudienceDetails">
      <summary className="historyAudienceSummary">
        <span className="historyAudienceSummaryMain">
          <strong>{audienceGroup.label}</strong>
          <span className="small">
            {audienceGroup.conversations.length}{' '}
            {audienceGroup.conversations.length === 1 ? 'session' : 'sessions'}
          </span>
        </span>
      </summary>

      <div className="historyAudiencePanel">
        {audienceGroup.conversations.length === 0 ? (
          <div className="card questionSurface" style={{ padding: 14 }}>
            <p className="small" style={{ margin: 0 }}>
              No {audienceGroup.label.toLowerCase()} yet.
            </p>
          </div>
        ) : (
          <div className="sessionList">
            {audienceGroup.conversations.map((conversation) => {
              const isActive = selectedConversation?.id === conversation.id;
              const firstPrompt = getConversationFirstPrompt({
                conversation,
                firstPromptByConversation
              });

              return (
                <ConversationHistoryCard
                  key={conversation.id}
                  conversation={conversation}
                  firstPrompt={firstPrompt}
                  isActive={isActive}
                  historyHref={historyHref}
                />
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}

export default async function HistoryPageContent({
  searchParams,
  historyHref = '/history',
  subject
}: HistoryPageContentProps) {
  const params = await searchParams;
  const selectedConversationId = (params.conversation || '').trim();

  const authClient = await createAuthClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  const supabase = user?.id ? createAdminSupabase() : null;

  let conversations: ConversationRecord[] = [];
  let turns: TurnRecord[] = [];
  let errorMessage = '';
  const firstPromptByConversation: Record<string, string> = {};

  if (user?.id && supabase) {
    let query = supabase
      .from('learner_conversations')
      .select('id, title, audience, subject, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(80);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      errorMessage = error.message;
    } else {
      conversations = (data || []) as ConversationRecord[];
    }
  }

  if (user?.id && supabase && !errorMessage && conversations.length > 0) {
    const conversationIds = conversations.map((conversation) => conversation.id);

    let query = supabase
      .from('learner_sessions')
      .select('conversation_id, prompt, turn_index, created_at')
      .in('conversation_id', conversationIds)
      .eq('turn_index', 1)
      .order('created_at', { ascending: true });

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: firstTurns, error: firstTurnsError } = await query;

    if (firstTurnsError) {
      errorMessage = firstTurnsError.message;
    } else {
      for (const turn of (firstTurns || []) as TurnPreviewRecord[]) {
        if (!firstPromptByConversation[turn.conversation_id]) {
          firstPromptByConversation[turn.conversation_id] = turn.prompt || '';
        }
      }
    }
  }

  const selectedConversation =
    user?.id && selectedConversationId
      ? conversations.find((conversation) => conversation.id === selectedConversationId) || null
      : null;

  if (user?.id && supabase && selectedConversation && !errorMessage) {
    let query = supabase
      .from('learner_sessions')
      .select('id, conversation_id, turn_index, mode, level, prompt, response, created_at')
      .eq('conversation_id', selectedConversation.id)
      .order('turn_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      errorMessage = error.message;
    } else {
      turns = (data || []) as TurnRecord[];
    }
  }

  const graphingEnabledForSelectedConversation = selectedConversation
    ? Boolean(getSubjectConfig(selectedConversation.subject)?.features.graphing)
    : false;

  const conversationGroups = buildConversationGroups(conversations);
  const subjectAudienceGroups = buildAudienceGroups(conversations);
  const isGlobalHistory = !subject;

  const selectedContinueHref = selectedConversation ? buildWorkspaceHref(selectedConversation) : '';

  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>{getHistoryTitle(subject)}</h1>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              {getHistoryDescription({
                subject,
                userEmail: user?.email || null
              })}
            </p>
          </div>
        </section>
      </Reveal>

      {!user ? (
        <Reveal delay={0.04}>
          <section className="card" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span className="badge">Private history</span>
              <h2 style={{ margin: 0 }}>Log in to view saved sessions.</h2>
              <p className="small" style={{ margin: 0, maxWidth: 780 }}>
                To protect student and parent privacy, TutoVera history is now available only after
                signing in. Saved conversations are matched to your authenticated account rather than
                searched by email address.
              </p>
            </div>

            <div className="buttonRow" style={{ justifyContent: 'flex-start' }}>
              <a className="btn" href="/login">
                Log in to View History
              </a>
            </div>
          </section>
        </Reveal>
      ) : errorMessage ? (
        <section className="card">
          <p className="small" style={{ margin: 0 }}>
            Error loading history: {errorMessage}
          </p>
        </section>
      ) : conversations.length === 0 ? (
        <section className="card">
          <p className="small" style={{ margin: 0 }}>
            {getEmptyMessage(subject)}
          </p>
        </section>
      ) : (
        <div className="historyLayoutWrap">
          <section
            className="historyLayout"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 430px) minmax(0, 1fr)',
              gap: 26,
              alignItems: 'start',
              width: '100%'
            }}
          >
            <aside
              className="card"
              style={{
                display: 'grid',
                gap: 16,
                width: '100%',
                minWidth: 0,
                alignSelf: 'start'
              }}
            >
              <div style={{ display: 'grid', gap: 6 }}>
                <h2 style={{ margin: 0 }}>
                  {isGlobalHistory ? 'Saved sessions by subject' : 'Saved sessions by workspace'}
                </h2>
                <p className="small" style={{ margin: 0 }}>
                  {conversations.length} saved{' '}
                  {conversations.length === 1 ? 'conversation' : 'conversations'} in your account.
                </p>
              </div>

              {isGlobalHistory ? (
                <div className="subjectHistoryAccordion">
                  {conversationGroups.map((group) => {
                    const audienceGroups = buildAudienceGroups(group.conversations);

                    return (
                      <details key={group.subject} className="subjectHistoryDetails">
                        <summary className="subjectHistorySummary">
                          <span className="subjectHistorySummaryMain">
                            <strong>{group.subjectName}</strong>
                            <span className="small">
                              {group.conversations.length}{' '}
                              {group.conversations.length === 1 ? 'session' : 'sessions'}
                            </span>
                          </span>
                        </summary>

                        <div className="subjectHistoryPanel">
                          {group.conversations.length === 0 ? (
                            <div className="card questionSurface" style={{ padding: 14 }}>
                              <p className="small" style={{ margin: 0 }}>
                                No saved {group.subjectName.toLowerCase()} sessions yet.
                              </p>
                            </div>
                          ) : (
                            <div className="historyAudienceStack">
                              {audienceGroups.map((audienceGroup) => (
                                <AudienceHistoryDetails
                                  key={audienceGroup.audience}
                                  audienceGroup={audienceGroup}
                                  selectedConversation={selectedConversation}
                                  firstPromptByConversation={firstPromptByConversation}
                                  historyHref={historyHref}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : (
                <div className="historyAudienceStack">
                  {subjectAudienceGroups.map((audienceGroup) => (
                    <AudienceHistoryDetails
                      key={audienceGroup.audience}
                      audienceGroup={audienceGroup}
                      selectedConversation={selectedConversation}
                      firstPromptByConversation={firstPromptByConversation}
                      historyHref={historyHref}
                    />
                  ))}
                </div>
              )}
            </aside>

            <main
              className="card"
              style={{
                display: 'grid',
                gap: 14,
                width: '100%',
                minWidth: 0,
                alignSelf: 'start'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 14,
                  alignItems: 'start'
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <h2 style={{ margin: 0 }}>
                    {selectedConversation
                      ? `${getSubjectName(selectedConversation.subject)} ${getAudienceLabel(
                          selectedConversation.audience
                        )} thread`
                      : 'Conversation thread'}
                  </h2>
                  <p className="small" style={{ margin: 0 }}>
                    {selectedConversation
                      ? 'Preview the full question-and-answer flow here, or continue the session in the correct workspace.'
                      : 'Select a saved session to preview the thread here.'}
                  </p>
                </div>

                {selectedConversation ? (
                  <div className="buttonRow" style={{ justifySelf: 'end' }}>
                    <a className="btn" href={selectedContinueHref}>
                      Continue in Workspace
                    </a>

                    <DeleteConversationButton
                      conversationId={selectedConversation.id}
                      redirectHref={historyHref}
                    />
                  </div>
                ) : null}
              </div>

              {selectedConversation ? (
                turns.length > 0 ? (
                  <ConversationThread
                    title={selectedConversation.title}
                    audience={selectedConversation.audience}
                    createdAt={selectedConversation.created_at}
                    updatedAt={selectedConversation.updated_at}
                    turns={turns}
                    showDeleteTurnControls
                    redirectHref={`${historyHref}?conversation=${selectedConversation.id}`}
                    graphingEnabled={graphingEnabledForSelectedConversation}
                  />
                ) : (
                  <p className="small" style={{ margin: 0 }}>
                    This conversation was found, but no saved turns were loaded.
                  </p>
                )
              ) : selectedConversationId ? (
                <p className="small" style={{ margin: 0 }}>
                  This selected conversation was not found in your account history.
                </p>
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  Choose a Student or Parent session from the left to preview it here. You can
                  continue sessions from the matching workspace.
                </p>
              )}
            </main>
          </section>
        </div>
      )}

      <style>
        {`
          .historyLayoutWrap {
            width: 100%;
          }

          .historyLayout {
            width: 100%;
          }

          .subjectHistoryAccordion {
            display: grid;
            gap: 10px;
          }

          .subjectHistoryDetails {
            border: 1px solid var(--border);
            border-radius: 18px;
            background: color-mix(in srgb, var(--surface-soft) 88%, transparent);
            overflow: hidden;
          }

          .subjectHistorySummary {
            cursor: pointer;
            list-style: none;
            padding: 13px 14px;
          }

          .subjectHistorySummary::-webkit-details-marker {
            display: none;
          }

          .subjectHistorySummary::after {
            content: '+';
            float: right;
            color: var(--text-soft);
            font-weight: 700;
            margin-top: 4px;
          }

          .subjectHistoryDetails[open] .subjectHistorySummary::after {
            content: '−';
          }

          .subjectHistorySummaryMain {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: space-between;
            padding-right: 18px;
          }

          .subjectHistoryPanel {
            display: grid;
            gap: 14px;
            padding: 0 14px 14px;
          }

          .historyAudienceStack {
            display: grid;
            gap: 12px;
          }

          .historyAudienceDetails {
            border: 1px solid var(--border);
            border-radius: 16px;
            background: color-mix(in srgb, var(--surface) 84%, transparent);
            overflow: hidden;
          }

          .historyAudienceSummary {
            cursor: pointer;
            list-style: none;
            padding: 12px 14px;
          }

          .historyAudienceSummary::-webkit-details-marker {
            display: none;
          }

          .historyAudienceSummary::after {
            content: '+';
            float: right;
            color: var(--text-soft);
            font-weight: 700;
            margin-top: -20px;
          }

          .historyAudienceDetails[open] .historyAudienceSummary::after {
            content: '−';
          }

          .historyAudienceSummaryMain {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding-right: 18px;
          }

          .historyAudiencePanel {
            display: grid;
            gap: 12px;
            padding: 0 14px 14px;
          }

          @media (max-width: 900px) {
            .historyLayout {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 760px) {
            .historyAudienceSummaryMain,
            .subjectHistorySummaryMain {
              align-items: flex-start;
              flex-direction: column;
            }
          }
        `}
      </style>
    </div>
  );
}