import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { upsertProfileForUser } from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

function getSafeNext(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';

  return value;
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
      try {
        const userFromVerification = data.user;

        if (userFromVerification) {
          const adminSupabase = createAdminSupabase();

          await upsertProfileForUser({
            supabase: adminSupabase,
            user: userFromVerification
          });
        }
      } catch (profileError) {
        console.warn('PROFILE SYNC AFTER EMAIL CONFIRM FAILED:', profileError);
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_confirm_failed', origin));
}