import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const parts = request.nextUrl.pathname.split('/').filter(Boolean);
    const turnId = parts[parts.length - 1];

    if (!turnId) {
      return NextResponse.json({ error: 'Turn ID is required.' }, { status: 400 });
    }

    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    const supabase = createAdminSupabase();

    const { data: turn, error: turnError } = await supabase
      .from('learner_sessions')
      .select('id, conversation_id, subject, turn_index')
      .eq('id', turnId)
      .single();

    if (turnError || !turn) {
      return NextResponse.json({ error: 'Follow-up not found.' }, { status: 404 });
    }

    if ((turn.turn_index || 0) <= 1) {
      return NextResponse.json(
        { error: 'The initial question can only be removed by deleting the whole conversation.' },
        { status: 400 }
      );
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('learner_conversations')
      .select('id, user_id, subject')
      .eq('id', turn.conversation_id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this follow-up.' },
        { status: 403 }
      );
    }

    if (conversation.subject !== turn.subject) {
      return NextResponse.json(
        { error: 'Follow-up subject does not match the conversation subject.' },
        { status: 409 }
      );
    }

    const { error: deleteError } = await supabase
      .from('learner_sessions')
      .delete()
      .eq('id', turnId)
      .eq('conversation_id', turn.conversation_id)
      .eq('subject', turn.subject);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await supabase
      .from('learner_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', turn.conversation_id)
      .eq('user_id', user.id)
      .eq('subject', turn.subject);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Delete failed.' },
      { status: 500 }
    );
  }
}