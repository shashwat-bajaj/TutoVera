import { cookies } from 'next/headers';

import RenderedContent from '@/components/RenderedContent';
import {
  DASHBOARD_COOKIE_NAME,
  isDashboardConfigured,
  isValidDashboardToken
} from '@/lib/dashboard-auth';
import { createAdminSupabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getDashboardErrorMessage(error: string | undefined) {
  if (error === 'invalid') {
    return 'That dashboard password was not correct.';
  }

  if (error === 'not_configured') {
    return 'The dashboard password is not configured yet.';
  }

  return '';
}

async function getTutorSessions() {
  const supabase = createAdminSupabase();

  return supabase
    .from('learner_sessions')
    .select('id, email, subject, mode, level, prompt, response, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
}

async function getUpdateListSignups() {
  const supabase = createAdminSupabase();

  return supabase
    .from('beta_signups')
    .select('id, name, email, goal, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
}

async function getContactMessages() {
  const supabase = createAdminSupabase();

  return supabase
    .from('contact_messages')
    .select('id, name, email, message, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = getDashboardErrorMessage(params.error);

  const cookieStore = await cookies();
  const dashboardToken = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value || '';
  const hasDashboardAccess = isValidDashboardToken(dashboardToken);

  if (!hasDashboardAccess) {
    return (
      <div className="grid" style={{ gap: 24 }}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Admin dashboard</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>TutoVera internal dashboard.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 760 }}>
              This page is restricted and is used to review recent update-list signups, contact
              messages, and tutor activity across active subject branches.
            </p>
          </div>

          <form
            method="POST"
            action="/api/dashboard-login"
            className="grid"
            style={{ gap: 12, maxWidth: 520 }}
          >
            <div>
              <label>Admin password</label>
              <input name="password" type="password" placeholder="Enter admin password" />
            </div>

            <div className="buttonRow">
              <button type="submit" disabled={!isDashboardConfigured()}>
                Open dashboard
              </button>
            </div>

            {errorMessage ? (
              <p className="small" style={{ margin: 0, color: 'var(--accent-warm)' }}>
                {errorMessage}
              </p>
            ) : null}

            {!isDashboardConfigured() ? (
              <p className="small" style={{ margin: 0, color: 'var(--accent-warm)' }}>
                ADMIN_DASHBOARD_PASSWORD is missing from the environment.
              </p>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                Dashboard access is stored in a secure browser cookie for this session.
              </p>
            )}
          </form>
        </section>
      </div>
    );
  }

  const [
    { data: sessions, error: sessionsError },
    { data: signups, error: signupsError },
    { data: messages, error: messagesError }
  ] = await Promise.all([getTutorSessions(), getUpdateListSignups(), getContactMessages()]);

  return (
    <div className="grid dashboardPage" style={{ gap: 24 }}>
      <section className="card spotlightCard dashboardOverviewCard">
        <div className="dashboardHeaderTop">
          <span className="badge">Admin dashboard</span>

          <form method="POST" action="/api/dashboard-logout">
            <button type="submit" className="secondary">
              Lock dashboard
            </button>
          </form>
        </div>

        <div className="dashboardHeaderCopy">
          <h1 style={{ margin: 0 }}>TutoVera internal overview.</h1>
          <p className="small" style={{ margin: 0 }}>
            Review recent update-list signups, contact messages, and tutor sessions across active
            TutoVera branches.
          </p>
        </div>
      </section>

      <section className="dashboardSummaryBlock" aria-label="Dashboard summary">
        <div className="dashboardSummaryCards">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Update-list signups</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              {signupsError
                ? 'Unable to load signups.'
                : `${signups?.length || 0} recent records loaded.`}
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Contact messages</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              {messagesError
                ? 'Unable to load messages.'
                : `${messages?.length || 0} recent records loaded.`}
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Tutor sessions</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              {sessionsError
                ? 'Unable to load sessions.'
                : `${sessions?.length || 0} recent records loaded.`}
            </p>
          </div>
        </div>
      </section>

      <section className="card dashboardFullWidthSection" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Recent update-list signups</h2>
          <p className="small" style={{ margin: 0 }}>
            People who joined the TutoVera updates list from the homepage form.
          </p>
        </div>

        {signupsError ? (
          <p className="small">Error loading update-list signups: {signupsError.message}</p>
        ) : !signups || signups.length === 0 ? (
          <p className="small">No update-list signups yet.</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            {signups.map((signup) => (
              <div key={signup.id} className="card innerFeatureCard">
                <p className="small">
                  <strong>Name:</strong> {signup.name || 'Not provided'}
                </p>
                <p className="small">
                  <strong>Email:</strong> {signup.email}
                </p>
                <p className="small">
                  <strong>Joined:</strong> {formatDate(signup.created_at)}
                </p>
                <p className="question-block">
                  <strong>Goal:</strong> {signup.goal || 'No goal provided'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card dashboardFullWidthSection" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Recent contact messages</h2>
          <p className="small" style={{ margin: 0 }}>
            Feedback, bug reports, product ideas, and general messages submitted through the contact
            page.
          </p>
        </div>

        {messagesError ? (
          <p className="small">Error loading contact messages: {messagesError.message}</p>
        ) : !messages || messages.length === 0 ? (
          <p className="small">No contact messages yet.</p>
        ) : (
          <div className="grid" style={{ gap: 16 }}>
            {messages.map((message) => (
              <div key={message.id} className="card innerFeatureCard">
                <p className="small">
                  <strong>Name:</strong> {message.name || 'Not provided'}
                </p>
                <p className="small">
                  <strong>Email:</strong> {message.email}
                </p>
                <p className="small">
                  <strong>Sent:</strong> {formatDate(message.created_at)}
                </p>
                <div className="card questionSurface">
                  <div className="question-block">{message.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card dashboardFullWidthSection" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Recent tutor sessions</h2>
          <p className="small" style={{ margin: 0 }}>
            Recent tutor requests across active subject branches. This helps review actual usage,
            response quality, subject coverage, and product needs.
          </p>
        </div>

        {sessionsError ? (
          <p className="small">Error loading tutor sessions: {sessionsError.message}</p>
        ) : !sessions || sessions.length === 0 ? (
          <p className="small">No tutor sessions yet.</p>
        ) : (
          <div className="grid" style={{ gap: 18 }}>
            {sessions.map((session) => (
              <div key={session.id} className="card innerFeatureCard">
                <p className="small">
                  <strong>Email:</strong> {session.email || 'Not provided'}
                </p>
                <p className="small">
                  <strong>Subject:</strong> {session.subject || 'unknown'} |{' '}
                  <strong>Mode:</strong> {session.mode} | <strong>Level:</strong> {session.level}
                </p>
                <p className="small">
                  <strong>Asked:</strong> {formatDate(session.created_at)}
                </p>

                <div className="grid" style={{ gap: 12 }}>
                  <div>
                    <h3>Question</h3>
                    <div className="card questionSurface">
                      <div className="question-block">{session.prompt}</div>
                    </div>
                  </div>

                  <div>
                    <h3>Answer</h3>
                    <div className="card answerSurface">
                      <RenderedContent content={session.response} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>
        {`
          .dashboardPage {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            width: 100%;
            max-width: 100%;
            clear: both;
          }

          .dashboardOverviewCard,
          .dashboardSummaryBlock,
          .dashboardFullWidthSection {
            grid-column: 1 / -1;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            clear: both;
            float: none;
          }

          .dashboardOverviewCard {
            display: grid;
            gap: 14px;
          }

          .dashboardHeaderTop {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 14px;
            align-items: center;
            width: 100%;
            min-width: 0;
          }

          .dashboardHeaderTop form {
            justify-self: end;
          }

          .dashboardHeaderCopy {
            display: grid;
            gap: 10px;
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }

          .dashboardHeaderCopy p {
            max-width: none !important;
            width: 100%;
          }

          .dashboardSummaryBlock {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
            padding-top: 10px;
            border-top: 1px solid var(--border);
          }

          .dashboardSummaryBlock + .dashboardFullWidthSection {
            margin-top: -4px;
          }

          .dashboardSummaryCards {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            width: 100%;
            max-width: 100%;
            align-items: stretch;
            justify-items: stretch;
            grid-column: 1 / -1;
          }

          .dashboardSummaryCards > .card {
            width: 100%;
            min-width: 0;
            float: none;
          }

          @media (max-width: 920px) {
            .dashboardSummaryCards {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .dashboardHeaderTop {
              grid-template-columns: 1fr;
            }

            .dashboardHeaderTop form {
              justify-self: start;
            }
          }
        `}
      </style>
    </div>
  );
}