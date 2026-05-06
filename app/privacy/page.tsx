import Reveal from '@/components/Reveal';

export default function PrivacyPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Privacy Policy</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>How TutoVera handles information.</h1>
            <p className="small" style={{ margin: 0 }}>
              Last updated: April 2026
            </p>
            <p className="small" style={{ margin: 0, maxWidth: 840 }}>
              TutoVera is an evolving learning product. This Privacy Policy explains what
              information may be collected, how it may be used, and how it is handled while the
              platform continues to develop.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Product operation</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Some information is used to run the tutor, support sign-in, save sessions, and keep the
              product functioning normally.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Product improvement</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Usage patterns, submitted questions, tutor flows, and feedback may be reviewed to make
              TutoVera clearer, more reliable, and more useful over time.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Limited scope</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              TutoVera is an educational support product and is not presented as a formal student
              records system, official school platform, or guaranteed academic service.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Information we may collect</h2>
          <p className="small" style={{ margin: 0 }}>
            Depending on how the product is used, TutoVera may collect information such as:
          </p>

          <div className="grid cols-3">
            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Account details</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                This may include your email address and sign-in related account information when you
                create or use an account.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Tutor activity</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                This may include questions you submit, uploaded learning content, tutor responses,
                saved conversation history, selected modes, subject context, and related session data.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Technical information</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Limited request metadata may be processed for security, diagnostics, rate limiting,
                abuse prevention, reliability, and product performance.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>How information may be used</h2>
          <p className="small" style={{ margin: 0 }}>
            Submitted information may be used to operate the tutor, save session history, support
            account features, improve product quality, understand product usage, reduce abuse,
            diagnose technical issues, and help shape subject branches, tools, and workflows.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>AI-generated responses</h2>
          <p className="small" style={{ margin: 0 }}>
            Tutor responses are generated with artificial intelligence and may sometimes be incorrect,
            incomplete, or unsuitable for a particular academic setting. Important answers, methods,
            and conclusions should be reviewed and verified before being relied on.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Third-party services and data sharing</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera does not sell personal information. The product may rely on third-party service
            providers such as hosting, database, authentication, analytics, email, payment, and AI
            infrastructure providers that process information on behalf of the service in order to
            make the product available.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Data retention</h2>
          <p className="small" style={{ margin: 0 }}>
            Early access submissions, saved history, signup information, contact messages, and
            related product data may be retained for development, debugging, analytics, product
            improvement, and service continuity unless deletion is requested and technically
            feasible.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Children and student use</h2>
          <p className="small" style={{ margin: 0 }}>
            If the service is used by minors or students, a parent, guardian, teacher, or school
            should decide whether the tool is appropriate for that context. TutoVera is not currently
            designed as a formal school-managed records environment.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.26}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Privacy questions</h2>
          <p className="small" style={{ margin: 0 }}>
            For privacy-related questions, feedback, or deletion requests, please use the contact page
            as the product continues to expand.
          </p>

          <div className="buttonRow">
            <a className="btn secondary" href="/contact">
              Open Contact Page
            </a>
          </div>
        </section>
      </Reveal>
    </div>
  );
}