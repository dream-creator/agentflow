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

  it("has role alertdialog for accessibility", () => {
    expect(source).toContain('role="alertdialog"');
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

  it("uses white background with flat border design", () => {
    expect(source).toContain("bg-white");
    expect(source).toContain("border-surface-200");
  });

  it("uses primary teal for the accept button", () => {
    expect(source).toContain("bg-primary");
  });

  it("handles keyboard Escape to dismiss", () => {
    expect(source).toContain("Escape");
  });

  it("respects prefers-reduced-motion", () => {
    expect(source).toContain("prefers-reduced-motion");
  });

  it("has dismiss button with aria-label", () => {
    expect(source).toContain('aria-label="Dismiss cookie consent"');
  });

  it("uses flat design with no shadows", () => {
    expect(source).not.toContain("shadow-elevated");
    expect(source).not.toContain("shadow-card");
  });

  it("has tactile feedback with scale on active", () => {
    expect(source).toContain("active:scale-[0.97]");
  });

  it("has proper touch target sizes", () => {
    expect(source).toContain("min-h-[44px]");
  });
});
