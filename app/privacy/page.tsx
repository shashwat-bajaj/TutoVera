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
              Last updated: May 2026
            </p>
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              TutoVera is a learning support product. This Privacy Policy explains what information
              may be collected, how it may be used, and how it may be handled when you use the
              platform.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Run the product</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Information may be used to operate the tutor, support sign-in, save sessions, process
              plan access, and keep TutoVera working reliably.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Improve learning</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Tutor activity and product usage may help improve explanations, reliability, subject
              workflows, and learning support over time.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>No sale of data</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              TutoVera does not sell personal information. Some providers process information only
              as needed to provide product services.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Information we may collect</h2>
          <p className="small" style={{ margin: 0 }}>
            Depending on how you use TutoVera, we may collect or process the following categories of
            information:
          </p>

          <div className="grid cols-3">
            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Account information</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                This may include your email address, name, username, account role, sign-in details,
                preferences, plan status, and related account information.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Tutor activity</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                This may include questions, messages, selected subject, grade level, tutor mode,
                parent support settings, tutor responses, saved conversations, and follow-up
                activity.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Uploaded content</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                If your plan supports uploads, this may include worksheet photos, screenshots, image
                metadata, and image-related tutor context.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Learning context</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                TutoVera may maintain limited internal learning context, such as patterns in study
                questions or weak areas, to make future tutor responses more personalized.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Billing metadata</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                For paid plans, this may include plan type, billing cycle, payment provider status,
                order or subscription identifiers, renewal state, and related billing records.
              </p>
            </div>

            <div className="card featureCard">
              <h3 style={{ marginTop: 0 }}>Technical information</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Limited request metadata may be processed for diagnostics, abuse prevention, rate
                limiting, security, reliability, analytics, and product performance.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>How information may be used</h2>
          <p className="small" style={{ margin: 0 }}>
            Information may be used to operate TutoVera, generate tutor responses, save and continue
            sessions, support account features, personalize future tutoring, process plan access,
            manage billing status, provide customer support, improve product quality, understand
            product usage, prevent abuse, protect security, debug issues, and comply with legal or
            operational obligations.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>AI processing</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera uses AI infrastructure to generate tutor responses and related study support.
            Content you submit may be processed by AI service providers to produce responses,
            analyze learning context, or support product functionality. AI-generated content may be
            incorrect or incomplete and should be reviewed before relying on it.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Saved sessions and personalization</h2>
          <p className="small" style={{ margin: 0 }}>
            If you are signed in or provide an email for history, TutoVera may save conversations and
            related session data so you can return to earlier work. TutoVera may also use limited
            internal learning context to help future tutor responses better match your learning
            needs. This internal personalization is intended to support learning, not to make formal
            academic, medical, psychological, or eligibility decisions.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Payments</h2>
          <p className="small" style={{ margin: 0 }}>
            Paid plans are processed through payment providers. TutoVera may receive and store
            payment-related metadata such as order IDs, subscription IDs, payment token IDs, plan
            status, renewal state, and billing events. TutoVera does not intentionally store full
            card numbers.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Third-party services and data sharing</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera does not sell personal information. The product may rely on third-party service
            providers for hosting, database, authentication, analytics, email, payment processing, AI
            infrastructure, security, and related operations. These providers may process information
            on behalf of TutoVera as needed to make the service available.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Children and student use</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is not intended for unsupervised use by children under 13. If the service is
            used by a minor or student, a parent, guardian, teacher, or responsible adult should
            decide whether the tool is appropriate for that context and supervise use where required.
          </p>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is not currently designed as a formal school-managed records system, official
            student records platform, or school district compliance environment.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.26}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Data retention</h2>
          <p className="small" style={{ margin: 0 }}>
            Account information, saved sessions, uploaded content, learning context, contact
            messages, beta/update submissions, billing records, technical logs, and related product
            data may be retained for service operation, account support, debugging, analytics,
            product improvement, legal compliance, fraud prevention, and service continuity.
          </p>
          <p className="small" style={{ margin: 0 }}>
            You may request deletion of certain account or product data by contacting support.
            Deletion may be limited where retention is required or reasonably needed for billing,
            security, legal, fraud prevention, backup, or operational purposes.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.28}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Your choices</h2>
          <p className="small" style={{ margin: 0 }}>
            You can manage your profile and default preferences from Settings, manage plan access
            from Account, and delete saved conversations where deletion controls are available. You
            may also contact support for privacy questions, data access questions, or deletion
            requests.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.3}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Security</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera uses technical and organizational measures intended to protect the service and
            user information. No online service, AI system, hosting provider, database, or
            transmission method can be guaranteed to be completely secure.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.32}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>International use</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may rely on service providers and infrastructure located in different regions.
            By using the service, information may be processed in locations where TutoVera or its
            service providers operate.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.34}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>California and other privacy rights</h2>
          <p className="small" style={{ margin: 0 }}>
            Depending on where you live and which privacy laws apply, you may have rights to request
            access, correction, deletion, or information about certain personal information. TutoVera
            will review privacy requests according to applicable law and the nature of the request.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.36}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Changes to this policy</h2>
          <p className="small" style={{ margin: 0 }}>
            This Privacy Policy may be updated from time to time as TutoVera changes. Continued use
            of the product after updates means you accept the revised policy.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.38}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Privacy questions</h2>
          <p className="small" style={{ margin: 0 }}>
            For privacy-related questions, feedback, or deletion requests, contact{' '}
            <a href="mailto:support@tutovera.com">
              <strong>support@tutovera.com</strong>
            </a>{' '}
            or use the contact page.
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