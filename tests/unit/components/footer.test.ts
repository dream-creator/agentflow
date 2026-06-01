import { describe, it, expect } from "vitest";

describe("footerLinks", () => {
  it("has company and product columns (no legal)", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    expect(footerLinks).toHaveProperty("company");
    expect(footerLinks).toHaveProperty("product");
    expect(footerLinks).not.toHaveProperty("legal");
  });

  it("company column has Contact, Privacy Policy, and Terms of Service", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const labels = footerLinks.company.map((l) => l.label);
    expect(labels).toEqual(["Contact", "Privacy Policy", "Terms of Service"]);
  });

  it("company Contact link points to /contact", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const contact = footerLinks.company.find((l) => l.label === "Contact");
    expect(contact?.href).toBe("/contact");
  });

  it("company Privacy Policy link points to /privacy", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const privacy = footerLinks.company.find((l) => l.label === "Privacy Policy");
    expect(privacy?.href).toBe("/privacy");
  });

  it("company Terms of Service link points to /terms", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const terms = footerLinks.company.find((l) => l.label === "Terms of Service");
    expect(terms?.href).toBe("/terms");
  });

  it("product column has Pricing, Features, and How it Works", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const labels = footerLinks.product.map((l) => l.label);
    expect(labels).toContain("Pricing");
    expect(labels).toContain("Features");
    expect(labels).toContain("How it Works");
  });

  it("product Pricing link points to landing page anchor", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const pricing = footerLinks.product.find((l) => l.label === "Pricing");
    expect(pricing?.href).toBe("/#pricing");
  });

  it("product Features link points to landing page anchor", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const features = footerLinks.product.find((l) => l.label === "Features");
    expect(features?.href).toBe("/#features");
  });

  it("all footer links have non-empty labels and hrefs", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    const allLinks = [...footerLinks.company, ...footerLinks.product];
    for (const link of allLinks) {
      expect(link.label.length).toBeGreaterThan(0);
      expect(link.href.length).toBeGreaterThan(0);
    }
  });

  it("has exactly 3 company links", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    expect(footerLinks.company).toHaveLength(3);
  });

  it("has exactly 3 product links", async () => {
    const { footerLinks } = await import("@/lib/footer-data");
    expect(footerLinks.product).toHaveLength(3);
  });
});
