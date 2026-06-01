import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCallbackRescue } from "@/components/auth-callback-rescue";
import { StickyHeader } from "@/components/layout/sticky-header";
import { Footer } from "@/components/footer";
import { LandingPricing } from "@/components/landing-pricing";
import {
  Phone,
  Users,
  Clock,
  Smartphone,
  Star,
  ArrowRight,
  CheckCircle2,
  CalendarX,
  UsersRound,
  Contact,
  GitBranch,
  CalendarCheck,
  Upload,
  FolderOpen,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AgentFlow — The CRM for agents who hate CRMs",
  description:
    "Dead-simple contact management and follow-up for solo real estate agents. No automations. No dashboards. Just who to call today.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Suspense fallback={null}>
        <AuthCallbackRescue />
      </Suspense>

      <StickyHeader />

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-bold text-surface-900 leading-[1.1] tracking-tight mb-6">
                The CRM for agents{" "}
                <span className="text-primary">who hate CRMs</span>
              </h1>
              <p className="text-lg sm:text-xl text-surface-500 mb-8 max-w-xl leading-relaxed">
                Dead-simple contact management and follow-up for solo real estate
                agents. No automations. No dashboards. Just who to call today.
              </p>

              {/* Dual CTA */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start for free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    See how it works
                  </Button>
                </a>
              </div>

              {/* Avatar stack + social proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white bg-primary-100 flex items-center justify-center"
                    >
                      <span className="text-xs font-semibold text-primary-700">
                        {["S", "M", "J", "A"][i - 1]}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-surface-500">
                  <span className="font-semibold text-surface-700">47+</span> solo agents already using AgentFlow
                </p>
              </div>
            </div>

            {/* Right: Product Mockup */}
            <div className="relative">
              <div className="bg-surface-50 rounded-2xl border border-surface-200 p-1 shadow-elevated">
                {/* Browser chrome */}
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-surface-200" />
                      <div className="w-3 h-3 rounded-full bg-surface-200" />
                      <div className="w-3 h-3 rounded-full bg-surface-200" />
                    </div>
                    <div className="flex-1 text-center">
                      <div className="inline-block bg-surface-100 rounded-md px-3 py-1 text-xs text-surface-400">
                        app.agentflow.app/dashboard
                      </div>
                    </div>
                  </div>

                  {/* App UI Mockup - Today's Follow-ups */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-surface-900">Today&apos;s Follow-ups</h3>
                        <p className="text-sm text-surface-400">3 contacts due today</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <CalendarCheck className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    {/* Contact card mockup */}
                    <div className="space-y-3">
                      {[
                        { name: "Sarah Chen", stage: "Showing", time: "10:00 AM", color: "bg-primary" },
                        { name: "Marcus Johnson", stage: "New Lead", time: "2:30 PM", color: "bg-accent" },
                        { name: "Emily Rodriguez", stage: "Offer", time: "4:00 PM", color: "bg-amber-500" },
                      ].map((contact, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-surface-100 hover:border-primary-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${contact.color} bg-opacity-10 flex items-center justify-center`}>
                              <span className={`text-sm font-semibold ${contact.color === "bg-primary" ? "text-primary" : contact.color === "bg-accent" ? "text-accent" : "text-amber-600"}`}>
                                {contact.name.split(" ").map(n => n[0]).join("")}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900">{contact.name}</p>
                              <p className="text-xs text-surface-400">{contact.stage}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-surface-400">{contact.time}</span>
                            <button className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-700 transition-colors">
                              <Phone className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-surface-100 shadow-elevated px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">Follow-up complete</p>
                  <p className="text-xs text-surface-400">Sarah Chen — 2 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "47+", label: "Solo agents" },
              { value: "2,400+", label: "Leads tracked" },
              { value: "98%", label: "Follow-up rate" },
              { value: "3 min", label: "Daily setup" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="font-heading text-2xl sm:text-3xl font-bold text-surface-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading mb-4">
            Every CRM you&apos;ve tried is overkill
          </h2>
          <p className="section-subheading mb-12">
            Follow Up Boss at $69/mo. kvCORE at $100/mo. Features for teams of 50 when
            you&apos;re a solo agent doing 12 deals a year.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: <CalendarX className="h-5 w-5" />,
                title: "20-minute setup tax",
                desc: "Every time you open the app after a busy week, you face a mountain of missed tasks.",
              },
              {
                icon: <UsersRound className="h-5 w-5" />,
                title: "Built for teams",
                desc: "Complex automations, lead routing, ISA management — none of which you need.",
              },
              {
                icon: <Smartphone className="h-5 w-5" />,
                title: "Bad mobile experience",
                desc: "You work from your phone between showings. Your CRM should too.",
              },
            ].map((item, i) => (
              <div key={i} className="card-elevated text-left">
                <div className="w-10 h-10 rounded-lg bg-destructive-50 text-destructive flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading font-semibold text-surface-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 section-alt">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading mb-4">
            Three things. That&apos;s it.
          </h2>
          <p className="section-subheading mb-12">
            AgentFlow does exactly what you need and nothing else.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Contact className="h-5 w-5" />,
                title: "Contacts",
                desc: "Name, phone, email, source. No custom fields. No tags taxonomy.",
                preview: (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">JD</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-surface-900">Jane Doe</p>
                        <p className="text-[10px] text-surface-400">jane@email.com</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100">
                    <div className="flex gap-1 overflow-hidden">
                      {["New", "Contact", "Showing", "Offer", "Closed"].map((stage, i) => (
                        <div key={i} className="flex-1 min-w-0">
                          <div className={`text-[9px] font-medium text-center py-1 rounded ${i === 1 ? "bg-primary text-white" : "bg-surface-100 text-surface-500"}`}>
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
                  <div className="mt-4 p-3 bg-white rounded-lg border border-surface-100 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-amber-700">MC</span>
                        </div>
                        <span className="text-xs font-medium text-surface-900">Mike Chen</span>
                      </div>
                      <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                        <Phone className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                ),
              },
            ].map((item, i) => (
              <div key={i} className="card-elevated text-left">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-heading font-semibold text-surface-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
                {item.preview}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading mb-4">
            Up and running in 3 minutes
          </h2>
          <p className="section-subheading mb-12">
            Already in Follow Up Boss or a spreadsheet? Import your contacts in one click.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {[
              {
                step: "1",
                icon: <Upload className="h-5 w-5" />,
                title: "Import or add your leads",
                desc: "Paste a CSV or add contacts one by one. Takes less than a minute.",
              },
              {
                step: "2",
                icon: <FolderOpen className="h-5 w-5" />,
                title: "Set your pipeline stage",
                desc: "New → Contacted → Showing → Offer → Closed. Drag and drop to update.",
              },
              {
                step: "3",
                icon: <CalendarCheck className="h-5 w-5" />,
                title: "Open the app each morning",
                desc: "See exactly who to call today. Nothing else. Just the list.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-heading text-lg font-bold shrink-0">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-surface-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 px-4 sm:px-6 section-alt">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading mb-4">
            Simple pricing
          </h2>
          <p className="section-subheading mb-8">
            Less than one lunch per month. Zero guilt.
          </p>
          <LandingPricing />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-heading mb-4">
            Stop losing leads to bad tools
          </h2>
          <p className="section-subheading mb-8">
            Join solo agents who actually use their CRM daily.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Start for free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
