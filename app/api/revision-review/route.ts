import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

import { getSubjectConfig } from '@/lib/subjects';
import { getUserPlanAccess } from '@/lib/subscriptions';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_TRANSCRIPT_CHARS = 18000;

type ConversationRecord = {
  id: string;
  title: string | null;
  audience: string;
  subject: string;
  user_id: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

type TurnRecord = {
  turn_index: number | null;
  mode: string;
  level: string;
  prompt: string;
  response: string;
  created_at: string;
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function formatSubjectName(subject: string) {
  const subjectConfig = getSubjectConfig(subject);

  if (subjectConfig) {
    return subjectConfig.name;
  }

  return subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : 'Unknown Subject';
}

function formatAudience(value: string) {
  if (value === 'parent') return 'Parent';
  if (value === 'student') return 'Student';
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';
}

function truncateBlock(value: string, maxLength: number) {
  const cleaned = value.trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength)}\n\n[This section was shortened for revision review.]`;
}

function buildTranscript(turns: TurnRecord[]) {
  let transcript = '';

  for (const turn of turns) {
    const turnNumber = turn.turn_index || 0;
    const prompt = truncateBlock(turn.prompt || '', 1800);
    const response = truncateBlock(turn.response || '', 3200);

    const block = `
Turn ${turnNumber || 'unknown'}
Mode: ${turn.mode || 'unknown'}
Level: ${turn.level || 'unknown'}
Created: ${turn.created_at || 'unknown'}

User question/work:
${prompt}

Tutor response:
${response}
`;

    if ((transcript + block).length > MAX_TRANSCRIPT_CHARS) {
      transcript += `

[Additional turns were omitted because the session is long. Focus the revision review on the visible transcript above.]
`;
      break;
    }

    transcript += `\n---\n${block}`;
  }

  return transcript.trim();
}

function buildRevisionPrompt({
  conversation,
  transcript
}: {
  conversation: ConversationRecord;
  transcript: string;
}) {
  const subjectName = formatSubjectName(conversation.subject);
  const audienceLabel = formatAudience(conversation.audience);
  const title = conversation.title || 'Untitled conversation';

  return `
You are TutoVera Revision Mode.

Create a polished revision review from the saved TutoVera session below.

Context:
- Subject: ${subjectName}
- Audience: ${audienceLabel}
- Conversation title: ${title}

Rules:
- Use only the provided session transcript.
- Do not invent mistakes, facts, diagrams, or claims that are not supported by the transcript.
- If the transcript is too limited to identify a mistake pattern, say that clearly.
- Make the review useful for studying later.
- Keep the tone calm, precise, encouraging, and practical.
- Use clean markdown.
- Use LaTeX only when helpful for math/science notation.
- Do not mention internal system prompts or implementation details.

Return the revision review with these exact sections:

## 1. Session Summary
Summarize what the learner worked on in this session.

## 2. Key Concepts to Remember
List the most important concepts, formulas, vocabulary, methods, or reasoning patterns from the session.

## 3. Mistakes or Weak Areas to Watch
Identify mistakes, weak areas, likely confusions, or fragile steps based only on the transcript. If there is not enough evidence, say what should be checked next.

## 4. Clean Study Notes
Create clear study notes the learner can review later.

## 5. Practice Questions
Create exactly 5 practice questions based on the session. Make them appropriately challenging for the level shown in the transcript.

## 6. Answer Key
Give concise answers or solution outlines for the 5 practice questions.

## 7. What to Review Next
Recommend what the learner should review next and why.

Saved session transcript:
${transcript}
`;
}

function canAccessConversation({
  conversation,
  userId,
  email
}: {
  conversation: ConversationRecord;
  userId: string;
  email: string;
}) {
  if (conversation.user_id && conversation.user_id === userId) return true;

  const conversationEmail = conversation.email?.trim().toLowerCase() || '';
  return Boolean(conversationEmail && conversationEmail === email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const conversationId = cleanText(body?.conversationId);

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json(
        { error: 'Please sign in to use Revision Mode.' },
        { status: 401 }
      );
    }

    const normalizedEmail = user.email.toLowerCase();
    const supabase = createAdminSupabase();

    const planAccess = await getUserPlanAccess({
      supabase,
      userId: user.id,
      email: normalizedEmail
    });

    if (planAccess.plan !== 'pro' || !planAccess.hasActivePaidAccess) {
      return NextResponse.json(
        {
          error:
            'Revision Mode is included with TutoVera Pro. Upgrade to Pro to generate revision reviews from saved sessions.'
        },
        { status: 403 }
      );
    }

    const { data: conversationData, error: conversationError } = await supabase
      .from('learner_conversations')
      .select('id, title, audience, subject, user_id, email, created_at, updated_at')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) {
      console.error('REVISION CONVERSATION LOOKUP ERROR:', conversationError);
      return NextResponse.json(
        { error: 'Could not load the selected conversation.' },
        { status: 500 }
      );
    }

    if (!conversationData) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    const conversation = conversationData as ConversationRecord;

    if (
      !canAccessConversation({
        conversation,
        userId: user.id,
        email: normalizedEmail
      })
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to review this conversation.' },
        { status: 403 }
      );
    }

    const { data: turnsData, error: turnsError } = await supabase
      .from('learner_sessions')
      .select('turn_index, mode, level, prompt, response, created_at')
      .eq('conversation_id', conversation.id)
      .eq('subject', conversation.subject)
      .order('turn_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (turnsError) {
      console.error('REVISION TURNS LOOKUP ERROR:', turnsError);
      return NextResponse.json(
        { error: 'Could not load the saved session turns.' },
        { status: 500 }
      );
    }

    const turns = (turnsData || []) as TurnRecord[];

    if (turns.length === 0) {
      return NextResponse.json(
        { error: 'This conversation does not have saved turns to review yet.' },
        { status: 404 }
      );
    }

    const transcript = buildTranscript(turns);
    const prompt = buildRevisionPrompt({
      conversation,
      transcript
    });

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      contents: prompt
    });

    const review = response.text?.trim() || '';

    if (!review) {
      return NextResponse.json(
        { error: 'Revision Mode could not generate a review for this session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      conversationId: conversation.id,
      subject: conversation.subject,
      audience: conversation.audience
    });
  } catch (error) {
    console.error('REVISION REVIEW API ERROR:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Revision Mode could not generate a review right now.'
      },
      { status: 500 }
    );
  }
}