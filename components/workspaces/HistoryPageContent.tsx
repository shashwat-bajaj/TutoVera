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
  historyMode,
  fallbackEmail,
  conversationId
}: {
  historyHref: string;
  historyMode: 'account' | 'email' | 'none';
  fallbackEmail: string;
  conversationId: string;
}) {
  if (historyMode === 'account') {
    return `${historyHref}?conversation=${conversationId}`;
  }

  return `${historyHref}?email=${encodeURIComponent(fallbackEmail)}&conversation=${conversationId}`;
}

function getSubjectName(value: string) {
  const subjectConfig = getSubjectConfig(value);

  if (subjectConfig) {
    return subjectConfig.name;
  }

  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown Subject';
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
          Signed in as <strong>{userEmail}</strong>. These are your private account-linked{' '}
          {subjectName} conversations, saved so you can return to earlier work and continue
          naturally.
        </>
      );
    }

    return (
      <>
        Signed in as <strong>{userEmail}</strong>. Your saved conversations are grouped by subject so
        you can quickly find the right TutoVera thread and continue naturally.
      </>
    );
  }

  if (subject) {
    return (
      <>
        You are not signed in yet. You can still use the legacy beta email lookup below for older{' '}
        {subjectName} conversations, but account-linked history is now the preferred way to keep
        sessions private and easier to manage.
      </>
    );
  }

  return (
    <>
      You are not signed in yet. You can still use the legacy beta email lookup below for older
      conversations, but account-linked history is now the preferred way to keep sessions private and
      easier to manage.
    </>
  );
}

