import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — AgentFlow",
  description: "AgentFlow privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl font-bold text-surface-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-surface-400 mb-8">
          Simple CRM for Solo Real Estate Agents
        </p>

        <div className="prose prose-surface max-w-none">
          <p className="text-surface-600 leading-relaxed">
            At AgentFlow, keeping your data and your clients&apos; data safe is a top priority.
            This policy explains exactly what we collect, why we need it, and how you stay in
            control. By creating an account, you agree to these simple practices.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            1. The Information We Collect
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">What you give us directly:</strong> We collect
            your name, email address, and the name of your brokerage when you sign up.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Your client data:</strong> This includes the
            names, phone numbers, emails, notes, and pipeline stages of your leads. This data
            belongs entirely to you.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Payment details:</strong> If you subscribe to a
            paid plan, Stripe processes your payments. We never store your full credit card
            number — only the last four digits and basic billing details.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Background data:</strong> We automatically log
            basic usage details like your IP address, browser type, and how long you use the app
            to keep things running smoothly.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Optional integrations:</strong> If you choose to
            connect Google Contacts, we only request read-only access while syncing and do not
            store ongoing access tokens once your session is done.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            2. How We Use Your Data
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We only use your information to make AgentFlow work well for you. Specifically, we
            use it to:
          </p>
          <ul className="list-disc list-inside text-surface-600 space-y-1.5 mb-3 ml-4">
            <li>Run the platform and process your subscription payments.</li>
            <li>Send you your daily follow-up digest emails and SMS reminders.</li>
            <li>Help you out when you contact support.</li>
            <li>Keep the platform secure, monitor for errors, and fix bugs.</li>
          </ul>
          <p className="text-surface-600 leading-relaxed">
            We will never send you promotional or marketing emails without your explicit
            permission.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            3. Who We Share Data With (And Who We Don&apos;t)
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We never sell, rent, or trade your personal data or your clients&apos; data.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We only share data with trusted partners who help us run the app, such as Stripe for
            payments, Resend for sending emails, and Supabase for database hosting.
          </p>
          <p className="text-surface-600 leading-relaxed">
            We may also disclose information if legally required to do so by a court order, or if
            our company undergoes a business transfer like a merger or sale.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            4. Keeping Your Data Safe
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We protect your data using industry-standard encryption, both while it is traveling
            over the internet and while it is stored in our databases.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            Access to the app is secured via email magic links or Google logins.
          </p>
          <p className="text-surface-600 leading-relaxed">
            While we work hard to protect your information, no electronic system is 100% perfect,
            so we cannot guarantee absolute security against unauthorized access.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            5. Data Retention &amp; Your Rights
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Keeping your data:</strong> We hold onto your
            account data and contacts for as long as you are actively using AgentFlow.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Leaving us:</strong> If you choose to delete
            your account, we will erase or irreversibly anonymize your personal data within 30
            days.
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Your control:</strong> You can always access,
            correct, or request deletion of your data, and you can export all your contacts as a
            CSV file at any time right from the app.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            6. Cookies and Tracking
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We only use &quot;essential&quot; cookies that keep you logged in and save your
            simple preferences, like whether you prefer a list or kanban view.
          </p>
          <p className="text-surface-600 leading-relaxed">
            We absolutely do not use advertising cookies, tracking pixels, or behavioral
            profiling tools.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            7. International Users &amp; Age Limits
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            AgentFlow operates out of the United States, meaning your data is processed there.
          </p>
          <p className="text-surface-600 leading-relaxed">
            Our app is built exclusively for adult professionals; you must be 18 or older to use
            it.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            8. Get In Touch
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            If you have any questions, concerns, or want to exercise your privacy rights, our
            team is always here to help:
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Email:</strong>{" "}
            <a
              href="mailto:privacy@agentflow.app"
              className="text-primary hover:underline"
            >
              privacy@agentflow.app
            </a>
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Website:</strong>{" "}
            <a
              href="https://agentflow.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              agentflow.app
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
