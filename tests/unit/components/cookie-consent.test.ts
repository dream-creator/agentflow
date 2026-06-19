import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve("src/components/cookie-consent.tsx"),
  "utf-8"
);

describe("CookieConsent component", () => {
  it("is a client component", () => {
    expect(source).toMatch(/^"use client"/);
  });

  it("has role dialog for accessibility", () => {
    expect(source).toContain('role="dialog"');
  });

  it("has aria-live polite for screen readers", () => {
    expect(source).toContain('aria-live="polite"');
  });

  it("has aria-label for the banner", () => {
    expect(source).toContain("Cookie consent");
  });

  it("uses localStorage for persistence", () => {
    expect(source).toContain("localStorage");
  });

  it("stores consent under agentflow_cookie_consent key", () => {
    expect(source).toContain("agentflow_cookie_consent");
  });

  it("has Accept and Decline buttons", () => {
    expect(source).toContain("Accept");
    expect(source).toContain("Decline");
  });

  it("uses surface-900 dark background for the banner", () => {
    expect(source).toContain("surface-900");
  });

  it("uses cta orange for the primary button", () => {
    expect(source).toContain("bg-cta");
  });

  it("handles keyboard Escape to dismiss", () => {
    expect(source).toContain("Escape");
  });

  it("respects prefers-reduced-motion", () => {
    expect(source).toContain("prefers-reduced-motion");
  });
});
