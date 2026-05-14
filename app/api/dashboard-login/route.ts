import { NextRequest, NextResponse } from 'next/server';

import {
  createDashboardToken,
  DASHBOARD_COOKIE_NAME,
  getDashboardCookieOptions,
  isDashboardConfigured,
  isValidDashboardPassword
} from '@/lib/dashboard-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get('password') || '');

  if (!isDashboardConfigured()) {
    return NextResponse.redirect(new URL('/dashboard?error=not_configured', request.url), {
      status: 303
    });
  }

  if (!isValidDashboardPassword(password)) {
    return NextResponse.redirect(new URL('/dashboard?error=invalid', request.url), {
      status: 303
    });
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url), {
    status: 303
  });

  response.cookies.set(DASHBOARD_COOKIE_NAME, createDashboardToken(), getDashboardCookieOptions());

  return response;
}