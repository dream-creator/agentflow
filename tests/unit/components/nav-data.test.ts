import { describe, it, expect } from "vitest";

describe("navLinks", () => {
  it("has exactly 3 navigation links", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    expect(navLinks).toHaveLength(3);
  });

  it("has Features link pointing to #features", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    const features = navLinks.find((l) => l.label === "Features");
    expect(features).toBeDefined();
    expect(features?.href).toBe("#features");
  });

  it("has How it Works link pointing to #how-it-works", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    const howItWorks = navLinks.find((l) => l.label === "How it Works");
    expect(howItWorks).toBeDefined();
    expect(howItWorks?.href).toBe("#how-it-works");
  });

  it("has Pricing link pointing to #pricing", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    const pricing = navLinks.find((l) => l.label === "Pricing");
    expect(pricing).toBeDefined();
    expect(pricing?.href).toBe("#pricing");
  });

  it("all links have non-empty labels and hrefs", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    for (const link of navLinks) {
      expect(link.label.length).toBeGreaterThan(0);
      expect(link.href.length).toBeGreaterThan(0);
    }
  });

  it("all hrefs start with #", async () => {
    const { navLinks } = await import("@/lib/nav-data");
    for (const link of navLinks) {
      expect(link.href).toMatch(/^#/);
    }
  });
});
