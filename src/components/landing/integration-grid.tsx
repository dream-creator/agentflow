'use client';

import { Calendar, MapPin, Phone, Mail, Globe, Building2 } from 'lucide-react';

const INTEGRATIONS = [
  {
    name: 'Zillow',
    icon: Building2,
    description: 'Sync leads from your Zillow profile',
    color: 'text-primary',
    bgColor: 'bg-primary-50',
  },
  {
    name: 'Realtor.com',
    icon: Globe,
    description: 'Import contacts from listings',
    color: 'text-accent',
    bgColor: 'bg-accent-50',
  },
  {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Schedule showings and follow-ups',
    color: 'text-surface-600',
    bgColor: 'bg-surface-100',
  },
  {
    name: 'Phone & SMS',
    icon: Phone,
    description: 'One-tap calling from any contact',
    color: 'text-success',
    bgColor: 'bg-success-50',
  },
  {
    name: 'Email',
    icon: Mail,
    description: 'Send follow-ups directly from the app',
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  {
    name: 'MLS',
    icon: MapPin,
    description: 'Track property showings and tours',
    color: 'text-destructive',
    bgColor: 'bg-destructive-50',
  },
];

export default function IntegrationGrid() {
  return (
    <section
      aria-label="Integrations"
      className="py-20 sm:py-24 px-4 sm:px-6 bg-white"
    >
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-surface-900 mb-2">
            Works with your tools
          </h2>
          <p className="text-sm sm:text-base text-surface-500">
            Connects to the platforms you already use daily
          </p>
        </div>

        {/* Integration grid */}
        <div
          role="list"
          aria-label="Available integrations"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.name}
                role="listitem"
                className="group flex items-start gap-4 p-5 rounded-card border border-surface-200 bg-surface-50 hover:border-primary-200 transition-all cursor-default"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${integration.bgColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${integration.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-surface-900 mb-1">
                    {integration.name}
                  </p>
                  <p className="text-sm text-surface-500 leading-snug">
                    {integration.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle note */}
        <p className="text-center text-sm text-surface-400 mt-8">
          Don&apos;t see your tool?{" "}
          <a href="mailto:support@agent-flow.app" className="text-primary hover:underline">
            Tell us
          </a>{" "}
          — we&apos;ll build it.
        </p>
      </div>
    </section>
  );
}
