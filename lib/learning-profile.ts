import type { SubjectKey } from '@/lib/subjects';

export type LearningProfileRecord = {
  id: string;
  user_id: string;
  email: string;
  subject: string;
  audience: string;
  grade_level: string | null;
  profile_summary: string | null;
  common_mistakes: string | null;
  weak_areas: string | null;
  strengths: string | null;
  preferred_style: string | null;
  parent_guidance_notes: string | null;
  last_observation: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileDraft = {
  profile_summary?: string;
  common_mistakes?: string;
  weak_areas?: string;
  strengths?: string;
  preferred_style?: string;
  parent_guidance_notes?: string;
  last_observation?: string;
};

const LEARNING_PROFILE_SELECT = [
  'id',
  'user_id',
  'email',
  'subject',
  'audience',
  'grade_level',
  'profile_summary',
  'common_mistakes',
  'weak_areas',
  'strengths',
  'preferred_style',
  'parent_guidance_notes',
  'last_observation',
  'is_enabled',
  'created_at',
  'updated_at'
].join(', ');

function cleanProfileText(value: unknown, maxLength = 700) {
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trim()}...` : cleaned;
}

function truncateForPrompt(value: string, maxLength: number) {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}...`;
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function getFallbackDraft({
  subject,
  audience,
  gradeLevel,
  question
}: {
  subject: string;
  audience: string;
  gradeLevel: string;
  question: string;
}): ProfileDraft {
  return {
    profile_summary: `Recent ${subject} ${audience} session at ${gradeLevel} level.`,
    last_observation: truncateForPrompt(question, 260)
  };
}

function buildProfileUpdatePrompt({
  existingProfile,
  subject,
  audience,
  gradeLevel,
  mode,
  question,
  answer
}: {
  existingProfile: LearningProfileRecord | null;
  subject: string;
  audience: string;
  gradeLevel: string;
  mode: string;
  question: string;
  answer: string;
}) {
  return `
You are updating a concise learning profile for TutoVera.

The profile should help future tutor responses feel more continuous and personalized.
Use only the existing profile and latest tutor interaction below.
Do not include private personal details unless they are directly relevant to learning style.
Do not include the full conversation.
Do not invent diagnoses, disabilities, medical claims, or sensitive personal attributes.
Keep each field concise and useful.

Return JSON only with these keys:
{
  "profile_summary": "1-2 sentence summary of learning context",
  "common_mistakes": "recurring mistakes or fragile steps, if visible",
  "weak_areas": "topics/skills that may need review, if visible",
  "strengths": "what the learner appears to do well, if visible",
  "preferred_style": "helpful teaching style or response pattern, if visible",
  "parent_guidance_notes": "parent-coaching pattern if audience is parent, otherwise empty",
  "last_observation": "one concise observation from the latest interaction"
}

Existing profile:
${existingProfile ? JSON.stringify(existingProfile, null, 2) : 'No existing profile yet.'}

Latest interaction metadata:
- Subject: ${subject}
- Audience: ${audience}
- Grade level: ${gradeLevel}
- Mode: ${mode}

Latest user question/work:
${truncateForPrompt(question, 2200)}

Latest tutor response:
${truncateForPrompt(answer, 3200)}
`;
}

export function buildLearningProfileContext(profile: LearningProfileRecord | null) {
  if (!profile || !profile.is_enabled) return '';

  const lines = [
    profile.profile_summary ? `Learner profile summary: ${profile.profile_summary}` : '',
    profile.common_mistakes ? `Common mistakes to watch: ${profile.common_mistakes}` : '',
    profile.weak_areas ? `Weak areas to support: ${profile.weak_areas}` : '',
    profile.strengths ? `Strengths to build on: ${profile.strengths}` : '',
    profile.preferred_style ? `Preferred teaching style: ${profile.preferred_style}` : '',
    profile.parent_guidance_notes
      ? `Parent guidance notes: ${profile.parent_guidance_notes}`
      : '',
    profile.last_observation ? `Recent learning observation: ${profile.last_observation}` : ''
  ].filter(Boolean);

  if (!lines.length) return '';

  return `
Learning Profile:
Use this only to adapt tone, pacing, examples, and what to watch for.
Do not mention that you are using a stored profile unless the user asks.
${lines.map((line) => `- ${line}`).join('\n')}
`;
}

export async function getLearningProfileForTutor({
  supabase,
  userId,
  subject,
  audience
}: {
  supabase: any;
  userId?: string | null;
  subject: SubjectKey | string;
  audience: string;
}): Promise<LearningProfileRecord | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('learning_profiles')
    .select(LEARNING_PROFILE_SELECT)
    .eq('user_id', userId)
    .eq('subject', subject)
    .eq('audience', audience)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error) {
    console.error('LEARNING PROFILE LOOKUP ERROR:', error);
    return null;
  }

  return data ? (data as LearningProfileRecord) : null;
}

export async function getLearningProfilesForUser({
  supabase,
  userId
}: {
  supabase: any;
  userId: string;
}): Promise<LearningProfileRecord[]> {
  const { data, error } = await supabase
    .from('learning_profiles')
    .select(LEARNING_PROFILE_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('LEARNING PROFILES LIST ERROR:', error);
    return [];
  }

  return Array.isArray(data) ? (data as LearningProfileRecord[]) : [];
}

export async function clearLearningProfilesForUser({
  supabase,
  userId
}: {
  supabase: any;
  userId: string;
}) {
  return supabase.from('learning_profiles').delete().eq('user_id', userId);
}

export async function updateLearningProfileFromTurn({
  supabase,
  ai,
  model,
  userId,
  email,
  subject,
  audience,
  gradeLevel,
  mode,
  question,
  answer,
  existingProfile
}: {
  supabase: any;
  ai: any;
  model: string;
  userId: string;
  email: string;
  subject: SubjectKey | string;
  audience: string;
  gradeLevel: string;
  mode: string;
  question: string;
  answer: string;
  existingProfile: LearningProfileRecord | null;
}) {
  if (!userId || !email || !question.trim() || !answer.trim()) {
    return;
  }

  let draft: ProfileDraft = getFallbackDraft({
    subject: String(subject),
    audience,
    gradeLevel,
    question
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildProfileUpdatePrompt({
        existingProfile,
        subject: String(subject),
        audience,
        gradeLevel,
        mode,
        question,
        answer
      })
    });

    const rawText = response.text?.trim() || '';
    const parsed = extractJsonObject(rawText);

    if (parsed && typeof parsed === 'object') {
      draft = parsed as ProfileDraft;
    }
  } catch (error) {
    console.error('LEARNING PROFILE GENERATION ERROR:', error);
  }

  const nowIso = new Date().toISOString();

  const payload = {
    user_id: userId,
    email,
    subject,
    audience,
    grade_level: gradeLevel,
    profile_summary: cleanProfileText(draft.profile_summary),
    common_mistakes: cleanProfileText(draft.common_mistakes),
    weak_areas: cleanProfileText(draft.weak_areas),
    strengths: cleanProfileText(draft.strengths),
    preferred_style: cleanProfileText(draft.preferred_style),
    parent_guidance_notes: cleanProfileText(draft.parent_guidance_notes),
    last_observation: cleanProfileText(draft.last_observation),
    is_enabled: true,
    updated_at: nowIso
  };

  const { error } = await supabase
    .from('learning_profiles')
    .upsert(payload, { onConflict: 'user_id,subject,audience' });

  if (error) {
    console.error('LEARNING PROFILE UPSERT ERROR:', error);
  }
}