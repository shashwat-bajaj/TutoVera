import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const parts = request.nextUrl.pathname.split('/').filter(Boolean);
    const conversationId = parts[parts.length - 1];

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required.' }, { status: 400 });
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    const supabase = createAdminSupabase();

    const { data: conversation, error: loadError } = await supabase
      .from('learner_conversations')
      .select('id, user_id, subject')
      .eq('id', conversationId)
      .single();

    if (loadError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this conversation.' },
        { status: 403 }
      );
    }

    const { error: turnsDeleteError } = await supabase
      .from('learner_sessions')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('subject', conversation.subject);

    if (turnsDeleteError) {
      return NextResponse.json({ error: turnsDeleteError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('learner_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .eq('subject', conversation.subject);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Delete failed.' },
      { status: 500 }
    );
  }
}