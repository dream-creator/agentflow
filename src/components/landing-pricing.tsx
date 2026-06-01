"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/pricing-data";

export function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? "text-surface-900" : "text-surface-400"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
            annual ? "bg-primary" : "bg-surface-200"
          }`}
          aria-label="Toggle annual billing"
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              annual ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-surface-900" : "text-surface-400"}`}>
          Annual
        </span>
        {annual && (
          <span className="text-xs font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full">
            Save 2 months
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 sm:p-8 transition-all ${
              plan.highlighted
                ? "bg-white border-2 border-primary shadow-elevated"
                : "bg-white border border-surface-200"
            }`}
          >
            {plan.highlighted && (
              <div className="text-xs font-semibold text-primary bg-primary-50 px-2.5 py-1 rounded-full inline-block mb-4">
                Most popular
              </div>
            )}
            <h3 className="font-heading text-lg font-semibold text-surface-900 mb-1">
              {plan.name}
            </h3>
            <p className="text-sm text-surface-500 mb-4">{plan.description}</p>
            <div className="mb-6">
              <span className="font-heading text-4xl font-bold text-surface-900">
                ${annual ? plan.annualPrice : plan.monthlyPrice}
              </span>
              <span className="text-surface-500 text-sm ml-1">
                /{annual ? "year" : "month"}
              </span>
              {annual && plan.annualPrice > 0 && (
                <p className="text-xs text-surface-400 mt-1">
                  Billed ${plan.annualPrice}/year — save 2 months
                </p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-surface-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href={plan.href}>
              <Button
                variant={plan.highlighted ? "primary" : "secondary"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
