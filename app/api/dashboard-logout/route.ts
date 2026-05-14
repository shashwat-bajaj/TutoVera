import { NextRequest, NextResponse } from 'next/server';

import {
  DASHBOARD_COOKIE_NAME,
  getDashboardClearCookieOptions
} from '@/lib/dashboard-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/dashboard', request.url), {
    status: 303
  });

  response.cookies.set(DASHBOARD_COOKIE_NAME, '', getDashboardClearCookieOptions());

  return response;
}