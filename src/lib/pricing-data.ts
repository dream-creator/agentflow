export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For agents getting started",
    features: [
      "10 active leads",
      "10 pipelines",
      "Daily email digest",
      "Mobile + desktop access",
    ],
    cta: "Get started free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 5,
    annualPrice: 50,
    description: "For serious solo agents",
    features: [
      "Unlimited leads",
      "Unlimited pipelines",
      "Daily email digest",
      "Custom follow-up reminders",
      "Priority support",
    ],
    cta: "Start 14-day free trial",
    href: "/signup",
    highlighted: true,
  },
];
