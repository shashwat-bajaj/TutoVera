import { type NextRequest, NextResponse } from 'next/server';

import { upsertProfileForUser } from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

type AuthCallbackUser = {
  id?: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: unknown;
  };
  identities?: Array<{
    provider?: string;
    created_at?: string;
  }>;
};

function getSafeNext(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';

  return value;
}

function getAuthProvider(user: AuthCallbackUser) {
  const metadataProvider = user.app_metadata?.provider;

  if (typeof metadataProvider === 'string' && metadataProvider.trim()) {
    return metadataProvider.trim().toLowerCase();
  }

  const identityProvider = user.identities?.find((identity) => identity.provider)?.provider;

  if (identityProvider) {
    return identityProvider.trim().toLowerCase();
  }

  return 'oauth';
}

function getAuthMarker(user: AuthCallbackUser) {
  const stableUserPart = user.id || user.email || 'unknown-user';
  const signInPart = user.last_sign_in_at || new Date().toISOString();

  return `${stableUserPart}_${signInPart}`;
}

function buildTrackedRedirectUrl({
  next,
  origin,
  user
}: {
  next: string;
  origin: string;
  user: AuthCallbackUser;
}) {
  const redirectUrl = new URL(next, origin);
  const provider = getAuthProvider(user);

  redirectUrl.searchParams.set('auth_event', 'login_success');
  redirectUrl.searchParams.set('auth_method', provider);
  redirectUrl.searchParams.set('auth_flow', 'oauth');
  redirectUrl.searchParams.set('auth_marker', getAuthMarker(user));

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userFromSession = data.user as AuthCallbackUser | null;

      try {
        if (userFromSession) {
          const adminSupabase = createAdminSupabase();

          await upsertProfileForUser({
            supabase: adminSupabase,
            user: data.user
          });
        }
      } catch (profileError) {
        console.warn('PROFILE SYNC AFTER AUTH CALLBACK FAILED:', profileError);
      }

      if (userFromSession) {
        return NextResponse.redirect(
          buildTrackedRedirectUrl({
            next,
            origin,
            user: userFromSession
          })
        );
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}