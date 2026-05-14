import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_GOAL_LENGTH = 2000;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const { email, name = '', goal = '' } = await request.json();

    const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanGoal = typeof goal === 'string' ? goal.trim() : '';

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (cleanEmail.length > MAX_EMAIL_LENGTH || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (cleanGoal.length > MAX_GOAL_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long. Please keep it under ${MAX_GOAL_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    const { error } = await supabase.from('beta_signups').upsert(
      {
        email: cleanEmail,
        name: cleanName || null,
        goal: cleanGoal || null
      },
      { onConflict: 'email' }
    );

    if (error) {
      console.error('UPDATE LIST SIGNUP ERROR:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'production'
              ? 'Could not save your interest right now. Please try again shortly.'
              : `Could not save update-list interest: ${error.message}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UPDATE LIST SIGNUP ROUTE ERROR:', error);

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'production'
            ? 'Could not save your interest right now. Please try again shortly.'
            : error instanceof Error
              ? `Could not save update-list interest: ${error.message}`
              : 'Could not save your interest right now. Please try again shortly.'
      },
      { status: 500 }
    );
  }
}