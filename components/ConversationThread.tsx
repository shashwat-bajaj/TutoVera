import AnswerDisplay from '@/components/AnswerDisplay';
import DeleteTurnButton from '@/components/DeleteTurnButton';
import FunctionGraph from '@/components/FunctionGraph';
import ProRevisionReviewPanel from '@/components/ProRevisionReviewPanel';
import {
  extractRememberedGraphExpression,
  isGraphReferenceRequest
} from '@/lib/graphing';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatAudienceLabel(value: string) {
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatModeLabel(value: string) {
  switch (value) {
    case 'auto':
      return 'Auto';
    case 'teach':
      return 'Teach';
    case 'hint':
      return 'Hint';
    case 'diagnose':
      return 'Diagnose';
    case 'quiz':
      return 'Quiz';
    default:
      return value;
  }
}

function formatTurnLabel(index: number) {
  return index === 0 ? 'Initial Question' : `Follow-up ${index}`;
}

function getConversationIdFromRedirectHref(redirectHref?: string) {
  if (!redirectHref || !redirectHref.includes('?')) return '';

  try {
    const query = redirectHref.split('?')[1] || '';
    const params = new URLSearchParams(query);
    return params.get('conversation') || '';
  } catch {
    return '';
  }
}

export default function ConversationThread({
  title,
  audience,
  createdAt,
  updatedAt,
  turns,
  showDeleteTurnControls = false,
  redirectHref,
  graphingEnabled = false
}: {
  title: string | null;
  audience: string;
  createdAt: string;
  updatedAt: string;
  turns: Array<{
    id: string;
    conversation_id?: string | null;
    turn_index: number | null;
    mode: string;
    level: string;
    prompt: string;
    response: string;
    created_at: string;
  }>;
  showDeleteTurnControls?: boolean;
  redirectHref?: string;
  graphingEnabled?: boolean;
}) {
  let lastKnownGraphExpression = '';

  const conversationIdForRevision =
    turns.find((turn) => turn.conversation_id)?.conversation_id ||
    getConversationIdFromRedirectHref(redirectHref);

  return (
    <div className="grid" style={{ gap: 22 }}>
      <section
        style={{
          display: 'grid',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'grid', gap: 8, maxWidth: 820 }}>
          <h3 style={{ margin: 0 }}>{title || 'Untitled conversation'}</h3>
          <p className="small" style={{ margin: 0 }}>
            Full session thread with saved questions, tutor responses, and graph context where
            relevant.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 18
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Audience</strong>
            </p>
            <p style={{ margin: 0 }}>{formatAudienceLabel(audience)}</p>
          </div>

          <div style={{ display: 'grid', gap: 4 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Started</strong>
            </p>
            <p style={{ margin: 0 }}>{formatDate(createdAt)}</p>
          </div>

          <div style={{ display: 'grid', gap: 4 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Last updated</strong>
            </p>
            <p style={{ margin: 0 }}>{formatDate(updatedAt)}</p>
          </div>
        </div>

        {conversationIdForRevision ? (
          <ProRevisionReviewPanel conversationId={conversationIdForRevision} />
        ) : null}
      </section>

      <div className="threadTurns" style={{ gap: 22 }}>
        {turns.map((turn, index) => {
          const canRenderGraph = graphingEnabled && audience === 'student';

          const rememberedCandidate = canRenderGraph
            ? extractRememberedGraphExpression(turn.prompt)
            : '';

          if (rememberedCandidate) {
            lastKnownGraphExpression = rememberedCandidate;
          }

          const requestedGraphContext =
            canRenderGraph && isGraphReferenceRequest(turn.prompt);

          const graphExpression =
            canRenderGraph && requestedGraphContext
              ? rememberedCandidate || lastKnownGraphExpression
              : '';

          return (
            <section
              key={turn.id}
              className="card turnCard"
              style={{
                display: 'grid',
                gap: 16,
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div
                  className="turnLabelRow"
                  style={{
                    marginBottom: 0,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'grid', gap: 8 }}>
                    <span className="turnLabel">{formatTurnLabel(index)}</span>
                    <p className="small" style={{ margin: 0 }}>
                      {formatModeLabel(turn.mode)} • {turn.level} • {formatDate(turn.created_at)}
                    </p>
                  </div>

                  {showDeleteTurnControls && index > 0 && redirectHref ? (
                    <DeleteTurnButton turnId={turn.id} redirectHref={redirectHref} />
                  ) : null}
                </div>
              </div>

              <div className="grid" style={{ gap: 16 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Question</h3>
                  <div
                    className="questionSurface"
                    style={{
                      padding: 16,
                      borderRadius: 20,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="question-block">{turn.prompt}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Answer</h3>
                  <div
                    className="answerSurface"
                    style={{
                      padding: 16,
                      borderRadius: 20,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <AnswerDisplay text={turn.response} />
                  </div>
                </div>

                {graphExpression ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Graph</h3>
                    <FunctionGraph expression={graphExpression} />
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}