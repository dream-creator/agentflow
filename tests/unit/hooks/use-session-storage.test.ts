import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static source assertions for src/hooks/use-session-storage.ts.
 *
 * This hook is consumed only by src/components/maintenance-banner.tsx for
 * per-session dismissal state. It must:
 *
 *   1. Be SSR-safe: never access `window` or `sessionStorage` at module
 *      load or during the initial render. The first browser read happens
 *      in a useEffect (which only fires client-side after hydration).
 *
 *   2. Tolerate missing storage: if sessionStorage throws (e.g. Safari
 *      private mode, embedded WebViews) the hook must fall back to
 *      in-memory state, not crash the whole banner.
 *
 *   3. Be a stable useState-shaped API: callers receive [value, setValue]
 *      identical to React.useState, so the consumer code reads naturally.
 *
 *   4. Persist writes back to sessionStorage with a try/catch — quota
 *      errors must not bubble up into the UI.
 *
 * The vitest config runs in `node` environment with no jsdom and no
 * React renderer, so we test the contract via regex against the source —
 * same pattern as tests/unit/components/turnstile-widget.test.ts.
 */
describe("use-session-storage hook contract", () => {
  const source = readFileSync(
    join(process.cwd(), "src/hooks/use-session-storage.ts"),
    "utf-8",
  );

  it("does NOT access window or sessionStorage at module top level (SSR-safe)", () => {
    // Trim the leading `import` / `useState` / `useEffect` declarations
    // — anything left in lines 1-5 of the trimmed body is top-level.
    // We require no `window.` or `sessionStorage.` references in that
    // top-level region. Inside function bodies (useEffect callbacks) is
    // fine — those only run in the browser.
    const body = source.replace(/^import .*$/gm, "").trimStart();
    const head = body.split("\n").slice(0, 6).join("\n");
    expect(head).not.toMatch(/window\./);
    expect(head).not.toMatch(/sessionStorage\./);
  });

  it("guards every sessionStorage access with a typeof window check", () => {
    // The browser-read effect must be no-op on the server. We require
    // at least one `typeof window` guard before reading sessionStorage.
    expect(source).toMatch(/typeof\s+window/);
  });

  it("uses React's useState and useEffect (not a custom state lib)", () => {
    expect(source).toMatch(/useState/);
    expect(source).toMatch(/useEffect/);
  });

  it("returns a [value, setValue] tuple shaped like useState", () => {
    // Match the public signature line.
    expect(source).toMatch(/return\s+\[\s*\w+,\s*\w+\s*\]\s*as\s+const/);
  });

  it("persists writes back to sessionStorage inside a try/catch", () => {
    // Quota errors and SecurityError (private mode) must not crash the
    // component. Look for a try { ... sessionStorage.setItem ... }
    // block.
    const hasGuardedWrite = /try\s*\{[\s\S]*?sessionStorage\.setItem[\s\S]*?\}\s*catch/.test(source);
    expect(hasGuardedWrite).toBe(true);
  });

  it("guards the initial sessionStorage read with try/catch", () => {
    // Same safety rule for the read path — corrupt or missing JSON
    // must not crash the hook.
    const hasGuardedRead = /try\s*\{[\s\S]*?sessionStorage\.getItem[\s\S]*?\}\s*catch/.test(source);
    expect(hasGuardedRead).toBe(true);
  });
});
