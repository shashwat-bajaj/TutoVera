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
  const code = searchParams.get('code');
  const next = getSafeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        const userFromSession = data.user;

        if (userFromSession) {
          const adminSupabase = createAdminSupabase();

          await upsertProfileForUser({
            supabase: adminSupabase,
            user: userFromSession
          });
        }
      } catch (profileError) {
        console.warn('PROFILE SYNC AFTER AUTH CALLBACK FAILED:', profileError);
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}