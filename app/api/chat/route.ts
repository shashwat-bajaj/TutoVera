import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildTutorPrompt } from '@/lib/prompts';
import { normalizeGraphExpression } from '@/lib/graphing';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { planAllowsImageProcessing } from '@/lib/plans';
import { getSubjectConfig, type SubjectConfig } from '@/lib/subjects';
import { getUserPlanAccess } from '@/lib/subscriptions';
import {
  buildLearningProfileContext,
  getLearningProfileForTutor,
  shouldUpdateLearningProfile,
  updateLearningProfileFromTurn
} from '@/lib/learning-profile';

const FALLBACK_DAILY_FREE_LIMIT = 10;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ParentHelpStyle =
  | 'explain-simply'
  | 'talking-points'
  | 'simple-example'
  | 'practice-questions'
  | 'likely-mistake';

type ImageRequestPayload = {
  data: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
};

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

const SUBJECT_SIGNAL_PATTERNS: Record<SubjectConfig['key'], RegExp[]> = {
  math: [
    /\b(algebra|arithmetic|calculus|geometry|trigonometry|statistics|probability)\b/i,
    /\b(solve|factor|simplify|evaluate|differentiate|integrate|derivative|integral)\b/i,
    /\b(equation|expression|polynomial|quadratic|linear|slope|intercept|graph|plot)\b/i,
    /\b(angle|triangle|circle|area|volume|matrix|vector|logarithm|exponent|fraction|percentage)\b/i,
    /\bf\s*\(\s*x\s*\)/i,
    /[0-9]\s*[+\-*/^=]\s*[0-9a-z(]/i,
    /\bx\s*(\^|²|=|\+|-|\*)/i
  ],
  physics: [
    /\b(physics|force|velocity|speed|acceleration|motion|newton|mass|gravity|friction)\b/i,
    /\b(energy|momentum|impulse|projectile|kinematics|dynamics|torque|pressure)\b/i,
    /\b(wave|frequency|wavelength|electricity|current|voltage|resistance|circuit)\b/i,
    /\b(magnetic|magnetism|thermodynamics|heat|temperature|quantum|relativity|unit|units)\b/i,
    /\b(work-energy|work energy|power)\b/i,
    /\b(f\s*=\s*m\s*a|v\s*=\s*d\s*\/\s*t|e\s*=\s*m\s*c)\b/i
  ],
  chemistry: [
    /\b(chemistry|atom|molecule|compound|element|periodic table|electron|proton|neutron)\b/i,
    /\b(mole|moles|molar|molarity|stoichiometry|reaction|reactant|product|chemical equation)\b/i,
    /\b(balance|balancing|bond|ionic|covalent|acid|base|ph|solution|concentration)\b/i,
    /\b(oxidation|reduction|redox|enthalpy|organic|hydrocarbon|isotope|ion)\b/i,
    /\b(h2o|co2|nacl|o2|hcl|naoh|ch4|c6h12o6)\b/i
  ],
  biology: [
    /\b(biology|cell|cells|dna|rna|gene|genes|genetics|chromosome|evolution)\b/i,
    /\b(mitosis|meiosis|photosynthesis|cellular respiration|respiration|osmosis|diffusion)\b/i,
    /\b(organism|species|ecosystem|ecology|anatomy|physiology|enzyme|protein)\b/i,
    /\b(membrane|tissue|organ|heart|lung|brain|nervous|immune|digestive)\b/i,
    /\b(darwin|natural selection|homeostasis|bacteria|virus|plant|animal)\b/i
  ]
};

const OBVIOUS_NON_SUBJECT_PATTERNS = [
  /\bcapital\s+of\b/i,
  /\bcurrency\s+of\b/i,
  /\bpopulation\s+of\b/i,
  /\bweather\b/i,
  /\bnews\b/i,
  /\bstock price\b/i,
  /\bexchange rate\b/i,
  /\brecipe\b/i,
  /\bmovie\b/i,
  /\bsong\b/i,
  /\blyrics\b/i,
  /\bsports?\b/i,
  /\bfootball\b/i,
  /\bcricket\b/i,
  /\belection\b/i,
  /\bvisa\b/i,
  /\bhotel\b/i,
  /\bflight\b/i,
  /\brestaurant\b/i,
  /\bprime minister\b/i,
  /\bpresident\b/i,
  /\bking\b/i,
  /\bqueen\b/i,
  /\bceo\b/i,
  /\bfounder\b/i
];

function normalizeSubjectBoundaryText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function hasSubjectSignal(text: string, subject: SubjectConfig) {
  const normalized = normalizeSubjectBoundaryText(text);
  return SUBJECT_SIGNAL_PATTERNS[subject.key].some((pattern) => pattern.test(normalized));
}

function hasOtherSubjectSignal(text: string, subject: SubjectConfig) {
  const normalized = normalizeSubjectBoundaryText(text);

  return Object.entries(SUBJECT_SIGNAL_PATTERNS).some(([subjectKey, patterns]) => {
    if (subjectKey === subject.key) return false;
    return patterns.some((pattern) => pattern.test(normalized));
  });
}

function getSubjectBoundaryRefusal({
  subject,
  audience
}: {
  subject: SubjectConfig;
  audience: string;
}) {
  if (audience === 'parent') {
    return `Hello! I'm TutoVera ${subject.name}, and this parent workspace is focused on ${subject.name.toLowerCase()} learning support. Share a ${subject.name.toLowerCase()} topic, problem, or step your child is stuck on, and I’ll help you explain it clearly.`;
  }

  return `Hello! I'm TutoVera ${subject.name}, and I’m focused on ${subject.name.toLowerCase()} learning. Send me a ${subject.name.toLowerCase()} problem, topic, or step you’re stuck on, and I’ll help you work through it clearly.`;
}

function getObviousSubjectBoundaryRefusal({
  question,
  subject,
  audience,
  hasImage
}: {
  question: string;
  subject: SubjectConfig;
  audience: string;
  hasImage: boolean;
}) {
  if (hasImage) return null;

  const normalized = normalizeSubjectBoundaryText(question);
  if (!normalized) return null;

  if (hasSubjectSignal(normalized, subject)) {
    return null;
  }

  const hasAnotherSubject = hasOtherSubjectSignal(normalized, subject);
  const isObviousGeneralQuestion = OBVIOUS_NON_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );

  if (hasAnotherSubject || isObviousGeneralQuestion) {
    return getSubjectBoundaryRefusal({ subject, audience });
  }

  return null;
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

function estimateBase64SizeBytes(base64: string) {
  const cleaned = base64.replace(/\s/g, '');
  if (!cleaned) return 0;

  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

function sanitizeImagePayload(value: unknown): {
  image: ImageRequestPayload | null;
  error?: string;
} {
  if (!value) {
    return { image: null };
  }

  if (typeof value !== 'object') {
    return { image: null, error: 'Invalid image payload.' };
  }

  const raw = value as Record<string, unknown>;
  const mimeType = typeof raw.mimeType === 'string' ? raw.mimeType.trim().toLowerCase() : '';
  const originalName =
    typeof raw.originalName === 'string' && raw.originalName.trim()
      ? raw.originalName.trim().slice(0, 180)
      : null;

  let data = typeof raw.data === 'string' ? raw.data.trim() : '';

  if (data.startsWith('data:')) {
    data = data.replace(/^data:[^;]+;base64,/, '');
  }

  data = data.replace(/\s/g, '');

  if (!data) {
    return { image: null, error: 'Image data was missing.' };
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    return {
      image: null,
      error: 'Unsupported image type. Please use PNG, JPG, JPEG, or WebP.'
    };
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    return {
      image: null,
      error: 'The uploaded image could not be read. Please try another file.'
    };
  }

  const estimatedSize = estimateBase64SizeBytes(data);
  const providedSize =
    typeof raw.sizeBytes === 'number' && Number.isFinite(raw.sizeBytes)
      ? Math.max(0, Math.floor(raw.sizeBytes))
      : 0;

  const sizeBytes = Math.max(estimatedSize, providedSize);

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      image: null,
      error: 'Image is too large. Please upload an image under 8 MB.'
    };
  }

  return {
    image: {
      data,
      mimeType,
      sizeBytes,
      originalName
    }
  };
}

function getCurrentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function buildImageInstruction({
  audience,
  subject
}: {
  audience: string;
  subject: SubjectConfig;
}) {
  if (audience === 'parent') {
    return `
The user attached an image related to the child’s ${subject.name} work.
Use the image as evidence when helpful.
If the image is unclear, say what you can and cannot read.
Focus on helping the parent understand the child’s work and guide the child without simply doing everything for them.
`;
  }

  return `
The user attached an image related to this ${subject.name} question.
Use the image as evidence when helpful.
If the image is unclear, say what you can and cannot read.
Explain the reasoning step by step and connect your answer to the visible work in the image.
`;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function generateTutorAnswerWithRetry(prompt: string, image?: ImageRequestPayload | null) {
  const retryDelays = [0, 900];

  let lastError: any = null;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) {
      await sleep(retryDelays[attempt]);
    }

    try {
      const contents = image
        ? ([
            { text: prompt },
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.data
              }
            }
          ] as any)
        : prompt;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        contents
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
    const body = await request.json();

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
      subject = 'math',
      image = null
    } = body;

    const { image: imagePayload, error: imagePayloadError } = sanitizeImagePayload(image);

    if (imagePayloadError) {
      return NextResponse.json({ error: imagePayloadError }, { status: 400 });
    }

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

    const subjectBoundaryRefusal = getObviousSubjectBoundaryRefusal({
      question: questionText,
      subject: subjectConfig,
      audience,
      hasImage: Boolean(imagePayload)
    });

    if (subjectBoundaryRefusal) {
      return NextResponse.json({
        answer: subjectBoundaryRefusal,
        conversationId:
          typeof conversationId === 'string' && conversationId.trim()
            ? conversationId.trim()
            : null,
        subject: activeSubject,
        imageUsed: false,
        subjectBoundary: true
      });
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

    const learningProfile = user?.id
      ? await getLearningProfileForTutor({
          supabase,
          userId: user.id,
          subject: activeSubject,
          audience
        })
      : null;

    if (imagePayload) {
      if (!user?.id || !planAccess?.hasActivePaidAccess) {
        return NextResponse.json(
          {
            error:
              'Image and worksheet support is included with Plus and Pro. Please sign in with an active paid plan to upload images.'
          },
          { status: 403 }
        );
      }

      if (!planAllowsImageProcessing(planAccess.plan)) {
        return NextResponse.json(
          {
            error:
              'Your current plan does not include image and worksheet support. Upgrade to Plus or Pro to upload images.'
          },
          { status: 403 }
        );
      }

      const monthlyImageLimit = planAccess.imageUploadsPerMonth || 0;

      if (!bypassDailyLimit) {
        const since = getCurrentMonthStartIso();

        let imageCountQuery = supabase
          .from('learner_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('has_image', true)
          .gte('created_at', since);

        if (user.id) {
          imageCountQuery = imageCountQuery.eq('user_id', user.id);
        } else if (normalizedEmail) {
          imageCountQuery = imageCountQuery.eq('email', normalizedEmail);
        }

        const { count: imageCount, error: imageCountError } = await imageCountQuery;

        if (imageCountError) {
          console.error('SUPABASE IMAGE COUNT ERROR:', imageCountError);
          return NextResponse.json({ error: 'Could not verify image limit.' }, { status: 500 });
        }

        if ((imageCount || 0) >= monthlyImageLimit) {
          return NextResponse.json(
            {
              error: `Monthly image limit reached for your ${planAccess.plan} plan. You can upload up to ${monthlyImageLimit} images per month.`
            },
            { status: 429 }
          );
        }
      }
    }

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
        .select('id, subject, user_id, email')
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

      const conversationUserId =
        typeof activeConversation.user_id === 'string' ? activeConversation.user_id : null;

      const conversationEmail =
        typeof activeConversation.email === 'string'
          ? activeConversation.email.trim().toLowerCase()
          : '';

      const canUseConversation = user?.id
        ? conversationUserId === user.id
        : conversationUserId
          ? false
          : conversationEmail
            ? Boolean(normalizedEmail && conversationEmail === normalizedEmail)
            : true;

      if (!canUseConversation) {
        return NextResponse.json(
          { error: 'Not authorized to continue this conversation.' },
          { status: 403 }
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

    const handledByLocalGraphOnly =
      subjectConfig.features.graphing &&
      graphOnlyBypass &&
      !imagePayload &&
      audience === 'student' &&
      normalizedGraphExpression;

    if (handledByLocalGraphOnly) {
      answer = buildLocalGraphOnlyAnswer(normalizedGraphExpression);
    } else {
      const conversationContext = buildConversationContext(existingTurns);
      const learningProfileContext = buildLearningProfileContext(learningProfile);

      const baseEffectiveQuestion =
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

      const effectiveQuestion = imagePayload
        ? `${baseEffectiveQuestion}

${buildImageInstruction({
  audience,
  subject: subjectConfig
})}`
        : baseEffectiveQuestion;

      const tutorContext = [
        learningProfileContext,
        conversationContext ? `Conversation context:\n${conversationContext}` : ''
      ]
        .filter(Boolean)
        .join('\n\n');

      const prompt = buildTutorPrompt({
        question: tutorContext ? `${effectiveQuestion}\n\n${tutorContext}` : effectiveQuestion,
        gradeLevel,
        mode,
        symbolicCheck: '',
        audience,
        subject: subjectConfig
      });

      answer = await generateTutorAnswerWithRetry(prompt, imagePayload);
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
        response: answer,
        has_image: Boolean(imagePayload),
        image_mime_type: imagePayload?.mimeType || null,
        image_size_bytes: imagePayload?.sizeBytes || null,
        image_original_name: imagePayload?.originalName || null,
        image_plan: imagePayload ? planAccess?.plan || 'free' : null
      });
    } catch (dbError) {
      console.error('SUPABASE SAVE ERROR:', dbError);
    }

    const shouldRefreshLearningProfile =
      user?.id &&
      normalizedEmail &&
      shouldUpdateLearningProfile({
        turnIndex,
        existingProfile: learningProfile,
        isGraphOnlyBypass: Boolean(handledByLocalGraphOnly)
      });

    if (shouldRefreshLearningProfile && user?.id && normalizedEmail) {
      try {
        await updateLearningProfileFromTurn({
          supabase,
          ai,
          model:
            process.env.GEMINI_PROFILE_MODEL ||
            process.env.GEMINI_MODEL ||
            'gemini-3.1-flash-lite',
          userId: user.id,
          email: normalizedEmail,
          subject: activeSubject,
          audience,
          gradeLevel,
          mode,
          question: questionText,
          answer,
          existingProfile: learningProfile
        });
      } catch (profileError) {
        console.error('LEARNING PROFILE UPDATE ERROR:', profileError);
      }
    }

    return NextResponse.json({
      answer,
      conversationId: activeConversationId,
      subject: activeSubject,
      imageUsed: Boolean(imagePayload)
    });
  } catch (error: any) {
    console.error('CHAT API ERROR:', error);

    const userFacing = getUserFacingTutorError(error);

    return NextResponse.json({ error: userFacing.message }, { status: userFacing.status });
  }
}