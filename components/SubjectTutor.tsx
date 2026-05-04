'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnswerDisplay from '@/components/AnswerDisplay';
import FunctionGraph from '@/components/FunctionGraph';
import PaidImageUploadPlaceholder from '@/components/PaidImageUploadPlaceholder';
import { createClient } from '@/lib/supabase/client';
import { getSubjectConfig, subjects, type SubjectConfig, type SubjectKey } from '@/lib/subjects';
import {
  extractRememberedGraphExpression,
  isGraphOnlyDisplayRequest,
  isGraphReferenceRequest
} from '@/lib/graphing';

type SubjectTutorProps = {
  subject?: SubjectKey;
  audience?: 'student' | 'parent';
  lockedMode?: 'auto' | 'teach' | 'hint' | 'diagnose' | 'quiz';
  title?: string;
  description?: string;
  placeholder?: string;
  initialConversationId?: string | null;
  newSessionHref?: string;
};

type GradeLevel = 'elementary' | 'middle-school' | 'high-school' | 'college';
type TutorMode = 'auto' | 'teach' | 'hint' | 'diagnose' | 'quiz';
type ParentHelpStyle =
  | 'explain-simply'
  | 'talking-points'
  | 'simple-example'
  | 'practice-questions'
  | 'likely-mistake';

type TutorRequestPayload = {
  subject: SubjectKey;
  question: string;
  gradeLevel: GradeLevel;
  mode: TutorMode;
  email: string;
  audience: 'student' | 'parent';
  conversationId: string | null;
  parentHelpStyle: ParentHelpStyle | null;
  topic: string;
  stuckPoint: string;
  graphOnlyBypass?: boolean;
  graphExpression?: string | null;
};

function ReadOnlyField({ value }: { value: string }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        background: 'var(--input-bg)',
        color: 'var(--text)',
        minHeight: 50,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {value}
    </div>
  );
}

