import type { User } from '@supabase/supabase-js';

export type ProfileRecord = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const PROFILE_SELECT = [
  'id',
  'user_id',
  'email',
  'full_name',
  'username',
  'role',
  'created_at',
  'updated_at'
].join(', ');

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase();
}

function getMetadataName(user: User) {
  const metadata = user.user_metadata || {};

  return (
    cleanString(metadata.full_name) ||
    cleanString(metadata.name) ||
    cleanString(metadata.display_name) ||
    cleanString(metadata.username)
  );
}

function getMetadataUsername(user: User) {
  const metadata = user.user_metadata || {};

  return cleanString(metadata.username) || cleanString(metadata.display_name);
}

function getMetadataRole(user: User) {
  const role = cleanString(user.user_metadata?.tutovera_role).toLowerCase();

  if (role === 'parent') return 'parent';
  if (role === 'student-parent') return 'student-parent';
  return 'student';
}

export function getFallbackNameFromEmail(email: string | null | undefined) {
  const value = cleanEmail(email);

  if (!value || !value.includes('@')) return '';

  return value.split('@')[0].replace(/[._-]+/g, ' ').trim();
}

export function getProfileDisplayName({
  profile,
  user
}: {
  profile?: ProfileRecord | null;
  user?: User | null;
}) {
  const profileName =
    cleanString(profile?.full_name) ||
    cleanString(profile?.username);

  if (profileName) return profileName;

  if (user) {
    const metadataName = getMetadataName(user);

    if (metadataName) return metadataName;

    return getFallbackNameFromEmail(user.email);
  }

  return '';
}

export async function getProfileForUser({
  supabase,
  userId,
  email
}: {
  supabase: any;
  userId?: string | null;
  email?: string | null;
}): Promise<ProfileRecord | null> {
  const normalizedEmail = cleanEmail(email);

  if (userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as ProfileRecord;
    }
  }

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!error && data) {
      return data as ProfileRecord;
    }
  }

  return null;
}

export async function upsertProfileForUser({
  supabase,
  user
}: {
  supabase: any;
  user: User;
}) {
  const email = cleanEmail(user.email);

  if (!user.id || !email) {
    return null;
  }

  const fullName = getMetadataName(user) || getFallbackNameFromEmail(email);
  const username = getMetadataUsername(user) || null;
  const role = getMetadataRole(user);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        email,
        full_name: fullName || null,
        username,
        role,
        updated_at: now
      },
      { onConflict: 'user_id' }
    )
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    console.warn('Failed to upsert profile:', error.message);
    return null;
  }

  return data as ProfileRecord | null;
}