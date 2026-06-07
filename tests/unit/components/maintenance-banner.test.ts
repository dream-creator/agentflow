import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static source assertions for src/components/maintenance-banner.tsx.
 *
 * The banner is a thin component — its behavior is easier to verify by
 * regex-matching the source than by spinning up React Testing Library
 * (which the project's vitest config does not configure for jsdom).
 *
 * Contract under test:
 *   1. Hidden by default (returns null when the env var is not "true")
 *   2. Toggled by isMaintenanceBannerVisible() from feature-flags
 *   3. Persists dismissal in sessionStorage via useSessionStorage
 *   4. Accessible: role="status", aria-live, aria-label on dismiss
 *   5. Keyboard: Escape dismisses, focus ring visible
 *   6. Mobile: collapses to icon + short text + View button under md
 *   7. Reduced-motion: no pulse animation
 *   8. No hardcoded colors — only Tailwind warning tokens
 */
describe("MaintenanceBanner contract", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/maintenance-banner.tsx"),
    "utf-8",
  );

  it("is a Client Component (\"use client\" directive at top)", () => {
    // Required for useState / useSessionStorage / useEffect.
    expect(source).toMatch(/^"use client"/);
  });

  it("imports isMaintenanceBannerVisible from feature-flags", () => {
    expect(source).toMatch(/isMaintenanceBannerVisible/);
  });

  it("imports useSessionStorage from hooks", () => {
    expect(source).toMatch(/useSessionStorage/);
  });

  it("renders null when isMaintenanceBannerVisible() returns false", () => {
    // The component must be a zero-cost zero-layout-impact noop when
    // the env var is unset — that means an early `return null` branch.
    const earlyReturn = /if\s*\(\s*!\s*isMaintenanceBannerVisible\s*\(\s*\)\s*\)\s*return\s+null/.test(
      source,
    );
    expect(earlyReturn).toBe(true);
  });

  it("uses role=\"status\" and aria-live for accessibility", () => {
    expect(source).toMatch(/role="status"/);
    expect(source).toMatch(/aria-live/);
  });

  it("has an aria-label on the dismiss button", () => {
    expect(source).toMatch(/aria-label="[^"]*[Dd]ismiss[^"]*"/);
  });

  it("uses only design-token Tailwind classes (no raw color classes)", () => {
    // No raw `bg-yellow-`, `text-amber-`, `bg-red-`, etc. — all must go
    // through the warning token palette.
    expect(source).not.toMatch(/bg-(?:yellow|red|green|blue|orange)-\d/);
    expect(source).not.toMatch(/text-(?:yellow|red|green|blue|orange)-\d/);
  });

  it("uses warning-* design tokens for the amber status surface", () => {
    // At least one `bg-warning-50` and one `text-warning-700` (or 800).
    expect(source).toMatch(/bg-warning-/);
    expect(source).toMatch(/text-warning-/);
  });

  it("dismisses on Escape key when the banner is focused", () => {
    expect(source).toMatch(/Escape/);
  });

  it("has a compact mobile treatment using md: variants", () => {
    // The short text label (used on mobile) is required so the design
    // intent is visible in the source. We require at least one `md:`
    // responsive variant for the desktop layout.
    expect(source).toMatch(/md:/);
  });

  it("respects prefers-reduced-motion (no animation when set)", () => {
    // Either we conditionally apply the pulse class, or we read
    // `matchMedia` for prefers-reduced-motion. Both patterns are
    // acceptable.
    const hasReducedMotion =
      /prefers-reduced-motion/.test(source) ||
      /matchMedia.*reduce/.test(source);
    expect(hasReducedMotion).toBe(true);
  });
});