function SectionTitle({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {description ? (
        <p className="small" style={{ margin: 0 }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function isRetryableTutorMessage(message: string) {
  return /busy now|temporarily busy|too many requests|try again later|try again shortly/i.test(
    message
  );
}

function isErrorLikeMessage(message: string) {
  return /failed|error|went wrong|try again/i.test(message);
}

function getDefaultQuestion({
  audience,
  subject
}: {
  audience: 'student' | 'parent';
  subject: SubjectConfig;
}) {
  if (audience === 'parent') {
    if (subject.key === 'math') {
      return 'My child is learning fractions. How can I explain why 1/2 is larger than 1/4 without just giving the answer?';
    }

    return `My child is learning ${subject.name.toLowerCase()}. How can I explain the topic clearly without just giving them the answer?`;
  }

  if (subject.key === 'math') {
    return 'Solve x^2 - 5x + 6 = 0 and explain each step.';
  }

  return subject.tutor.examplePrompts[0] || `Help me understand a ${subject.name} topic.`;
}

function getQuestionPlaceholder({
  audience,
  subject,
  customPlaceholder
}: {
  audience: 'student' | 'parent';
  subject: SubjectConfig;
  customPlaceholder?: string;
}) {
  if (customPlaceholder) {
    return customPlaceholder;
  }

  if (audience === 'parent') {
    return `Describe what the child is learning in ${subject.name.toLowerCase()}, where they are stuck, and how much help you want.`;
  }

  if (subject.key === 'math') {
    return 'Type a math problem, paste your work, or ask for a quiz on a topic. Ask explicitly to graph or plot if you want a graph shown.';
  }

  return subject.tutor.placeholder;
}

function getFollowUpSuggestions(args: {
  audience: 'student' | 'parent';
  mode: TutorMode;
  subject: SubjectConfig;
  showGraphForCurrentTurn: boolean;
  activeGraphExpression: string;
}) {
  const { audience, mode, subject, showGraphForCurrentTurn, activeGraphExpression } = args;

  if (audience === 'parent') {
    return [
      'Say it like I am explaining it to a child.',
      'Give me parent talking points.',
      'Show one simpler example.',
      'Give me one short practice prompt.'
    ];
  }

  if (subject.features.graphing && showGraphForCurrentTurn && activeGraphExpression) {
    return [
      'Explain the graph please.',
      'What are the x-intercepts?',
      'What is the vertex?',
      'Give me one practice question based on this graph.'
    ];
  }

  if (mode === 'quiz') {
    return [
      'Give me one hint for question 1.',
      'Make the questions a bit harder.',
      'Check my answers after I try.',
      'Create 3 new practice questions.'
    ];
  }

  if (mode === 'diagnose') {
    return [
      'Show the corrected steps.',
      'Explain the mistake more simply.',
      'Give me a similar problem.',
      'What should I practice next?'
    ];
  }

  if (mode === 'hint') {
    return [
      'Give me just one more hint.',
      'Show the next step only.',
      'What is a common mistake here?',
      'Now explain the full solution.'
    ];
  }

  if (subject.key !== 'math') {
    return [
      'Explain that more simply.',
      'Give me one hint only.',
      'Show a common mistake.',
      `Turn this into ${subject.name.toLowerCase()} practice questions.`
    ];
  }

  return [
    'Explain that more simply.',
    'Give me one hint only.',
    'Show a common mistake.',
    'Turn this into practice questions.'
  ];
}

export default function SubjectTutor({
  subject = 'math',
  audience = 'student',
  lockedMode,
  title,
  description,
  placeholder,
  initialConversationId = null,
  newSessionHref
}: SubjectTutorProps) {
  const router = useRouter();
  const questionRef = useRef<HTMLTextAreaElement | null>(null);

  const subjectConfig = useMemo(() => getSubjectConfig(subject) || subjects.math, [subject]);
  const graphingEnabled = subjectConfig.features.graphing;

  const [email, setEmail] = useState('');
  const [accountEmail, setAccountEmail] = useState('');

  const defaultQuestion = useMemo(
    () => getDefaultQuestion({ audience, subject: subjectConfig }),
    [audience, subjectConfig]
  );

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [question, setQuestion] = useState(initialConversationId ? '' : defaultQuestion);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(
    audience === 'parent' ? 'elementary' : 'high-school'
  );
  const [mode, setMode] = useState<TutorMode>(lockedMode || 'auto');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeGraphExpression, setActiveGraphExpression] = useState('');
  const [rememberedGraphExpression, setRememberedGraphExpression] = useState('');
  const [showGraphForCurrentTurn, setShowGraphForCurrentTurn] = useState(false);
  const [lastRequestPayload, setLastRequestPayload] = useState<TutorRequestPayload | null>(null);

  const [parentHelpStyle, setParentHelpStyle] =
    useState<ParentHelpStyle>('explain-simply');
  const [parentTopic, setParentTopic] = useState('');
  const [parentStuckPoint, setParentStuckPoint] = useState('');

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user?.email) {
        setAccountEmail(user.email);
      }

      const preferences = user?.user_metadata?.preferences || {};

      if (audience === 'student') {
        const nextStudentGrade =
          preferences.studentDefaults?.gradeLevel || 'high-school';
        setGradeLevel(nextStudentGrade);

        if (!lockedMode) {
          const nextStudentMode =
            preferences.studentDefaults?.tutorMode || 'auto';
          setMode(nextStudentMode);
        }
      }

      if (audience === 'parent') {
        const nextParentGrade =
          preferences.parentDefaults?.gradeLevel || 'elementary';
        setGradeLevel(nextParentGrade);
      }
    }

    void loadUser();
  }, [audience, lockedMode]);

  useEffect(() => {
    setConversationId(initialConversationId);
    setAnswer('');
    setQuestion(initialConversationId ? '' : defaultQuestion);
    setActiveGraphExpression('');
    setRememberedGraphExpression('');
    setShowGraphForCurrentTurn(false);
    setLastRequestPayload(null);

    if (!initialConversationId) {
      setParentTopic('');
      setParentStuckPoint('');
      setParentHelpStyle('explain-simply');
    }
  }, [initialConversationId, defaultQuestion]);

  function startNewSession() {
    if (newSessionHref) {
      router.push(newSessionHref);
      router.refresh();
      return;
    }

    setConversationId(null);
    setAnswer('');
    setQuestion(defaultQuestion);
    setParentTopic('');
    setParentStuckPoint('');
    setParentHelpStyle('explain-simply');
    setActiveGraphExpression('');
    setRememberedGraphExpression('');
    setShowGraphForCurrentTurn(false);
    setLastRequestPayload(null);
  }

  function buildPayload(overridePayload?: TutorRequestPayload): TutorRequestPayload | null {
    if (overridePayload) {
      return overridePayload;
    }

    const questionText = question.trim();
    if (!questionText) return null;

    return {
      subject: subjectConfig.key,
      question: questionText,
      gradeLevel,
      mode,
      email: accountEmail ? '' : email,
      audience,
      conversationId,
      parentHelpStyle: audience === 'parent' ? parentHelpStyle : null,
      topic: audience === 'parent' ? parentTopic : '',
      stuckPoint: audience === 'parent' ? parentStuckPoint : ''
    };
  }

  async function submitQuestion(overridePayload?: TutorRequestPayload) {
    const basePayload = buildPayload(overridePayload);
    if (!basePayload || loading) return;

    const requestedGraphContext =
      graphingEnabled &&
      basePayload.audience === 'student' &&
      isGraphReferenceRequest(basePayload.question);

    const graphOnlyDisplayRequest =
      graphingEnabled &&
      basePayload.audience === 'student' &&
      isGraphOnlyDisplayRequest(basePayload.question);

    const rememberedCandidate =
      graphingEnabled && basePayload.audience === 'student'
        ? extractRememberedGraphExpression(basePayload.question)
        : '';

    const nextRememberedExpression = rememberedCandidate || rememberedGraphExpression;

    const payload: TutorRequestPayload =
      graphOnlyDisplayRequest && nextRememberedExpression
        ? {
            ...basePayload,
            graphOnlyBypass: true,
            graphExpression: nextRememberedExpression
          }
        : basePayload;

    setLoading(true);
    setAnswer('');
    setLastRequestPayload(payload);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer(data.error || 'Something went wrong while contacting the tutor API.');
        setShowGraphForCurrentTurn(false);
        return;
      }

      setAnswer(data.answer || 'No response returned.');

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      if (graphingEnabled && basePayload.audience === 'student') {
        if (rememberedCandidate) {
          setRememberedGraphExpression(rememberedCandidate);
        }

        if (requestedGraphContext) {
          const nextGraphExpression = nextRememberedExpression || activeGraphExpression;
          setActiveGraphExpression(nextGraphExpression);
          setShowGraphForCurrentTurn(Boolean(nextGraphExpression));
        } else {
          setShowGraphForCurrentTurn(false);
        }
      } else {
        setShowGraphForCurrentTurn(false);
      }

      if (!overridePayload || question.trim() === basePayload.question.trim()) {
        setQuestion('');
      }
    } catch {
      setAnswer('Something went wrong while contacting the tutor API.');
      setShowGraphForCurrentTurn(false);
    } finally {
      setLoading(false);
    }
  }

  function retryLastRequest() {
    if (!lastRequestPayload || loading) return;
    void submitQuestion(lastRequestPayload);
  }

  function applySuggestionChip(suggestion: string) {
    setQuestion(suggestion);
    questionRef.current?.focus();
    questionRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void submitQuestion();
    }
  }

  const splitFieldStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16
  } as const;

  const showRetryButton =
    !loading && !!answer && isRetryableTutorMessage(answer) && !!lastRequestPayload;

  const showFollowUpSuggestions =
    !loading &&
    !!answer &&
    !showRetryButton &&
    !isErrorLikeMessage(answer);

  const followUpSuggestions = getFollowUpSuggestions({
    audience,
    mode,
    subject: subjectConfig,
    showGraphForCurrentTurn,
    activeGraphExpression
  });

  const questionPlaceholder = getQuestionPlaceholder({
    audience,
    subject: subjectConfig,
    customPlaceholder: placeholder
  });

  return (
    <div className="grid" style={{ gap: 22 }}>
      {(title || description) && (
        <section
          style={{
            display: 'grid',
            gap: 8,
            maxWidth: 860
          }}
        >
          {title ? <h2 style={{ margin: 0 }}>{title}</h2> : null}
          {description ? (
            <p className="small" style={{ margin: 0, maxWidth: 820 }}>
              {description}
            </p>
          ) : null}
        </section>
      )}

      <section className="card" style={{ display: 'grid', gap: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 18,
            alignItems: 'start'
          }}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            {accountEmail ? (
              <p className="small" style={{ margin: 0 }}>
                Signed in as <strong>{accountEmail}</strong>. Session history will be saved to your
                account automatically.
              </p>
            ) : (
              <div style={{ maxWidth: 420 }}>
                <label>Email (optional for history and usage tracking)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}

            <p className="small" style={{ margin: 0 }}>
              {conversationId
                ? 'You are continuing an existing session.'
                : 'Your next message will start a new session.'}
            </p>
          </div>

          <div className="buttonRow" style={{ justifyContent: 'flex-end' }}>
            <button className="secondary" onClick={startNewSession}>
              New Session
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 18,
            paddingTop: 18,
            borderTop: '1px solid var(--border)'
          }}
        >
          <SectionTitle
            title="Current setup"
            description="Adjust the help style before sending the next message."
          />

          {audience === 'parent' ? (
            <>
              <div style={splitFieldStyle}>
                <div>
                  <label>Mode</label>
                  <ReadOnlyField value="Guided hints only" />
                </div>

                <div>
                  <label>Level</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  >
                    <option value="elementary">Elementary</option>
                    <option value="middle-school">Middle school</option>
                    <option value="high-school">High school</option>
                    <option value="college">College</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  paddingTop: 6,
                  borderTop: '1px solid var(--border)'
                }}
              >
                <SectionTitle
                  title="Parent support options"
                  description="Shape the response around how you want to help the child learn."
                />

                <div>
                  <label>Support style</label>
                  <select
                    value={parentHelpStyle}
                    onChange={(e) => setParentHelpStyle(e.target.value as ParentHelpStyle)}
                  >
                    <option value="explain-simply">Explain it simply</option>
                    <option value="talking-points">Give me parent talking points</option>
                    <option value="simple-example">Show a simple example</option>
                    <option value="practice-questions">Create practice questions</option>
                    <option value="likely-mistake">What mistake is my child likely making?</option>
                  </select>
                </div>

                <div style={splitFieldStyle}>
                  <div>
                    <label>Topic (optional)</label>
                    <input
                      type="text"
                      value={parentTopic}
                      onChange={(e) => setParentTopic(e.target.value)}
                      placeholder={`Example: ${subjectConfig.name.toLowerCase()} topic, concept, or skill`}
                    />
                  </div>

                  <div>
                    <label>Where the child is stuck (optional)</label>
                    <input
                      type="text"
                      value={parentStuckPoint}
                      onChange={(e) => setParentStuckPoint(e.target.value)}
                      placeholder="Example: comparing ideas, setting up the first step, or remembering key terms"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={splitFieldStyle}>
              {!lockedMode ? (
                <div>
                  <label>Study mode (optional)</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value as TutorMode)}>
                    <option value="auto">Auto (follow my request)</option>
                    <option value="teach">Teach me step by step</option>
                    <option value="hint">Give hints only</option>
                    <option value="diagnose">Diagnose my mistake</option>
                    <option value="quiz">Turn this into practice questions</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label>Mode</label>
                  <ReadOnlyField
                    value={
                      lockedMode === 'auto'
                        ? 'Auto'
                        : lockedMode === 'hint'
                          ? 'Guided hints only'
                          : lockedMode === 'teach'
                            ? 'Teach step by step'
                            : lockedMode === 'diagnose'
                              ? 'Diagnose mistake'
                              : 'Quiz mode'
                    }
                  />
                </div>
              )}

              <div>
                <label>Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                >
                  <option value="elementary">Elementary</option>
                  <option value="middle-school">Middle school</option>
                  <option value="high-school">High school</option>
                  <option value="college">College</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border)'
          }}
        >
          <SectionTitle
            title="Image or worksheet support"
            description="Image processing is planned as a paid-only feature for Plus and Pro."
          />

          <PaidImageUploadPlaceholder compact context={audience} />
        </div>

        <div
          style={{
            display: 'grid',
            gap: 16,
            paddingTop: 18,
            borderTop: '1px solid var(--border)'
          }}
        >
          <SectionTitle
            title={audience === 'parent' ? 'Question or teaching situation' : 'Question or your work'}
            description={
              audience === 'parent'
                ? `Describe what the child is learning in ${subjectConfig.name.toLowerCase()}, where they are stuck, and how you want the explanation to feel.`
                : `Type a ${subjectConfig.name.toLowerCase()} question, paste your work, or ask for a quiz, explanation, or diagnosis in the same thread.`
            }
          />

          <div>
            <textarea
              ref={questionRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={questionPlaceholder}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'start',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 5,
                justifyItems: 'center'
              }}
            >
              <button onClick={() => void submitQuestion()} disabled={loading || !question.trim()}>
                {loading ? 'Thinking...' : conversationId ? 'Send Follow-up' : 'Ask TutoVera'}
              </button>

              <p
                className="small"
                title="Press Command + Enter on Mac or Control + Enter on Windows/Linux to submit."
                style={{
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                Cmd/Ctrl + Enter
              </p>
            </div>

            {showRetryButton ? (
              <button type="button" className="secondary" onClick={retryLastRequest}>
                Retry Last Request
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 14 }}>
        <SectionTitle
          title="Tutor response"
          description="The answer and suggested next steps stay connected here."
        />

        <div className="responseBox">
          {answer ? <AnswerDisplay text={answer} /> : <p>Your tutor response will appear here.</p>}
        </div>

        {graphingEnabled && audience === 'student' && showGraphForCurrentTurn && activeGraphExpression ? (
          <FunctionGraph expression={activeGraphExpression} />
        ) : null}
      </section>

      {showFollowUpSuggestions ? (
        <section className="card suggestionCard" style={{ display: 'grid', gap: 10 }}>
          <div>
            <p className="small" style={{ margin: 0 }}>
              <strong>Suggested next step</strong>
            </p>
            <p className="small" style={{ margin: '6px 0 0' }}>
              Tap one to place it into the question box, or type your own follow-up below.
            </p>
          </div>

          <div className="suggestionChips">
            {followUpSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="secondary suggestionChip"
                onClick={() => applySuggestionChip(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}