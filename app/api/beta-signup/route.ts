import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, name = '', goal = '' } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    const { error } = await supabase.from('beta_signups').upsert(
      {
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        goal: goal?.trim() || null
      },
      { onConflict: 'email' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not save early access interest.' },
      { status: 500 }
    );
  }
}