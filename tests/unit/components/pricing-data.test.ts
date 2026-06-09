import { describe, it, expect } from "vitest";

describe("pricingPlans", () => {
  it("has exactly 2 plans", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    expect(pricingPlans).toHaveLength(2);
  });

  it("Free plan has $0 monthly and annual price", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const free = pricingPlans.find((p) => p.name === "Free");
    expect(free).toBeDefined();
    expect(free?.monthlyPrice).toBe(0);
    expect(free?.annualPrice).toBe(0);
  });

  it("Pro plan has $8/mo and $80/yr", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const pro = pricingPlans.find((p) => p.name === "Pro");
    expect(pro).toBeDefined();
    expect(pro?.monthlyPrice).toBe(8);
    expect(pro?.annualPrice).toBe(80);
  });

  it("Pro plan is highlighted", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const pro = pricingPlans.find((p) => p.name === "Pro");
    expect(pro?.highlighted).toBe(true);
  });

  it("Free plan is not highlighted", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const free = pricingPlans.find((p) => p.name === "Free");
    expect(free?.highlighted).toBe(false);
  });

  it("Free plan includes 10 active leads", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const free = pricingPlans.find((p) => p.name === "Free");
    expect(free?.features).toContain("10 active leads");
  });

  it("Pro plan includes unlimited leads", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const pro = pricingPlans.find((p) => p.name === "Pro");
    expect(pro?.features).toContain("Unlimited leads");
  });

  it("both plans link to /signup", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    for (const plan of pricingPlans) {
      expect(plan.href).toBe("/signup");
    }
  });

  it("all plans have non-empty descriptions", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    for (const plan of pricingPlans) {
      expect(plan.description.length).toBeGreaterThan(0);
    }
  });

  it("all plans have at least 3 features", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    for (const plan of pricingPlans) {
      expect(plan.features.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("Pro annual price saves 2 months vs monthly", async () => {
    const { pricingPlans } = await import("@/lib/pricing-data");
    const pro = pricingPlans.find((p) => p.name === "Pro");
    // 10 months * $5 = $50 annual (saves 2 months)
    expect(pro?.annualPrice).toBe(pro!.monthlyPrice * 10);
  });
});
