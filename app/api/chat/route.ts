import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildTutorPrompt } from '@/lib/prompts';
import { normalizeGraphExpression } from '@/lib/graphing';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { getSubjectConfig, type SubjectConfig } from '@/lib/subjects';
import { getUserPlanAccess } from '@/lib/subscriptions';

const FALLBACK_DAILY_FREE_LIMIT = 10;

type ParentHelpStyle =
  | 'explain-simply'
  | 'talking-points'
  | 'simple-example'
  | 'practice-questions'
  | 'likely-mistake';

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

function buildConversationContext(
  turns: Array<{ prompt: string; response: string; turn_index?: number | null }>
) {
  if (!turns.length) return '';

  const recentTurns = turns.slice(-6);

  return recentTurns
    .map(
      (turn, index) => `
Previous turn ${index + 1}
Student/User:
${turn.prompt}

Tutor:
${turn.response}
`
    )
    .join('\n---\n');
}

function makeConversationTitle(question: string) {
  const cleaned = question.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New session';
  return cleaned.length > 70 ? `${cleaned.slice(0, 70)}...` : cleaned;
}

function getConfiguredList(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAdminUser(args: { userId: string | null; email: string | null }) {
  const adminUserIds = new Set(getConfiguredList(process.env.ADMIN_USER_IDS));
  const adminEmails = new Set(
    getConfiguredList(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase())
  );

  if (args.userId && adminUserIds.has(args.userId)) {
    return true;
  }

  if (args.email && adminEmails.has(args.email.toLowerCase())) {
    return true;
  }

  return false;
}

function getRequestedSubject(value: unknown) {
  const subjectKey =
    typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : 'math';

  return getSubjectConfig(subjectKey);
}

function getParentStyleInstruction(style: ParentHelpStyle) {
  switch (style) {
    case 'talking-points':
      return `Make the response especially useful for a parent speaking directly to a child. Include short talking points the parent can say out loud, likely follow-up questions the child may ask, and practical phrases that feel natural in conversation.`;
    case 'simple-example':
      return `Focus on one very simple example before anything else. Keep the explanation concrete, gentle, and highly intuitive. Do not overload the parent with multiple methods.`;
    case 'practice-questions':
      return `Focus on creating a small scaffolded practice sequence the parent can use after a short explanation. Include a few simple practice prompts and quick answer checks.`;
    case 'likely-mistake':
      return `Focus on diagnosing the most likely misconception or mistake the child is making, why it happens, and how a parent can correct it gently without making the child feel discouraged.`;
    case 'explain-simply':
    default:
      return `Focus on explaining the concept in the simplest, clearest, most parent-friendly way possible.`;
  }
}

function getParentLevelInstruction(gradeLevel: string) {
  switch (gradeLevel) {
    case 'elementary':
      return `Use very simple language, short sentences, concrete examples, and child-friendly analogies. Avoid heavy jargon.`;
    case 'middle-school':
      return `Use clear everyday language, but begin connecting ideas to proper subject vocabulary in a gentle way.`;
    case 'high-school':
      return `Use accurate subject terms, but keep the explanation parent-friendly and easy to say aloud.`;
    case 'college':
    default:
      return `You may use more formal vocabulary, but still keep the response practical and parent-friendly.`;
  }
}

function getParentOutputSections(style: ParentHelpStyle) {
  switch (style) {
    case 'talking-points':
      return `
Please structure the response with these sections:
1. What the child may be confused by
2. What the parent can say
3. Questions the parent can ask back
4. One short example
5. One reassuring line to use
6. One mistake to avoid
`;
    case 'simple-example':
      return `
Please structure the response with these sections:
1. What the child may be confused by
2. The simplest example first
3. Why that example works
4. What the parent can say
5. One next practice prompt
6. One mistake to avoid
`;
    case 'practice-questions':
      return `
Please structure the response with these sections:
1. What the child may be confused by
2. A very short explanation
3. Practice question 1
4. Practice question 2
5. Practice question 3
6. Quick answer checks for the parent
`;
    case 'likely-mistake':
      return `
Please structure the response with these sections:
1. Most likely mistake
2. Why it happens
3. How to correct it gently
4. What the parent can say
5. One short corrective example
6. One practice prompt
`;
    case 'explain-simply':
    default:
      return `
Please structure the response with these sections:
1. What the child may be confused by
2. How to explain it simply
3. What the parent can say
4. One short example
5. One practice prompt
6. One mistake to avoid
`;
  }
}

function buildParentQuestion({
  question,
  gradeLevel,
  topic,
  stuckPoint,
  helpStyle,
  subject
}: {
  question: string;
  gradeLevel: string;
  topic?: string;
  stuckPoint?: string;
  helpStyle: ParentHelpStyle;
  subject: SubjectConfig;
}) {
  const topicLine = topic?.trim() ? `Topic: ${topic.trim()}` : 'Topic: not specified';
  const stuckLine = stuckPoint?.trim()
    ? `Where the child is stuck: ${stuckPoint.trim()}`
    : 'Where the child is stuck: not specified';

  return `
You are helping a parent support a child with ${subject.name} learning.

Child level: ${gradeLevel}
${topicLine}
${stuckLine}

Parent request:
${question}

Special instruction:
${getParentStyleInstruction(helpStyle)}

Level guidance:
${getParentLevelInstruction(gradeLevel)}

${getParentOutputSections(helpStyle)}

Keep the tone supportive, clear, and practical for a parent. Do not jump straight to a final answer unless necessary.
`;
}

function containsStandaloneX(text: string) {
  return /(^|[^a-z])x([^a-z]|$)/i.test(text);
}

function looksLikeBareMathInput(question: string) {
  const trimmed = question.trim();

  if (!trimmed) return false;
  if (trimmed.length > 40) return false;
  if (/\n/.test(trimmed)) return false;

  return (
    /^[a-zA-Z0-9\s()+\-*/^.=]+$/.test(trimmed) &&
    (/[0-9]/.test(trimmed) || containsStandaloneX(trimmed))
  );
}

function hasExplicitMathIntent(question: string) {
  return /\b(solve|factor|simplify|evaluate|graph|grpah|plot|draw|sketch|differentiate|derivative|integrate|integral|explain|find|roots?|zeros?|intercepts?|vertex|teach|hint|diagnose|mistake|quiz)\b/i.test(
    question
  );
}

function isAmbiguousStandaloneMathInput(question: string) {
  return looksLikeBareMathInput(question) && !hasExplicitMathIntent(question);
}

function isGraphOnlyRequest(question: string) {
  const hasGraphWord = /\b(graph|grpah|plot|draw|sketch|show\s+the\s+graph)\b/i.test(question);
  const hasOtherStrongIntent =
    /\b(solve|factor|simplify|differentiate|derivative|integrate|integral|diagnose|quiz|hint|teach)\b/i.test(
      question
    );
  const asksForExplanation = /\b(explain|describe|what does|how does|why does)\b/i.test(question);

  return hasGraphWord && !hasOtherStrongIntent && !asksForExplanation;
}

function isGraphExplanationRequest(question: string) {
  return (
    /\b(graph|grpah|plot|curve)\b/i.test(question) &&
    /\b(explain|describe|what does|how does|why does)\b/i.test(question)
  );
}

function buildStudentQuestion(question: string, mode: string, subject: SubjectConfig) {
  let enhanced = question;

  if (subject.key !== 'math') {
    if (mode === 'diagnose') {
      enhanced = `${enhanced}

If the user did not actually provide their work or steps, say that you cannot diagnose an exact mistake yet, and then show what they should check first.`;
    }

    if (mode === 'hint') {
      enhanced = `${enhanced}

Stay in hint mode unless a full answer is absolutely necessary.`;
    }

    return enhanced.trim();
  }

  if (mode === 'auto') {
    if (isAmbiguousStandaloneMathInput(question)) {
      enhanced = `${question}

The user's input is too ambiguous to assume the goal.
Ask one short clarifying question before solving.
Offer 3 to 5 likely options such as:
- explain what it means
- graph it
- solve/factor it if relevant
- find the derivative
- find the integral
Do not choose one automatically yet.`;
    } else if (isGraphOnlyRequest(question)) {
      enhanced = `${question}

The user is asking for the actual graph, not a long lesson.
Keep the text response very brief.
Do not give a full teaching walkthrough unless the user also asked for explanation.`;
    } else if (isGraphExplanationRequest(question)) {
      enhanced = `${question}

The user wants an explanation of the graph in words.
Explain the graph clearly and concisely.
Do not turn this into a full unrelated worked solution unless needed.`;
    } else if (looksLikeBareMathInput(question)) {
      enhanced = `${question}

The user entered a short math expression or function.
Help them according to what they asked for, but do not assume extra tasks they did not request.`;
    }
  } else {
    if (isAmbiguousStandaloneMathInput(question)) {
      enhanced = `${question}

The user's input is too ambiguous to assume the goal.
Ask one short clarifying question before solving.
Offer 3 to 5 likely options such as:
- explain what it means
- graph it
- solve/factor it if relevant
- find the derivative
- find the integral
Do not choose one automatically yet.`;
    } else if (looksLikeBareMathInput(question)) {
      enhanced = `${question}

The user entered a short math expression or function.
Help them according to what they asked for, but do not assume extra tasks they did not request.`;
    }

    if (mode === 'diagnose') {
      enhanced = `${enhanced}

If the user did not actually provide their work or steps, say that you cannot diagnose an exact mistake yet, and then show what they should check first.`;
    }

    if (mode === 'hint') {
      enhanced = `${enhanced}

Stay in hint mode unless a full solution is absolutely necessary.`;
    }
  }

  return enhanced.trim();
}

function isRetryableTutorError(error: any) {
  const message = String(error?.message || '');
  const status =
    error?.status || error?.code || error?.error?.code || error?.cause?.status || null;

  return (
    status === 503 ||
    status === 429 ||
    /503/.test(message) ||
    /429/.test(message) ||
    /UNAVAILABLE/i.test(message) ||
    /high demand/i.test(message) ||
    /temporar/i.test(message) ||
    /rate limit/i.test(message) ||
    /quota/i.test(message) ||
    /too many requests/i.test(message)
  );
}

function getUserFacingTutorError(error: any) {
  const message = String(error?.message || '');
  const status =
    error?.status || error?.code || error?.error?.code || error?.cause?.status || null;

  if (
    status === 503 ||
    /503/.test(message) ||
    /UNAVAILABLE/i.test(message) ||
    /high demand/i.test(message) ||
    /temporar/i.test(message)
  ) {
    return {
      message: 'The tutor is busy now, please try again later.',
      status: 503
    };
  }

  if (
    status === 429 ||
    /429/.test(message) ||
    /rate limit/i.test(message) ||
    /quota/i.test(message) ||
    /too many requests/i.test(message)
  ) {
    return {
      message: 'The tutor is receiving too many requests right now. Please try again shortly.',
      status: 429
    };
  }

  return {
    message: 'Something went wrong while generating the tutor response. Please try again.',
    status: 500
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLocalGraphOnlyAnswer(expression: string) {
  return `## Graph

Showing the graph for $y = ${expression}$.

Ask to explain the graph, identify intercepts, describe the vertex, or compare it to another function.`;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function generateTutorAnswerWithRetry(prompt: string) {
  const retryDelays = [0, 900];

  let lastError: any = null;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) {
      await sleep(retryDelays[attempt]);
    }

    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt
      });

      const answer = response.text?.trim() || '';
      if (!answer) {
        throw new Error('Empty response from tutor model.');
      }

      return answer;
    } catch (error: any) {
      lastError = error;

      if (!isRetryableTutorError(error) || attempt === retryDelays.length - 1) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Tutor request failed.');
}

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      gradeLevel = 'high-school',
      mode = 'auto',
      email = '',
      audience = 'student',
      conversationId = null,
      parentHelpStyle = 'explain-simply',
      topic = '',
      stuckPoint = '',
      graphOnlyBypass = false,
      graphExpression = null,
      subject = 'math'
    } = await request.json();

    const subjectConfig = getRequestedSubject(subject);

    if (!subjectConfig) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400 });
    }

    if (subjectConfig.status !== 'active') {
      return NextResponse.json(
        {
          error: `${subjectConfig.name} support is not currently available. Please choose an active TutoVera subject branch.`
        },
        { status: 501 }
      );
    }

    const activeSubject = subjectConfig.key;

    const questionText = typeof question === 'string' ? question.trim() : '';
    const normalizedGraphExpression =
      typeof graphExpression === 'string' ? normalizeGraphExpression(graphExpression) : '';

    if (!questionText) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in .env.local' },
        { status: 500 }
      );
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    const supabase = createAdminSupabase();

    const normalizedEmail =
      typeof email === 'string' && email.trim()
        ? email.trim().toLowerCase()
        : user?.email?.toLowerCase() || null;

    const bypassDailyLimit = isAdminUser({
      userId: user?.id || null,
      email: normalizedEmail
    });

    const planAccess = user?.id
      ? await getUserPlanAccess({
          supabase,
          userId: user.id,
          email: normalizedEmail
        })
      : null;

    const dailyTutorLimit = planAccess?.dailyTutorLimit || FALLBACK_DAILY_FREE_LIMIT;

    if (!bypassDailyLimit) {
      const ipAddress = getClientIp(request);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let countQuery = supabase
        .from('learner_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since);

      if (user?.id) {
        countQuery = countQuery.eq('user_id', user.id);
      } else if (normalizedEmail) {
        countQuery = countQuery.eq('email', normalizedEmail);
      } else {
        countQuery = countQuery.eq('ip_address', ipAddress);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('SUPABASE COUNT ERROR:', countError);
        return NextResponse.json({ error: 'Could not verify daily limit.' }, { status: 500 });
      }

      if ((count || 0) >= dailyTutorLimit) {
        return NextResponse.json(
          {
            error: planAccess?.isPaidPlan
              ? `Daily tutor limit reached for your ${planAccess.plan} plan. You can send up to ${dailyTutorLimit} tutor requests in a 24-hour period. Please try again later.`
              : `Free plan limit reached. You can send up to ${dailyTutorLimit} tutor requests in a 24-hour period. Upgrade to Plus or Pro for higher limits.`
          },
          { status: 429 }
        );
      }
    }

    let activeConversationId: string | null = conversationId;
    let existingTurns: Array<{
      prompt: string;
      response: string;
      turn_index?: number | null;
    }> = [];

    if (activeConversationId) {
      const { data: activeConversation, error: conversationLookupError } = await supabase
        .from('learner_conversations')
        .select('id, subject')
        .eq('id', activeConversationId)
        .eq('subject', activeSubject)
        .maybeSingle();

      if (conversationLookupError) {
        console.error('SUPABASE CONVERSATION LOOKUP ERROR:', conversationLookupError);
        return NextResponse.json(
          { error: 'Could not verify the selected conversation.' },
          { status: 500 }
        );
      }

      if (!activeConversation) {
        return NextResponse.json(
          { error: 'Conversation was not found for this subject.' },
          { status: 404 }
        );
      }

      const { data: previousTurns, error: turnsError } = await supabase
        .from('learner_sessions')
        .select('prompt, response, turn_index, created_at')
        .eq('conversation_id', activeConversationId)
        .eq('subject', activeSubject)
        .order('turn_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (turnsError) {
        console.error('SUPABASE LOAD TURNS ERROR:', turnsError);
      } else {
        existingTurns = (previousTurns || []).map((t) => ({
          prompt: t.prompt,
          response: t.response,
          turn_index: t.turn_index
        }));
      }
    }

    const conversationSeed = audience === 'parent' && topic.trim() ? topic : questionText;

    let answer = '';

    if (
      subjectConfig.features.graphing &&
      graphOnlyBypass &&
      audience === 'student' &&
      normalizedGraphExpression
    ) {
      answer = buildLocalGraphOnlyAnswer(normalizedGraphExpression);
    } else {
      const conversationContext = buildConversationContext(existingTurns);

      const effectiveQuestion =
        audience === 'parent'
          ? buildParentQuestion({
              question: questionText,
              gradeLevel,
              topic,
              stuckPoint,
              helpStyle: parentHelpStyle as ParentHelpStyle,
              subject: subjectConfig
            })
          : buildStudentQuestion(questionText, mode, subjectConfig);

      const prompt = buildTutorPrompt({
        question: conversationContext
          ? `${effectiveQuestion}\n\nConversation context:\n${conversationContext}`
          : effectiveQuestion,
        gradeLevel,
        mode,
        symbolicCheck: '',
        audience,
        subject: subjectConfig
      });

      answer = await generateTutorAnswerWithRetry(prompt);
    }

    if (!activeConversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from('learner_conversations')
        .insert({
          user_id: user?.id || null,
          email: normalizedEmail,
          subject: activeSubject,
          audience,
          title: makeConversationTitle(conversationSeed)
        })
        .select('id')
        .single();

      if (conversationError || !conversation) {
        console.error('SUPABASE CREATE CONVERSATION ERROR:', conversationError);
        return NextResponse.json({ error: 'Could not create conversation.' }, { status: 500 });
      }

      activeConversationId = conversation.id;
    }

    const turnIndex = existingTurns.reduce((max, turn) => Math.max(max, turn.turn_index || 0), 0) + 1;

    try {
      await supabase.from('learner_sessions').insert({
        user_id: user?.id || null,
        conversation_id: activeConversationId,
        turn_index: turnIndex,
        email: normalizedEmail,
        ip_address: getClientIp(request),
        subject: activeSubject,
        mode,
        level: gradeLevel,
        prompt: questionText,
        response: answer
      });
    } catch (dbError) {
      console.error('SUPABASE SAVE ERROR:', dbError);
    }

    return NextResponse.json({
      answer,
      conversationId: activeConversationId,
      subject: activeSubject
    });
  } catch (error: any) {
    console.error('CHAT API ERROR:', error);

    const userFacing = getUserFacingTutorError(error);

    return NextResponse.json({ error: userFacing.message }, { status: userFacing.status });
  }
}