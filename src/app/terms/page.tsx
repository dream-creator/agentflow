import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — AgentFlow",
  description: "AgentFlow terms of service. Read the ground rules for using our app.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-surface-500 mb-8">
          Simple CRM for Solo Real Estate Agents
        </p>

        <div className="prose prose-surface max-w-none">
          <p className="text-surface-600 leading-relaxed">
            Welcome to AgentFlow! By creating an account and using our app, you agree to these
            simple ground rules. If you do not agree with them, please do not use the service.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            1. What AgentFlow Is (And Isn&apos;t)
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            AgentFlow is a software tool built to help solo real estate agents stay organized.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We provide tools for contact management, visual pipeline tracking, and follow-up
            reminders.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We are simply a productivity tool.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We do not provide real estate, legal, or financial advice.
          </p>
          <p className="text-surface-600 leading-relaxed">
            You are fully responsible for the business decisions you make while using our app.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            2. Your Account
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            To use AgentFlow, you need to set up an account.
          </p>
          <ul className="list-disc list-inside text-surface-600 space-y-1.5 mb-3 ml-4">
            <li>You must be a real person who is at least 18 years old.</li>
            <li>You must provide accurate information when signing up.</li>
            <li>
              You are responsible for keeping your password safe and for anything that happens
              under your account.
            </li>
            <li>Please do not share your login details or use bots to create accounts.</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            3. Simple Pricing
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We offer two straightforward plans:
          </p>

          {/* Pricing Table */}
          <div className="my-6 overflow-x-auto">
            <table className="w-full text-sm border border-surface-200 rounded-lg">
              <thead>
                <tr className="bg-surface-50">
                  <th className="text-left px-4 py-2.5 font-heading font-semibold text-surface-900 border-b border-surface-200">
                    Plan
                  </th>
                  <th className="text-left px-4 py-2.5 font-heading font-semibold text-surface-900 border-b border-surface-200">
                    Price
                  </th>
                  <th className="text-left px-4 py-2.5 font-heading font-semibold text-surface-900 border-b border-surface-200">
                    What&apos;s Included
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-surface-100">
                  <td className="px-4 py-2.5 text-surface-700">Free</td>
                  <td className="px-4 py-2.5 text-surface-700">$0 / mo</td>
                  <td className="px-4 py-2.5 text-surface-600">
                    10 active leads, 10 pipelines, daily email digest, AgentFlow branding.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-surface-700">Pro</td>
                  <td className="px-4 py-2.5 text-surface-700">$5 / mo</td>
                  <td className="px-4 py-2.5 text-surface-600">
                    Unlimited contacts &amp; pipelines, SMS reminders, custom branding,
                    priority support.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-surface-600 leading-relaxed mb-3">
            <strong className="text-surface-800">Billing &amp; Cancellations:</strong>
          </p>
          <ul className="list-disc list-inside text-surface-600 space-y-1.5 mb-3 ml-4">
            <li>
              You can cancel your Pro subscription at any time right from your settings.
            </li>
            <li>
              If you cancel, you will keep your Pro features until the end of your current
              billing month.
            </li>
            <li>
              After that, your account will simply drop down to the Free plan.
            </li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            4. Playing by the Rules
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We want AgentFlow to be a safe, effective tool for your business. When using our
            app, you must not:
          </p>
          <ul className="list-disc list-inside text-surface-600 space-y-1.5 mb-3 ml-4">
            <li>
              Break any privacy or anti-spam laws (like sending unsolicited spam emails).
            </li>
            <li>Harass anyone or try to hack our systems.</li>
            <li>Use the app for anything illegal.</li>
          </ul>
          <p className="text-surface-600 leading-relaxed">
            You are also completely responsible for making sure your use of AgentFlow complies
            with your local real estate regulations and fair housing laws.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            5. Your Data
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">Your data is yours.</p>
          <p className="text-surface-600 leading-relaxed mb-3">
            You maintain full ownership of all the contacts, notes, and pipeline data you put
            into AgentFlow.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We only access or store your data so that the app works for you.
          </p>
          <p className="text-surface-600 leading-relaxed">
            You can easily export your data as a CSV file at any time.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            6. Our Stuff
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            While you own your data, we own AgentFlow.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            The design, code, logos, and features of the app belong to us.
          </p>
          <p className="text-surface-600 leading-relaxed">
            Please do not try to copy, steal, or resell our software.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            7. Service Limits (The &quot;As-Is&quot; Clause)
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            We work hard to make AgentFlow reliable, but software is never perfect.
          </p>
          <p className="text-surface-600 leading-relaxed mb-3">
            We provide the app &quot;as is&quot; and cannot guarantee it will be 100% error-free
            or uninterrupted all the time.
          </p>
          <p className="text-surface-600 leading-relaxed">
            We are not legally or financially liable if a glitch causes you to lose a real estate
            lead, deal, or commission.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            8. Leaving Us
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            You can permanently delete your account and data at any time from your settings.
          </p>
          <p className="text-surface-600 leading-relaxed">
            On our end, we reserve the right to suspend or close your account if you break these
            rules, refuse to pay for a premium plan, or abandon a free account for over a year.
          </p>

          <h2 className="font-heading text-xl font-semibold text-surface-900 mt-10 mb-3">
            9. Contact Us
          </h2>
          <p className="text-surface-600 leading-relaxed mb-3">
            If you have any questions, need help, or want to report an issue, we are always here
            for you.
          </p>
          <p className="text-surface-600 leading-relaxed">
            <strong className="text-surface-800">Support:</strong>{" "}
            <a
              href="mailto:support@agent-flow.app"
              className="text-primary hover:underline"
            >
              support@agent-flow.app
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
