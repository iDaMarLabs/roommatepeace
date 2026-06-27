import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Roommate Peace",
};

export default function PrivacyPage() {
  return (
    <article className="text-stone-900">
      <h1 className="text-3xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-sm text-stone-500 mb-2">
        <strong>Roommate Peace</strong> — Operated by iDaMar Labs LLC
      </p>
      <p className="text-sm text-stone-500 mb-8">Effective Date: June 20, 2026</p>

      <hr className="border-stone-200 mb-8" />

      <Section title="1. Overview">
        <p>
          iDaMar Labs LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates Roommate Peace. This Privacy Policy
          explains what data we collect, how we use it, and your rights regarding that data.
        </p>
      </Section>

      <Section title="2. What We Collect">
        <p className="font-medium text-stone-900">Information you provide directly:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Name and email address (at signup)</li>
          <li>Household name</li>
          <li>Chores, bills, house rules, and related content you enter</li>
          <li>Payment method (processed by Stripe — we never see your card details)</li>
        </ul>

        <p className="font-medium text-stone-900 mt-4">Information collected automatically:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>IP address and browser type</li>
          <li>Pages visited and features used within the App</li>
          <li>Device type and operating system</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We use your data to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Create and maintain your account</li>
          <li>Provide App features (chore board, bills tracker, house rules)</li>
          <li>Send transactional emails (confirmations, reminders, bill nudges) via Resend</li>
          <li>Process subscription payments via Stripe</li>
          <li>Improve the App based on usage patterns</li>
        </ul>
        <p className="mt-3">We do not sell your data. We do not use your data for advertising.</p>
      </Section>

      <Section title="4. Data Shared Within Your Household">
        <p>When you join or create a household, other household members can see:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Your name and avatar initials</li>
          <li>Chores assigned to you and your completion status</li>
          <li>Your bill shares and payment status</li>
          <li>House rules and your acknowledgements</li>
        </ul>
        <p className="mt-3">
          This is core to how the App works. Only invite people you trust.
        </p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>We use the following third-party services:</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm border border-stone-200 rounded-lg">
            <thead>
              <tr className="bg-stone-50">
                <th className="text-left px-3 py-2 font-medium text-stone-700 border-b border-stone-200">Service</th>
                <th className="text-left px-3 py-2 font-medium text-stone-700 border-b border-stone-200">Purpose</th>
                <th className="text-left px-3 py-2 font-medium text-stone-700 border-b border-stone-200">Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase", "Database and authentication", "supabase.com/privacy"],
                ["Stripe", "Payment processing", "stripe.com/privacy"],
                ["Resend", "Transactional email", "resend.com/privacy"],
                ["Vercel", "App hosting", "vercel.com/legal/privacy-policy"],
              ].map(([service, purpose, policy], i, arr) => (
                <tr key={service} className={i < arr.length - 1 ? "border-b border-stone-200" : ""}>
                  <td className="px-3 py-2 font-medium text-stone-900">{service}</td>
                  <td className="px-3 py-2 text-stone-600">{purpose}</td>
                  <td className="px-3 py-2 text-stone-500">{policy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Each of these services has its own privacy policy governing how they handle your data.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain your account data for as long as your account is active. If you delete your account,
          your personal data is deleted within 30 days. Household data shared with other members may
          persist in their records until they delete it.
        </p>
      </Section>

      <Section title="7. Security">
        <p>We use industry-standard security measures including:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Encrypted connections (HTTPS)</li>
          <li>Row-level security on all database records (users can only access their own household data)</li>
          <li>No storage of payment credentials</li>
        </ul>
        <p className="mt-3">No system is 100% secure. Use a strong, unique password for your account.</p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          Roommate Peace is not intended for users under 18. We do not knowingly collect data from
          minors. If you believe a minor has created an account, contact us and we will delete it
          promptly.
        </p>
      </Section>

      <Section title="9. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Withdraw consent for email communications (unsubscribe link in every email)</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, email us at{" "}
          <a href="mailto:support@roommatepeace.com" className="text-emerald-600 hover:underline">
            support@roommatepeace.com
          </a>
          .
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes
          via email or in-app notice. Continued use of the App after changes constitutes acceptance of
          the updated Policy.
        </p>
      </Section>

      <Section title="11. Contact" last>
        <p>
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
