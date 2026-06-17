import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { StickyHeader } from "@/components/layout/sticky-header";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HeroDemo } from "@/components/landing/hero-demo";

// Lazy-load: only needed when Supabase OAuth drops ?code= on root
// Removes ~165KB Supabase client from the landing page bundle
const AuthCallbackRescue = dynamic(
  () =>
    import("@/components/auth-callback-rescue").then(
      (mod) => mod.AuthCallbackRescue
    ),
  { ssr: false }
);
import { Footer } from "@/components/footer";
import { LandingPricing } from "@/components/landing-pricing";
import IntegrationGrid from "@/components/landing/integration-grid";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import {
  Phone,
  Clock,
  ArrowRight,
  Contact,
  GitBranch,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AgentFlow — The CRM for agents who hate CRMs",
  description:
    "Dead-simple contact management and follow-up for solo real estate agents. No bloat. No learning curve. Just who to call today.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white" id="main-content">
      <AuthCallbackRescue />

      <StickyHeader />

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Centered text block */}
          <div className="text-center max-w-3xl mx-auto">
            <ScrollReveal variant="hero">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-bold text-surface-900 leading-[1.1] tracking-tight mb-6">
                The CRM for agents{" "}
                <span className="text-primary">who hate CRMs</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal variant="hero" delay={120}>
              <p className="text-lg sm:text-xl text-surface-500 mb-8 max-w-xl mx-auto leading-relaxed">
                Dead-simple contact management and follow-up for solo real estate
                agents. No bloat. No learning curve. Just who to call today.
              </p>
            </ScrollReveal>

            {/* Dual CTA */}
            <ScrollReveal variant="hero" delay={240}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto rounded-full">
                    Start for free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full">
                    See how it works
                  </Button>
                </a>
              </div>
            </ScrollReveal>

            {/* Trust signal */}
            <ScrollReveal variant="hero" delay={360}>
              <p className="text-sm text-surface-500">
                Free to start. No credit card required.
              </p>
            </ScrollReveal>
          </div>

          {/* Video demo — centered below text, frosted-glass container */}
          <ScrollReveal variant="hero" delay={180}>
            <HeroDemo />
          </ScrollReveal>
        </div>
      </section>

      {/* Integration Ecosystem Grid */}
      <IntegrationGrid />

      {/* Problem Section */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="section-heading mb-4">
              Every CRM you&apos;ve tried is overkill
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="section-subheading mb-12">
              Follow Up Boss at $69/mo. kvCORE at $100/mo. Features for teams of 50 when
              you&apos;re a solo agent doing 12 deals a year.
            </p>
          </ScrollReveal>
          <div className="space-y-6 text-left max-w-2xl mx-auto">
            {[
              {
                num: "01",
                title: "20-minute setup tax",
                desc: "Every time you open the app after a busy week, you face a mountain of missed tasks.",
              },
              {
                num: "02",
                title: "Built for teams",
                desc: "Complex automations, lead routing, ISA management — none of which you need.",
              },
              {
                num: "03",
                title: "Bad mobile experience",
                desc: "You work from your phone between showings. Your CRM should too.",
              },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={180 + i * 70}>
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-mono text-surface-300 mt-1 shrink-0">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-surface-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 section-alt">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="section-heading mb-4">
              Three things. That&apos;s it.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="section-subheading mb-12">
              AgentFlow does exactly what you need and nothing else.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Contact className="h-5 w-5" />,
                title: "Contacts",
                desc: "Name, phone, email, source. No custom fields. No tags taxonomy.",
                preview: (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100 text-left h-20 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">JD</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-900 truncate">Jane Doe</p>
                        <p className="text-[10px] text-surface-500 truncate">jane@email.com</p>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">Referral</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: <GitBranch className="h-5 w-5" />,
                title: "Pipeline",
                desc: "See where every lead stands. New → Contacted → Showing → Offer → Closed.",
                preview: (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100 text-left h-20 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-accent-700">TS</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-900 truncate">Tom Smith</p>
                        <p className="text-[10px] text-surface-500 truncate">Showing scheduled</p>
                      </div>
                    </div>
                    <div className="flex gap-1 overflow-hidden">
                      {["New", "Showing", "Closed"].map((stage, i) => (
                        <div key={i} className="flex-1 min-w-0">
                          <div className={`text-[9px] font-medium text-center py-1 rounded transition-colors ${i === 1 ? "bg-primary text-white feature-pipeline-active" : "bg-surface-100 text-surface-500"}`}>
                            {stage}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Daily Follow-up",
                desc: "Open the app. See who to call today. That's the whole app.",
                preview: (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100 text-left h-20 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-warning-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-warning-700">MC</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-900 truncate">Mike Chen</p>
                        <p className="text-[10px] text-surface-500 truncate">Follow up today</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-warning-50 text-warning-700 px-1.5 py-0.5 rounded">Overdue</span>
                      <div className="w-6 h-6 rounded bg-primary flex items-center justify-center feature-phone-pulse">
                        <Phone className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((item, i) => (
              <ScrollReveal key={i} variant="content" delay={200 + i * 120}>
                <div className="card-elevated text-left flex flex-col feature-card-hover hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4 shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-surface-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-surface-500 leading-relaxed flex-1">{item.desc}</p>
                  {item.preview}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 px-4 sm:px-6 section-alt">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="section-heading mb-4">
              Simple pricing
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="section-subheading mb-8">
              Less than one lunch per month. Zero guilt.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="conversion" delay={200}>
            <LandingPricing />
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="section-heading mb-4">
              Stop losing leads to bad tools
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="section-subheading mb-8">
              Join solo agents who actually use their CRM daily.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="conversion" delay={200}>
            <Link href="/signup">
              <Button size="lg">
                Start for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
