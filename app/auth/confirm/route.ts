import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { upsertProfileForUser } from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

type AuthConfirmUser = {
  id?: string;
  email?: string;
  created_at?: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
};

function getSafeNext(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';

  return value;
}

function getAuthMarker(user: AuthConfirmUser) {
  const stableUserPart = user.id || user.email || 'unknown-user';
  const confirmedPart =
    user.email_confirmed_at || user.confirmed_at || user.last_sign_in_at || user.created_at || '';

  return `${stableUserPart}_${confirmedPart || 'email-confirmed'}`;
}

function buildConfirmedSignupRedirectUrl({
  next,
  origin,
  user
}: {
  next: string;
  origin: string;
  user: AuthConfirmUser;
}) {
  const redirectUrl = new URL(next, origin);

  redirectUrl.searchParams.set('auth_event', 'signup_complete');
  redirectUrl.searchParams.set('auth_method', 'email');
  redirectUrl.searchParams.set('auth_flow', 'email_confirmation');
  redirectUrl.searchParams.set('auth_marker', getAuthMarker(user));

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = getSafeNext(searchParams.get('next'));

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash
    });

    if (!error) {
      const userFromVerification = data.user as AuthConfirmUser | null;

      try {
        if (data.user) {
          const adminSupabase = createAdminSupabase();

          await upsertProfileForUser({
            supabase: adminSupabase,
            user: data.user
          });
        }
      } catch (profileError) {
        console.warn('PROFILE SYNC AFTER EMAIL CONFIRM FAILED:', profileError);
      }

      if (userFromVerification) {
        return NextResponse.redirect(
          buildConfirmedSignupRedirectUrl({
            next,
            origin,
            user: userFromVerification
          })
        );
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_confirm_failed', origin));
}