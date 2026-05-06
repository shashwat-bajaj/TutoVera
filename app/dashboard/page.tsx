import { createAdminSupabase } from '@/lib/supabase-admin';
import RenderedContent from '@/components/RenderedContent';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

async function getTutorSessions() {
  const supabase = createAdminSupabase();

  return supabase
    .from('learner_sessions')
    .select('id, email, subject, mode, level, prompt, response, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
}

async function getEarlyAccessSignups() {
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
  searchParams: Promise<{ password?: string }>;
}) {
  const params = await searchParams;
  const password = params.password || '';
  const expected = process.env.ADMIN_DASHBOARD_PASSWORD || '';

  if (!expected || password !== expected) {
    return (
      <div className="grid" style={{ gap: 24 }}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Admin dashboard</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>TutoVera internal dashboard.</h1>
            <p className="small" style={{ margin: 0, maxWidth: 760 }}>
              This page is restricted and is used to review recent early access signups, contact
              messages, and tutor activity across active subject branches.
            </p>
          </div>

          <form method="GET" className="grid" style={{ gap: 12, maxWidth: 520 }}>
            <div>
              <label>Admin password</label>
              <input name="password" type="password" placeholder="Enter admin password" />
            </div>

            <div className="buttonRow">
              <button type="submit">Open dashboard</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  const [
    { data: sessions, error: sessionsError },
    { data: signups, error: signupsError },
    { data: messages, error: messagesError }
  ] = await Promise.all([getTutorSessions(), getEarlyAccessSignups(), getContactMessages()]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
        <span className="badge">Admin dashboard</span>

        <div style={{ display: 'grid', gap: 10 }}>
          <h1 style={{ margin: 0 }}>TutoVera internal overview.</h1>
          <p className="small" style={{ margin: 0, maxWidth: 820 }}>
            Review recent platform activity across early access signups, contact messages, and tutor
            sessions for Math, Physics, Chemistry, Biology, and future branches.
          </p>
        </div>
      </section>

      <section className="grid cols-3">
        <div className="card innerFeatureCard">
          <h3 style={{ marginTop: 0 }}>Early access signups</h3>
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
      </section>

      <section className="card" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>Recent early access signups</h2>
          <p className="small" style={{ margin: 0 }}>
            People who joined the TutoVera early access list from the homepage interest form.
          </p>
        </div>

        {signupsError ? (
          <p className="small">Error loading early access signups: {signupsError.message}</p>
        ) : !signups || signups.length === 0 ? (
          <p className="small">No early access signups yet.</p>
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

      <section className="card" style={{ display: 'grid', gap: 16 }}>
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

      <section className="card" style={{ display: 'grid', gap: 16 }}>
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
    </div>
  );
}