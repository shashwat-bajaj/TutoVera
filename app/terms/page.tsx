import Reveal from '@/components/Reveal';

export default function TermsPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <Reveal delay={0.02}>
        <section className="card spotlightCard" style={{ display: 'grid', gap: 14 }}>
          <span className="badge">Terms of Use</span>

          <div style={{ display: 'grid', gap: 10 }}>
            <h1 style={{ margin: 0 }}>Terms for using TutoVera.</h1>
            <p className="small" style={{ margin: 0 }}>
              Last updated: May 2026
            </p>
            <p className="small" style={{ margin: 0, maxWidth: 840 }}>
              These Terms of Use govern access to and use of TutoVera. By using the service, you
              agree to use it responsibly and accept these terms.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Educational support</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              TutoVera is designed to help users learn, revise, practice, and work through academic
              subjects more clearly. It does not guarantee outcomes.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Service updates</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Features, workflows, availability, limits, and access rules may change as the product
              is maintained and improved.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Responsible use</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Users are expected to use the service lawfully, respectfully, and without attempting to
              misuse, overload, or disrupt it.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Educational support only</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is intended as a learning aid and educational support tool. It does not
            guarantee correct answers, grading outcomes, academic performance, admission outcomes,
            certification results, or exam results.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>No professional or academic guarantee</h2>
          <p className="small" style={{ margin: 0 }}>
            The service is provided for informational and educational purposes only. Users are
            responsible for checking important answers, methods, reasoning, and conclusions before
            relying on them in coursework, assessments, tutoring, teaching, or other decisions.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>AI-generated responses</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera uses artificial intelligence to generate tutor responses. AI-generated content
            may be incorrect, incomplete, or unsuitable for a particular academic context. Users
            should review and verify important work before relying on it.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Acceptable use</h2>
          <p className="small" style={{ margin: 0 }}>
            You agree not to misuse the service, attempt to disrupt or overload the platform, submit
            harmful or unlawful content, reverse engineer protected components, bypass platform
            restrictions, interfere with security, or use the product in a way that violates
            applicable laws, rules, or policies.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Service changes</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may add, change, limit, interrupt, remove, or discontinue features, workflows,
            plan access, limits, or parts of the service at any time.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Usage limits</h2>
          <p className="small" style={{ margin: 0 }}>
            Free and paid access may be subject to request limits, technical restrictions, admin
            controls, provider-side limitations, temporary suspension, or plan-specific usage rules
            in order to protect reliability, prevent abuse, and manage platform capacity.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.26}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Accounts, plans, and billing</h2>
          <p className="small" style={{ margin: 0 }}>
            Some features may require an account or paid plan. Paid plan access, billing cycles,
            renewal behavior, cancellation handling, and payment processing may depend on the payment
            provider and the account state shown inside TutoVera.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.28}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Refunds and cancellations</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera subscriptions renew automatically unless cancelled. You may cancel future
            renewals from your Account page. When you cancel, your paid access remains available
            until the end of the current billing period, and you will not be charged again for that
            subscription.
          </p>
          <p className="small" style={{ margin: 0 }}>
            Subscription payments are generally non-refundable once a billing period has started,
            except where required by law. If you believe there was a billing error, duplicate charge,
            technical access issue, or other exceptional circumstance, please contact support at{' '}
            <a href="mailto:support@tutovera.com">
              <strong>support@tutovera.com</strong>
            </a>
            .
          </p>
          <p className="small" style={{ margin: 0 }}>
            Refund requests are reviewed case by case. If TutoVera approves a discretionary refund,
            the refund may be full or partial depending on the situation, account usage, timing of
            the request, and any non-recoverable payment processing costs, where permitted by law.
            Refunds, when issued, are returned to the original payment method through the payment
            processor.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.3}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>User content and saved sessions</h2>
          <p className="small" style={{ margin: 0 }}>
            Users may submit questions, learning materials, messages, and related content while using
            the product. TutoVera may process and store submitted content, tutor responses, and saved
            session history as needed to operate the service, support account features, improve the
            product, and maintain product reliability.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.32}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Intellectual property</h2>
          <p className="small" style={{ margin: 0 }}>
            The site design, workflows, branding, interface elements, and original platform materials
            belong to TutoVera or its licensors. You may use the product for its intended educational
            purpose, but you may not copy, redistribute, or commercially exploit protected parts of
            the platform without permission.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.34}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Third-party services</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may rely on third-party providers for hosting, database, authentication,
            analytics, email, payment, AI infrastructure, and related product operations. These
            providers may process information as needed to make the service available.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.36}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Disclaimer of warranties</h2>
          <p className="small" style={{ margin: 0 }}>
            The service is provided on an “as is” and “as available” basis without warranties of any
            kind, whether express or implied, to the fullest extent permitted by law.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.38}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Limitation of liability</h2>
          <p className="small" style={{ margin: 0 }}>
            To the fullest extent permitted by law, TutoVera will not be liable for indirect,
            incidental, consequential, special, exemplary, punitive, or reliance-based damages arising
            from or related to the use of the service.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.4}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Changes to these terms</h2>
          <p className="small" style={{ margin: 0 }}>
            These terms may be updated from time to time as TutoVera changes. Continued use of the
            product after updates means you accept the revised terms.
          </p>
        </section>
      </Reveal>
    </div>
  );
}