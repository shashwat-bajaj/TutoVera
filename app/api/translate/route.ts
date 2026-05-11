import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MAX_TRANSLATION_LENGTH = 12000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const ALLOWED_LANGUAGES = new Set([
  'Spanish',
  'Hindi',
  'French',
  'Arabic',
  'Portuguese',
  'Chinese',
  'Russian'
]);

function getUserFacingTranslationError(error: any) {
  const message = String(error?.message || '');
  const status =
    error?.status ||
    error?.code ||
    error?.error?.code ||
    error?.cause?.status ||
    null;

  if (
    status === 503 ||
    /503/.test(message) ||
    /UNAVAILABLE/i.test(message) ||
    /high demand/i.test(message) ||
    /temporar/i.test(message)
  ) {
    return {
      message: 'Translation is temporarily busy right now. Please try again in a moment.',
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
      message: 'Translation is receiving too many requests right now. Please try again shortly.',
      status: 429
    };
  }

  return {
    message: 'Translation failed.',
    status: 500
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    const sourceText = typeof text === 'string' ? text.trim() : '';
    const targetLanguage = typeof language === 'string' ? language.trim() : '';

    if (!sourceText) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    if (sourceText.length > MAX_TRANSLATION_LENGTH) {
      return NextResponse.json(
        {
          error: `Text is too long to translate at once. Please keep it under ${MAX_TRANSLATION_LENGTH} characters.`
        },
        { status: 400 }
      );
    }

    if (!targetLanguage || !ALLOWED_LANGUAGES.has(targetLanguage)) {
      return NextResponse.json({ error: 'Invalid language selection.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    const prompt = `
You are translating a TutoVera learning explanation into ${targetLanguage}.

Rules:
- Translate the natural-language explanation into ${targetLanguage}.
- Preserve markdown structure exactly where possible.
- Preserve headings, bullets, numbering, and spacing.
- Do NOT translate mathematical equations, chemical equations, formulas, variables, units, symbols, or code.
- Do NOT alter LaTeX expressions.
- Do NOT alter content inside $...$ or $$...$$.
- Do NOT alter code blocks or inline code.
- Keep scientific notation, symbols, variables, formulas, and expressions unchanged.
- Keep the meaning accurate, natural, and clear in ${targetLanguage}.
- Return only the translated content and nothing else.

Content to translate:
<<<BEGIN_CONTENT>>>
${sourceText}
<<<END_CONTENT>>>
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt
    });

    const translated = response.text?.trim() || '';

    if (!translated) {
      return NextResponse.json({ error: 'Translation failed.' }, { status: 500 });
    }

    return NextResponse.json({ translated });
  } catch (error: any) {
    const userFacing = getUserFacingTranslationError(error);

    return NextResponse.json(
      { error: userFacing.message },
      { status: userFacing.status }
    );
  }
}