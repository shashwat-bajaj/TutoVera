import { type NextRequest, NextResponse } from 'next/server';

import { upsertProfileForUser } from '@/lib/profiles';
import { createAdminSupabase } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase/server';

type AuthCallbackUser = {
  id?: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: unknown;
  };
  identities?: Array<{
    provider?: string;
    created_at?: string;
  }>;
};

function getSafeNext(value: string | null) {
  if (!value) return '/account';

  if (!value.startsWith('/')) return '/account';
  if (value.startsWith('//')) return '/account';

  return value;
}

function getAuthProvider(user: AuthCallbackUser) {
  const metadataProvider = user.app_metadata?.provider;

  if (typeof metadataProvider === 'string' && metadataProvider.trim()) {
    return metadataProvider.trim().toLowerCase();
  }

  const identityProvider = user.identities?.find((identity) => identity.provider)?.provider;

  if (identityProvider) {
    return identityProvider.trim().toLowerCase();
  }

  return 'oauth';
}

function getAuthMarker(user: AuthCallbackUser) {
  const stableUserPart = user.id || user.email || 'unknown-user';
  const signInPart = user.last_sign_in_at || new Date().toISOString();

  return `${stableUserPart}_${signInPart}`;
}

function buildTrackedRedirectUrl({
  next,
  origin,
  user
}: {
  next: string;
  origin: string;
  user: AuthCallbackUser;
}) {
  const redirectUrl = new URL(next, origin);
  const provider = getAuthProvider(user);

  redirectUrl.searchParams.set('auth_event', 'login_success');
  redirectUrl.searchParams.set('auth_method', provider);
  redirectUrl.searchParams.set('auth_flow', 'oauth');
  redirectUrl.searchParams.set('auth_marker', getAuthMarker(user));

  return redirectUrl;
}

function buildAuthCompletionResponse({
  success,
  redirectUrl,
  errorMessage
}: {
  success: boolean;
  redirectUrl: URL;
  errorMessage?: string;
}) {
  const redirectTo = `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;

  const message = {
    type: 'tutovera-auth-complete',
    success,
    redirectTo,
    error: errorMessage || null
  };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TutoVera sign-in</title>
    <style>
      :root {
        color-scheme: dark;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background:
          radial-gradient(circle at 18% 8%, rgba(110, 166, 230, 0.13), transparent 26%),
          radial-gradient(circle at 84% 16%, rgba(17, 181, 166, 0.08), transparent 24%),
          linear-gradient(180deg, #031327, #061b35 46%, #031023);
        color: #f8fbff;
      }

      main {
        width: min(92vw, 460px);
        border: 1px solid rgba(207, 225, 247, 0.16);
        border-radius: 24px;
        padding: 24px;
        background: rgba(8, 27, 53, 0.88);
        box-shadow: 0 24px 58px rgba(0, 8, 24, 0.32);
      }

      h1 {
        margin: 0 0 10px;
        font-size: 1.35rem;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0;
        color: #d5e4f6;
        line-height: 1.6;
      }

      a {
        color: #11b5a6;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${success ? 'Sign-in complete.' : 'Sign-in could not be completed.'}</h1>
      <p id="message">
        ${
          success
            ? 'Returning you to TutoVera...'
            : 'Please close this tab and try signing in again from TutoVera.'
        }
      </p>
      <p style="margin-top: 14px;">
        <a href="${redirectUrl.toString()}">Continue to TutoVera</a>
      </p>
    </main>

    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        var redirectTo = ${JSON.stringify(redirectUrl.toString())};

        function updateMessage(text) {
          var messageNode = document.getElementById('message');
          if (messageNode) {
            messageNode.textContent = text;
          }
        }

        var hasOpener = false;

        try {
          hasOpener = Boolean(window.opener && !window.opener.closed);
        } catch (error) {
          hasOpener = false;
        }

        if (hasOpener) {
          try {
            window.opener.postMessage(message, window.location.origin);
          } catch (error) {}

          updateMessage('Sign-in complete. This tab should close automatically.');

          window.setTimeout(function () {
            window.close();
          }, 250);

          window.setTimeout(function () {
            updateMessage('Sign-in complete. You can close this tab and return to the original TutoVera tab.');
          }, 1200);

          return;
        }

        updateMessage('Sign-in complete. Redirecting back to TutoVera...');

        window.setTimeout(function () {
          window.location.replace(redirectTo);
        }, 500);
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNext(searchParams.get('next'));

  const fallbackRedirectUrl = new URL('/login?error=auth_callback_failed', origin);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const userFromSession = data.user as AuthCallbackUser | null;

      try {
        if (userFromSession) {
          const adminSupabase = createAdminSupabase();

          await upsertProfileForUser({
            supabase: adminSupabase,
            user: data.user
          });
        }
      } catch (profileError) {
        console.warn('PROFILE SYNC AFTER AUTH CALLBACK FAILED:', profileError);
      }

      if (userFromSession) {
        return buildAuthCompletionResponse({
          success: true,
          redirectUrl: buildTrackedRedirectUrl({
            next,
            origin,
            user: userFromSession
          })
        });
      }

      return buildAuthCompletionResponse({
        success: true,
        redirectUrl: new URL(next, origin)
      });
    }
  }

  return buildAuthCompletionResponse({
    success: false,
    redirectUrl: fallbackRedirectUrl,
    errorMessage: 'The sign-in callback failed.'
  });
}