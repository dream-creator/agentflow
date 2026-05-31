import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCallbackRescue } from "@/components/auth-callback-rescue";
import {
  Phone,
  Users,
  Clock,
  Smartphone,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "AgentFlow — The CRM for agents who hate CRMs",
  description:
    "Dead-simple contact management and follow-up for solo real estate agents. No automations. No dashboards. Just who to call today.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* OAuth PKCE rescue — redirects ?code= to /auth/callback */}
      <Suspense fallback={null}>
        <AuthCallbackRescue />
      </Suspense>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-surface-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="font-heading text-lg font-bold text-surface-900">AgentFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900">
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 leading-tight mb-6">
            The CRM for agents
            <br />
            <span className="text-primary">who hate CRMs</span>
          </h1>
          <p className="text-lg sm:text-xl text-surface-500 mb-8 max-w-xl mx-auto">
            Dead-simple contact management and follow-up for solo real estate
            agents. No automations. No dashboards. Just who to call today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-surface-400 mt-4">
            Free plan includes 1 lead. No credit card required.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-surface-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-surface-500 text-sm">
            Trusted by solo agents closing 5–20 deals per year
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-surface-900 mb-4">
            Every CRM you&apos;ve tried is overkill
          </h2>
          <p className="text-surface-500 text-lg mb-8 max-w-xl mx-auto">
            Follow Up Boss at $69/mo. kvCORE at $100/mo. Features for teams of 50 when
            you&apos;re a solo agent doing 12 deals a year.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: <Clock className="h-5 w-5" />,
                title: "20-minute setup tax",
                desc: "Every time you open the app after a busy week, you face a mountain of missed tasks.",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Built for teams",
                desc: "Complex automations, lead routing, ISA management — none of which you need.",
              },
              {
                icon: <Smartphone className="h-5 w-5" />,
                title: "Bad mobile experience",
                desc: "You work from your phone between showings. Your CRM should too.",
              },
            ].map((item, i) => (
              <div key={i} className="p-4">
                <div className="w-10 h-10 rounded-lg bg-destructive-50 text-destructive flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="font-heading font-semibold text-surface-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-surface-900 mb-4">
            Three things. That&apos;s it.
          </h2>
          <p className="text-surface-500 text-lg mb-12 max-w-xl mx-auto">
            AgentFlow does exactly what you need and nothing else.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Phone className="h-5 w-5" />,
                title: "Contacts",
                desc: "Name, phone, email, source. No custom fields. No tags taxonomy.",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Pipeline",
                desc: "See where every lead stands. New → Contacted → Showing → Offer → Closed.",
              },
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Daily Follow-up",
                desc: "Open the app. See who to call today. That's the whole app.",
              },
            ].map((item, i) => (
              <div key={i} className="card text-left">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="font-heading font-semibold text-surface-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-surface-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-surface-500 text-lg mb-12">
            Less than one lunch per month. Zero guilt.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="card text-left">
              <h3 className="font-heading text-lg font-semibold text-surface-900 mb-1">Free</h3>
              <div className="text-3xl font-bold text-surface-900 mb-4">$0</div>
              <ul className="space-y-2 mb-6">
                {["1 active lead", "1 pipeline", "Daily email digest"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="secondary" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
            <div className="card text-left border-2 border-primary relative">
              <div className="absolute -top-3 left-4 bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-pill">
                Most popular
              </div>
              <h3 className="font-heading text-lg font-semibold text-surface-900 mb-1">Pro</h3>
              <div className="text-3xl font-bold text-surface-900 mb-4">
                $19<span className="text-sm font-normal text-surface-500">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {[
                  "Unlimited leads",
                  "Unlimited pipelines",
                  "Custom branding",
                  "SMS reminders",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full">Start Pro trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-surface-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Stop losing leads to bad tools
          </h2>
          <p className="text-surface-400 text-lg mb-8 max-w-xl mx-auto">
            Join solo agents who actually use their CRM daily.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-surface-900 hover:bg-surface-100">
              Start for free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-surface-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">AF</span>
            </div>
            <span className="text-sm text-surface-500">AgentFlow</span>
          </div>
          <p className="text-xs text-surface-400">
            &copy; {new Date().getFullYear()} AgentFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
