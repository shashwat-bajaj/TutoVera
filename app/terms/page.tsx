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
            <p className="small" style={{ margin: 0, maxWidth: 860 }}>
              These Terms of Use govern access to and use of TutoVera. By using the service, you
              agree to use it responsibly and accept these terms.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="grid cols-3">
          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Educational support</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              TutoVera helps users learn, practice, revise, and understand academic topics more
              clearly. It does not guarantee academic outcomes.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>AI limitations</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Tutor responses are generated with AI and may be incorrect, incomplete, or unsuitable
              for a particular assignment, class, or exam.
            </p>
          </div>

          <div className="card innerFeatureCard">
            <h3 style={{ marginTop: 0 }}>Plans and access</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              Paid plans renew automatically unless cancelled. Plan features, limits, and access
              rules may change as the product is maintained.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Educational support only</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is intended as a learning aid and educational support tool. It is not a school,
            university, accredited educational institution, professional tutoring guarantee, or
            official grading service. TutoVera does not guarantee correct answers, grades, academic
            performance, admissions outcomes, certification results, exam results, or any other
            educational result.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>AI-generated responses</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera uses artificial intelligence to generate tutor responses. AI-generated content
            may be inaccurate, incomplete, outdated, or unsuitable for a particular academic context.
            Users are responsible for checking important answers, methods, reasoning, calculations,
            citations, and conclusions before relying on them in coursework, assessments, teaching,
            tutoring, or other decisions.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.14}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Responsible use</h2>
          <p className="small" style={{ margin: 0 }}>
            You agree to use TutoVera lawfully, respectfully, and for its intended educational
            purpose. You may not misuse the service, overload or disrupt the platform, attempt to
            bypass plan limits or security controls, reverse engineer protected components, submit
            unlawful or harmful content, interfere with other users, or use the product in a way that
            violates applicable laws, rules, or policies.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.16}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Academic integrity</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is designed to support learning, not to help users cheat, misrepresent work, or
            violate academic rules. Users are responsible for following the academic integrity
            policies of their school, teacher, class, exam provider, or institution.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.18}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Accounts and sign-in</h2>
          <p className="small" style={{ margin: 0 }}>
            Some features require an account. You are responsible for maintaining access to your
            sign-in method and for activity that occurs through your account. If you believe your
            account has been accessed without permission, please contact support promptly.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Plans, billing, and renewals</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may offer free and paid plans. Paid plan features, usage limits, billing cycles,
            renewal behavior, cancellation handling, and account access may depend on the plan
            selected, account state, payment provider, and product configuration.
          </p>
          <p className="small" style={{ margin: 0 }}>
            Paid subscriptions renew automatically unless cancelled before the next renewal. Prices,
            features, usage limits, and plan names may change over time. If material changes are made
            to paid access, TutoVera may provide notice through the website, account area, email, or
            another reasonable method.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.22}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Cancellations</h2>
          <p className="small" style={{ margin: 0 }}>
            You may cancel future renewals from your Account page when cancellation is available for
            your active plan. When you cancel, your paid access generally remains available until the
            end of the current billing period, and you will not be charged again for that cancelled
            subscription.
          </p>
          <p className="small" style={{ margin: 0 }}>
            If you cannot access cancellation controls or believe your cancellation did not process
            correctly, please contact support at{' '}
            <a href="mailto:support@tutovera.com">
              <strong>support@tutovera.com</strong>
            </a>
            .
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.24}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Refund policy</h2>
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
            Approved refunds are returned to the original payment method through the payment
            processor when possible.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.26}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Usage limits and availability</h2>
          <p className="small" style={{ margin: 0 }}>
            Free and paid access may be subject to request limits, upload limits, technical
            restrictions, provider-side limitations, temporary suspension, admin controls, abuse
            prevention controls, and plan-specific usage rules. TutoVera may limit, interrupt, or
            suspend access when needed to protect reliability, security, compliance, or platform
            capacity.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.28}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>User content and saved sessions</h2>
          <p className="small" style={{ margin: 0 }}>
            Users may submit questions, learning materials, worksheet images, screenshots, messages,
            and related content while using TutoVera. TutoVera may process and store submitted
            content, tutor responses, saved session history, learning context, and related metadata
            as needed to operate the service, provide account features, improve product quality,
            support personalization, maintain reliability, and investigate misuse.
          </p>
          <p className="small" style={{ margin: 0 }}>
            You are responsible for the content you submit. Do not submit content that you do not
            have the right to use or share.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.3}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Children and student use</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera is not intended for unsupervised use by children under 13. If TutoVera is used
            by a minor or student, a parent, guardian, teacher, or responsible adult should decide
            whether the service is appropriate for that context and should supervise use where
            required.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.32}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Third-party services</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may rely on third-party providers for hosting, database, authentication,
            analytics, email, payment processing, AI infrastructure, and related product operations.
            These providers may process information as needed to make the service available. Payment
            details are handled by the payment provider; TutoVera does not intentionally store full
            card numbers.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.34}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Intellectual property</h2>
          <p className="small" style={{ margin: 0 }}>
            The site design, workflows, branding, interface elements, software, and original platform
            materials belong to TutoVera or its licensors. You may use the product for its intended
            educational purpose, but you may not copy, redistribute, resell, scrape, or commercially
            exploit protected parts of the platform without permission.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.36}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Service changes</h2>
          <p className="small" style={{ margin: 0 }}>
            TutoVera may add, change, limit, interrupt, remove, or discontinue features, workflows,
            plan access, limits, pricing, or parts of the service at any time. Continued use of the
            service after changes means you accept the service as changed.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.38}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Disclaimer of warranties</h2>
          <p className="small" style={{ margin: 0 }}>
            The service is provided on an “as is” and “as available” basis without warranties of any
            kind, whether express or implied, to the fullest extent permitted by law.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.4}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Limitation of liability</h2>
          <p className="small" style={{ margin: 0 }}>
            To the fullest extent permitted by law, TutoVera will not be liable for indirect,
            incidental, consequential, special, exemplary, punitive, or reliance-based damages arising
            from or related to the use of the service, inability to use the service, AI-generated
            responses, academic reliance, billing issues, or third-party provider behavior.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.42}>
        <section className="card" style={{ display: 'grid', gap: 14 }}>
          <h2 style={{ margin: 0 }}>Contact</h2>
          <p className="small" style={{ margin: 0 }}>
            For account, billing, refund, or terms-related questions, contact{' '}
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

      <Reveal delay={0.44}>
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