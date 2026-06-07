import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Source-assertion tests for the public /terms page.
 *
 * Why source-assert and not jsdom render:
 *   The /terms page is a static Server Component with no logic, no state,
 *   and no props. The project convention (see changelog.test.ts) is to
 *   pattern-match the source for key content markers. This catches:
 *     - Accidental section removal or renumbering
 *     - Wording regression on the effective date
 *     - Contact info drift (email, website)
 *     - Re-introduction of the old 9-section layout
 *     - Loss of the governing-law placeholder
 *   without spinning up a React render tree.
 */

const TERMS_PATH = resolve(process.cwd(), "src/app/terms/page.tsx");
const source = readFileSync(TERMS_PATH, "utf8");

const NEW_SECTIONS = [
  "1. Service Description and Disclaimer",
  "2. Account Requirements",
  "3. Subscription and Billing",
  "4. Acceptable Use",
  "5. IP and Data Ownership",
  "6. Disclaimer of Warranties",
  "7. Limitation of Liability",
  "8. Termination",
  "9. Governing Law",
  "10. Contact",
] as const;

const REMOVED_SECTIONS = [
  "What AgentFlow Is (And Isn't)",
  "Simple Pricing",
  "Your Data",
  "Our Stuff",
  "Service Limits",
  "Leaving Us",
  "Contact Us",
] as const;

describe("/terms page (source assertions)", () => {
  it("is a Server Component (no 'use client' directive)", () => {
    expect(source.startsWith('"use client"')).toBe(false);
    expect(source.startsWith("'use client'")).toBe(false);
  });

  it("exports Next.js metadata for SEO", () => {
    expect(source).toMatch(/export const metadata:\s*Metadata/);
    expect(source).toMatch(/title:\s*"Terms of Service/);
  });

  it("uses the /privacy page design tokens (sticky nav, max-w-3xl, font-heading)", () => {
    expect(source).toContain('sticky top-0 z-50 bg-white/80 backdrop-blur-md');
    expect(source).toContain("max-w-3xl mx-auto px-4");
    expect(source).toContain("font-heading text-3xl font-bold text-surface-900");
    expect(source).toContain("prose prose-surface max-w-none");
  });

  it("shows the current Effective Date (June 6, 2026)", () => {
    expect(source).toContain("Effective Date: June 6, 2026");
  });

  it("lists all 10 sections in the new corporate structure", () => {
    for (const heading of NEW_SECTIONS) {
      expect(source, `missing section heading: ${heading}`).toContain(heading);
    }
  });

  it("numbers sections sequentially 1 through 10", () => {
    for (let i = 1; i <= 10; i++) {
      const marker = `${i}. `;
      // Match the heading inside an <h2>
      const re = new RegExp(`<h2[^>]*>\\s*${i}\\.\\s`);
      expect(source, `missing <h2> numbered ${i}. `).toMatch(re);
    }
  });

  it("contains the support email as a mailto link", () => {
    expect(source).toContain('href="mailto:support@agent-flow.app"');
    expect(source).toContain("support@agent-flow.app");
  });

  it("contains the website as an external link with safe rel", () => {
    expect(source).toContain('href="https://agent-flow.app"');
    expect(source).toMatch(/href="https:\/\/agent-flow\.app"[^>]*target="_blank"/);
    expect(source).toMatch(/href="https:\/\/agent-flow\.app"[^>]*rel="noopener noreferrer"/);
  });

  it("specifies a USA governing jurisdiction (State of California, United States of America)", () => {
    // Professional, standard SaaS terms-of-service phrasing for a US-based
    // company. The full, formal country name is used (no abbreviations).
    expect(source).toContain("State of California, United States of America");
  });

  it("includes a 'no conflict of laws' qualifier in §9", () => {
    // Standard legal phrasing that prevents parties from invoking conflict-of-laws
    // doctrines to escape the governing jurisdiction's rules.
    expect(source).toMatch(/conflict of laws/i);
  });

  it("includes an exclusive-jurisdiction / venue clause in §9", () => {
    // Professional SaaS terms typically assert that disputes must be brought
    // in the courts of the governing state. Catches regressions where the
    // venue clause is dropped during edits.
    expect(source).toMatch(/jurisdiction|venue|courts located in/i);
  });

  it("does NOT contain the literal [Insert State/Country] placeholder anymore", () => {
    // Regression check: once the operator fills in a real jurisdiction, the
    // literal placeholder should be removed. A stray placeholder in production
    // copy is a launch-blocker.
    expect(source).not.toContain("[Insert State/Country]");
  });

  it("does NOT contain any of the removed old 9-section headings", () => {
    for (const old of REMOVED_SECTIONS) {
      expect(source, `legacy heading still present: ${old}`).not.toContain(old);
    }
  });

  it("disclaims advice liability (no real estate / legal / financial advice)", () => {
    expect(source).toMatch(/real estate/i);
    expect(source).toMatch(/legal/i);
    expect(source).toMatch(/financial advice/i);
  });

  it("disclaims warranties with the standard 'as is' / 'as available' language", () => {
    // JSX convention in this project (see privacy/page.tsx line 37) uses &quot;
    // in text content. React renders these to literal " in the DOM.
    expect(source).toMatch(/AS IS/);
    expect(source).toMatch(/AS AVAILABLE/);
  });

  it("disclaims indirect, incidental, special, or consequential damages", () => {
    expect(source).toMatch(/indirect/i);
    expect(source).toMatch(/incidental/i);
    expect(source).toMatch(/consequential/i);
    expect(source).toMatch(/lost commissions/i);
    expect(source).toMatch(/lost data/i);
  });

  it("states user can cancel / terminate anytime", () => {
    expect(source).toMatch(/cancel at any time|delete.*account|terminate/i);
  });

  it("forbids spam, harassment, hacking, and illegal use in Acceptable Use", () => {
    expect(source).toMatch(/spam/i);
    expect(source).toMatch(/harass/i);
    expect(source).toMatch(/hack/i);
    expect(source).toMatch(/illegal/i);
  });
});
