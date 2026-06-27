import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Roommate Peace",
};

export default function TermsPage() {
  return (
    <article className="text-stone-900">
      <h1 className="text-3xl font-bold mb-1">Terms of Service</h1>
      <p className="text-sm text-stone-500 mb-2">
        <strong>Roommate Peace</strong> — Operated by iDaMar Labs LLC
      </p>
      <p className="text-sm text-stone-500 mb-8">Effective Date: June 20, 2026</p>

      <hr className="border-stone-200 mb-8" />

      <Section title="1. Acceptance of Terms">
        <p>
          By creating an account or using Roommate Peace (&ldquo;the App&rdquo;), you agree to these Terms of
          Service. If you do not agree, do not use the App.
        </p>
      </Section>

      <Section title="2. Who We Are">
        <p>
          Roommate Peace is operated by iDaMar Labs LLC, an Ohio limited liability company. References to
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo; refer to iDaMar Labs LLC.
        </p>
      </Section>

      <Section title="3. What the App Does">
        <p>
          Roommate Peace is a shared household accountability tool that helps roommates manage chores,
          bills, and house rules. It is not a financial institution, payment processor, or legal service.
          Any agreements made between roommates using the App are between those users — iDaMar Labs LLC
          is not a party to them.
        </p>
      </Section>

      <Section title="4. Eligibility">
        <p>
          You must be at least 18 years old to use the App. By using the App, you confirm that you meet
          this requirement.
        </p>
      </Section>

      <Section title="5. Your Account">
        <p>You are responsible for:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Keeping your login credentials secure</li>
          <li>All activity that occurs under your account</li>
          <li>Ensuring the information you provide is accurate</li>
        </ul>
        <p className="mt-3">
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>
      </Section>

      <Section title="6. Subscriptions and Payments">
        <p>
          Roommate Peace offers a free tier and a paid Premium plan. Payments are processed securely by
          Stripe. We do not store your credit card information.
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>Monthly plan:</strong> $7.99/month per household</li>
          <li><strong>Annual plan:</strong> $59.00/year per household</li>
        </ul>
        <p className="mt-3">
          Subscriptions renew automatically unless cancelled. You may cancel at any time through your
          account settings. No refunds are issued for partial billing periods.
        </p>
      </Section>

      <Section title="7. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Use the App for any unlawful purpose</li>
          <li>Harass, threaten, or harm other users</li>
          <li>Attempt to access another user&rsquo;s account or data</li>
          <li>Reverse engineer, copy, or redistribute any part of the App</li>
          <li>Use the App to store or transmit malicious code</li>
        </ul>
      </Section>

      <Section title="8. Household Data">
        <p>
          When you create a household and invite members, those members will have access to the
          household&rsquo;s chores, bills, and rules. You are responsible for who you invite. We are not
          responsible for disputes between household members arising from use of the App.
        </p>
      </Section>

      <Section title="9. Intellectual Property">
        <p>
          All content, design, and code in the App is owned by iDaMar Labs LLC. You may not copy,
          reproduce, or create derivative works without written permission.
        </p>
      </Section>

      <Section title="10. Disclaimer of Warranties">
        <p>
          The App is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that the
          App will be error-free, uninterrupted, or suitable for your specific needs.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          To the maximum extent permitted by Ohio law, iDaMar Labs LLC will not be liable for any
          indirect, incidental, special, or consequential damages arising from your use of the App,
          including disputes between roommates facilitated by the App.
        </p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>
          We may update these Terms at any time. We will notify you of material changes via email or an
          in-app notice. Continued use of the App after changes constitutes acceptance of the updated
          Terms.
        </p>
      </Section>

      <Section title="13. Governing Law">
        <p>
          These Terms are governed by the laws of the State of Ohio, without regard to conflict of law
          principles.
        </p>
      </Section>

      <Section title="14. Contact" last>
        <p>Questions about these Terms? Contact us at:</p>
        <p className="mt-3">
          <strong>iDaMar Labs LLC</strong>
          <br />
          Email:{" "}
          <a href="mailto:support@roommatepeace.com" className="text-emerald-600 hover:underline">
            support@roommatepeace.com
          </a>
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? "mb-0" : "mb-8"}>
      <h2 className="text-lg font-semibold text-stone-900 mb-3">{title}</h2>
      <div className="text-stone-700 text-sm leading-relaxed space-y-2">{children}</div>
      {!last && <hr className="border-stone-200 mt-8" />}
    </section>
  );
}
