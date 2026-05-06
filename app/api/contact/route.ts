import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const { name = '', email, message } = await request.json();

    const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (cleanEmail.length > MAX_EMAIL_LENGTH || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!cleanMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    const { error } = await supabase.from('contact_messages').insert({
      name: cleanName || null,
      email: cleanEmail,
      message: cleanMessage
    });

    if (error) {
      return NextResponse.json(
        { error: 'Could not send message right now. Please try again shortly.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Could not send message right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}