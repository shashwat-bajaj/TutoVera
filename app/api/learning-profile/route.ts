import { NextRequest, NextResponse } from 'next/server';

import {
  clearLearningProfilesForUser,
  getLearningProfilesForUser
} from '@/lib/learning-profile';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient as createAuthClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to view your Learning Profile.' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabase();
    const profiles = await getLearningProfilesForUser({
      supabase,
      userId: user.id
    });

    return NextResponse.json({
      profiles
    });
  } catch (error) {
    console.error('LEARNING PROFILE GET ERROR:', error);

    return NextResponse.json(
      { error: 'Could not load Learning Profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to clear your Learning Profile.' },
        { status: 401 }
      );
    }

    const supabase = createAdminSupabase();
    const { error } = await clearLearningProfilesForUser({
      supabase,
      userId: user.id
    });

    if (error) {
      console.error('LEARNING PROFILE DELETE ERROR:', error);
      return NextResponse.json(
        { error: 'Could not clear Learning Profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('LEARNING PROFILE DELETE ROUTE ERROR:', error);

    return NextResponse.json(
      { error: 'Could not clear Learning Profile.' },
      { status: 500 }
    );
  }
}