function getEmptyMessage(subject?: SubjectKey) {
  if (!subject) {
    return 'No saved conversations were found for this history view.';
  }

  const subjectConfig = getSubjectConfig(subject);
  const subjectName = subjectConfig?.name.toLowerCase() || subject;

  return `No saved ${subjectName} conversations were found for this history view.`;
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

function getAudienceLabel(value: string) {
  if (value === 'parent') return 'Parent';
  if (value === 'student') return 'Student';
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

export default async function HistoryPageContent({
  searchParams,
  historyHref = '/history',
  subject
}: HistoryPageContentProps) {
  const params = await searchParams;
  const fallbackEmail = (params.email || '').trim().toLowerCase();
  const selectedConversationId = (params.conversation || '').trim();

  const authClient = await createAuthClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  const supabase = createAdminSupabase();

  let conversations: ConversationRecord[] = [];
  let turns: TurnRecord[] = [];
  let errorMessage = '';
  let historyMode: 'account' | 'email' | 'none' = 'none';
  const firstPromptByConversation: Record<string, string> = {};

  if (user?.id) {
    historyMode = 'account';

    let query = supabase
      .from('learner_conversations')
      .select('id, title, audience, subject, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(40);

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;

    if (error) {
      errorMessage = error.message;
    } else {
      conversations = (data || []) as ConversationRecord[];
    }
  } else if (fallbackEmail) {
    historyMode = 'email';

    let query = supabase
      .from('learner_conversations')
      .select('id, title, audience, subject, created_at, updated_at')
      .eq('email', fallbackEmail)
      .order('updated_at', { ascending: false })
      .limit(40);

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

  if (!errorMessage && conversations.length > 0) {
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
    conversations.find((conversation) => conversation.id === selectedConversationId) ||
    conversations[0] ||
    null;

  if (selectedConversation && !errorMessage) {
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
  const isGlobalHistory = !subject;

  const defaultOpenSubject =
    selectedConversationId && selectedConversation ? selectedConversation.subject : '';

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
          <section className="card" style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <h2 style={{ margin: 0 }}>Load older beta history</h2>
              <p className="small" style={{ margin: 0 }}>
                Use the email lookup only for earlier beta conversations that were not attached to an
                account yet.
              </p>
            </div>

            <form
              method="GET"
              className="historyLookupForm"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 420px) auto',
                gap: 12,
                alignItems: 'end',
                justifyContent: 'start',
                maxWidth: 820
              }}
            >
              <div style={{ minWidth: 0 }}>
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={fallbackEmail}
                  placeholder="you@example.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div
                className="buttonRow"
                style={{
                  flexWrap: 'nowrap',
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }}
              >
                <button type="submit" style={{ whiteSpace: 'nowrap' }}>
                  Load legacy email history
                </button>
                <a className="btn secondary" href="/login" style={{ whiteSpace: 'nowrap' }}>
                  Log in instead
                </a>
              </div>
            </form>
          </section>
        </Reveal>
      ) : null}

      {historyMode === 'none' ? (
        <section className="card">
          <p className="small" style={{ margin: 0 }}>
            Sign in to view private history, or use the email lookup form for older beta
            conversations.
          </p>
        </section>
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
              gridTemplateColumns: 'minmax(300px, 380px) minmax(0, 1fr)',
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
                  {isGlobalHistory ? 'Saved conversations by subject' : 'Saved conversations'}
                </h2>
                <p className="small" style={{ margin: 0 }}>
                  {conversations.length} saved{' '}
                  {conversations.length === 1 ? 'conversation' : 'conversations'}
                  {historyMode === 'account' ? ' in your account.' : ' found from email lookup.'}
                </p>
              </div>

              {isGlobalHistory ? (
                <div className="subjectHistoryAccordion">
                  {conversationGroups.map((group) => (
                    <details
                      key={group.subject}
                      className="subjectHistoryDetails"
                      open={group.subject === defaultOpenSubject}
                    >
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
                          <div className="sessionList">
                            {group.conversations.map((conversation) => {
                              const isActive = selectedConversation?.id === conversation.id;
                              const firstPrompt =
                                firstPromptByConversation[conversation.id] ||
                                conversation.title ||
                                'Untitled conversation';

                              const href = buildHistoryHref({
                                historyHref,
                                historyMode,
                                fallbackEmail,
                                conversationId: conversation.id
                              });

                              return (
                                <div
                                  key={conversation.id}
                                  className={`sessionItem ${isActive ? 'active' : ''}`}
                                  style={{ display: 'grid', gap: 8 }}
                                >
                                  <a href={href}>
                                    <p className="small" style={{ margin: '0 0 6px' }}>
                                      <strong>{makePreview(firstPrompt)}</strong>
                                    </p>
                                    <p className="small" style={{ margin: 0 }}>
                                      {getAudienceLabel(conversation.audience)} • Updated{' '}
                                      {formatDate(conversation.updated_at)}
                                    </p>
                                  </a>

                                  {historyMode === 'account' ? (
                                    <div
                                      className="buttonRow"
                                      style={{ justifyContent: 'flex-start' }}
                                    >
                                      <DeleteConversationButton
                                        conversationId={conversation.id}
                                        redirectHref={historyHref}
                                        compact
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="sessionList">
                  {conversations.map((conversation) => {
                    const isActive = selectedConversation?.id === conversation.id;
                    const firstPrompt =
                      firstPromptByConversation[conversation.id] ||
                      conversation.title ||
                      'Untitled conversation';

                    const href = buildHistoryHref({
                      historyHref,
                      historyMode,
                      fallbackEmail,
                      conversationId: conversation.id
                    });

                    return (
                      <div
                        key={conversation.id}
                        className={`sessionItem ${isActive ? 'active' : ''}`}
                        style={{ display: 'grid', gap: 8 }}
                      >
                        <a href={href}>
                          <p className="small" style={{ margin: '0 0 6px' }}>
                            <strong>{makePreview(firstPrompt)}</strong>
                          </p>
                          <p className="small" style={{ margin: 0 }}>
                            {getAudienceLabel(conversation.audience)} • Updated{' '}
                            {formatDate(conversation.updated_at)}
                          </p>
                        </a>

                        {historyMode === 'account' ? (
                          <div className="buttonRow" style={{ justifyContent: 'flex-start' }}>
                            <DeleteConversationButton
                              conversationId={conversation.id}
                              redirectHref={historyHref}
                              compact
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
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
                      ? `${getSubjectName(selectedConversation.subject)} conversation thread`
                      : 'Conversation thread'}
                  </h2>
                  <p className="small" style={{ margin: 0 }}>
                    View the full question-and-answer flow for the selected session.
                  </p>
                </div>

                {historyMode === 'account' && selectedConversation ? (
                  <div style={{ justifySelf: 'end' }}>
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
                    showDeleteTurnControls={historyMode === 'account'}
                    redirectHref={
                      historyMode === 'account'
                        ? `${historyHref}?conversation=${selectedConversation.id}`
                        : undefined
                    }
                    graphingEnabled={graphingEnabledForSelectedConversation}
                  />
                ) : (
                  <p className="small" style={{ margin: 0 }}>
                    This conversation was found, but no saved turns were loaded.
                  </p>
                )
              ) : (
                <p className="small" style={{ margin: 0 }}>
                  Select a conversation to view it.
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
            gap: 12px;
            padding: 0 14px 14px;
          }

          @media (max-width: 760px) {
            .historyLayout {
              grid-template-columns: 1fr !important;
            }

            .historyLookupForm {
              grid-template-columns: 1fr !important;
              max-width: 100% !important;
            }

            .historyLookupForm .buttonRow {
              flex-wrap: wrap !important;
            }
          }
        `}
      </style>
    </div>
  );
}