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
        <p className="text-sm text-surface-500 mb-8">
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
            payments, Resend for sending emails, Supabase for database hosting, and Cloudflare
            for bot protection on our sign-in and sign-up pages.
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
          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Bot protection cookie:</strong> When you
            visit our sign-in or sign-up page, Cloudflare sets a single cookie
            called <code className="bg-surface-100 px-1 rounded text-[13px]">__cf_bm</code> to
            help tell humans and automated traffic apart. It expires after 30 minutes of
            inactivity, contains no personally identifying information, and is required for
            the security of the form. See the next section for the full details.
          </p>
          <p className="text-surface-600 leading-relaxed">
            We absolutely do not use advertising cookies, tracking pixels, or behavioral
            profiling tools.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            7. Security &amp; Bot Protection (Cloudflare Turnstile)
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            To keep AgentFlow safe from automated abuse (bots, fake signups, brute-force
            password attempts, and credential stuffing), our sign-in and sign-up pages use{" "}
            <strong className="text-surface-800">Cloudflare Turnstile</strong> — a
            privacy-friendly CAPTCHA alternative that runs invisibly in the background on
            most modern browsers. You will not see a &quot;prove you are human&quot; puzzle.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            When you load a page protected by Turnstile, Cloudflare automatically receives:
          </p>
          <ul className="list-disc list-inside text-surface-600 space-y-1.5 mb-3 ml-4">
            <li>Your IP address</li>
            <li>Your browser type, operating system, and language</li>
            <li>Some basic browser configuration (cookies enabled, screen size, plugins)</li>
            <li>Behavior signals — only if a challenge is rendered, and never used to build a fingerprint of you</li>
            <li>A timestamp of the request</li>
          </ul>
          <p className="text-surface-600 leading-relaxed mb-3">
            Cloudflare uses these signals to decide whether the visitor looks human or
            automated, and returns a short-lived pass/fail token to us. We never see or store
            the raw signals above — only the pass/fail result, and only for the few seconds it
            takes to complete your sign-in or sign-up.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            The <code className="bg-surface-100 px-1 rounded text-[13px]">__cf_bm</code> cookie
            described in Section 6 is set by Cloudflare to keep its bot-detection consistent
            across page loads. We do not have access to its contents and we do not use it for
            analytics, advertising, or anything else.
          </p>
          <p className="text-surface-600 leading-relaxed">
            Cloudflare processes the data above under its own privacy policy, which we do
            not control. You can read it at{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              cloudflare.com/privacypolicy
            </a>
            . If you would rather not be evaluated by Turnstile, please email us at{" "}
            <a
              href="mailto:privacy@agent-flow.app"
              className="text-primary hover:underline"
            >
              privacy@agent-flow.app
            </a>{" "}
            and we will work with you on an alternative sign-in path.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            8. International Users &amp; Age Limits
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            AgentFlow operates out of the United States, meaning your data is processed there.
          </p>
          <p className="text-surface-600 leading-relaxed">
            Our app is built exclusively for adult professionals; you must be 18 or older to use
            it.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            9. Get In Touch
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            If you have any questions, concerns, or want to exercise your privacy rights, our
            team is always here to help:
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Email:</strong>{" "}
            <a
              href="mailto:privacy@agent-flow.app"
              className="text-primary hover:underline"
            >
              privacy@agent-flow.app
            </a>
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Website:</strong>{" "}
            <a
              href="https://agent-flow.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              agent-flow.app
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
