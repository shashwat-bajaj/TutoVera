import crypto from 'node:crypto';

export const DASHBOARD_COOKIE_NAME = 'tutovera_dashboard_access';
export const DASHBOARD_SESSION_SECONDS = 60 * 60 * 8;

const DASHBOARD_TOKEN_PURPOSE = 'tutovera-dashboard-access-v1';

function getDashboardSecret() {
  return process.env.ADMIN_DASHBOARD_PASSWORD || '';
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isDashboardConfigured() {
  return Boolean(getDashboardSecret());
}

export function isValidDashboardPassword(password: string) {
  const expected = getDashboardSecret();

  if (!expected || !password) return false;

  return safeEqual(password, expected);
}

export function createDashboardToken() {
  const secret = getDashboardSecret();

  if (!secret) return '';

  return crypto
    .createHmac('sha256', secret)
    .update(DASHBOARD_TOKEN_PURPOSE)
    .digest('hex');
}

export function isValidDashboardToken(token: string | undefined | null) {
  const expectedToken = createDashboardToken();

  if (!expectedToken || !token) return false;

  return safeEqual(token, expectedToken);
}

export function getDashboardCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/dashboard',
    maxAge: DASHBOARD_SESSION_SECONDS
  };
}

export function getDashboardClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/dashboard',
    maxAge: 0
  };
}