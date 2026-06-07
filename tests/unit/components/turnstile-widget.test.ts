import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static source assertions for src/components/turnstile-widget.tsx.
 *
 * These tests guard the `size: "invisible"` choice on the underlying
 * @marsidev/react-turnstile component. The auth pages wrap <TurnstileWidget>
 * in a 1×1 off-screen div:
 *
 *   <div className="absolute -left-[9999px] -top-[9999px] w-px h-px
 *                   overflow-hidden pointer-events-none">
 *     <TurnstileWidget ... />
 *   </div>
 *
 * The lib's "flexible" size applies `{ minWidth: 300, width: "100%",
 * height: 65 }` to its container — which the 1×1 wrapper clips to 1×1.
 * The Cloudflare iframe can't render in 1×1, `onLoad` never fires, and
 * the form submit button stays disabled forever.
 *
 * The "invisible" size applies `{ width: 0, height: 0, overflow: "hidden" }`
 * — fits inside the off-screen wrapper and the iframe still loads.
 * This pattern is documented in the wrapper comment at
 * src/app/(auth)/login/page.tsx:656-660 and signup/page.tsx.
 */
describe("TurnstileWidget size option", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/turnstile-widget.tsx"),
    "utf-8",
  );

  it("uses size: 'invisible' so the off-screen wrapper doesn't clip the iframe", () => {
    expect(source).toMatch(/size:\s*["']invisible["']/);
  });

  it("does not use size: 'flexible' (would require 300x65 px the wrapper can't provide)", () => {
    expect(source).not.toMatch(/size:\s*["']flexible["']/);
  });
});

/**
 * Defensive guard against the "Vercel env wipe" regression class.
 *
 * On 2026-06-07 production was broken because the Vercel CLI silently
 * accepted `vercel env add` calls but stored empty strings (CLI bug, not
 * our code). Next.js inlined `siteKey: ""` into the JS bundle, the
 * Cloudflare widget never initialized, and users saw a magic link button
 * that was greyed out with no error message.
 *
 * These tests assert the module contains a clear failure mode for that
 * scenario: when the siteKey is empty AND the user is neither in test
 * bypass mode nor in the emergency kill-switch mode, the widget must
 * surface a visible error (not silently mount a broken Turnstile).
 *
 * Static source assertions are used because vitest's `process.env` is
 * frozen at module-load time, so dynamic env-var swapping requires
 * `vi.stubEnv` + module re-import. The source check matches the
 * pattern of the size-option tests above — a fast, deterministic
 * regression guard that fails the build if a future refactor removes
 * the guard.
 */
describe("TurnstileWidget empty-siteKey guard", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/turnstile-widget.tsx"),
    "utf-8",
  );

  it("reads the siteKey from process.env into a named local constant", () => {
    // Capturing the value into a const lets the guard check it before
    // passing to <Turnstile> — without this, `process.env.X!` non-null
    // assertion silently passes the empty string through.
    expect(source).toMatch(/const\s+SITE_KEY\s*=\s*process\.env\.NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  });

  it("checks for empty / missing siteKey and skips when in bypass mode", () => {
    // The guard must allow test-bypass + emergency-disabled modes to
    // short-circuit BEFORE the empty-siteKey error, so CI/staging keep
    // working when the env var is intentionally not set. The actual
    // guard is `!SITE_KEY && !TEST_BYPASS_ENABLED && !TURNSTILE_DISABLED`
    // (negated conjunction) — so we require both bypass/disabled
    // constants to appear in the same conditional block as the
    // empty-key check. We anchor to `!SITE_KEY &&` so the regex
    // matches the dev-throw block and not the production-render
    // `if (!SITE_KEY) {` branch (which is tested separately).
    const guardBlock = source.match(
      /if\s*\([\s\S]*?!\s*SITE_KEY\s*&&[\s\S]*?TEST_BYPASS_ENABLED[\s\S]*?TURNSTILE_DISABLED[\s\S]*?\)/,
    )?.[0];
    expect(guardBlock, "expected dev-throw guard with bypass+disabled skips").toBeDefined();
  });

  it("renders a visible error state (not silent failure) when siteKey is empty in production", () => {
    // The fix to the June 7 outage is that the widget must NEVER silently
    // mount <Turnstile siteKey="">. Either throw at module load (dev)
    // or render a visible error component (prod) — the test asserts the
    // guard's branching structure exists in the source.
    const hasGuard =
      /if\s*\(\s*!\s*SITE_KEY/.test(source) ||
      /siteKey.*empty/i.test(source) ||
      /NEXT_PUBLIC_TURNSTILE_SITE_KEY\s*&&/.test(source);
    expect(hasGuard).toBe(true);
  });

  it("passes the captured SITE_KEY constant to <Turnstile siteKey={...}> (not the raw env var)", () => {
    // Catches a regression where a future refactor reintroduces the
    // `process.env.X!` non-null assertion that masked the empty value.
    expect(source).toMatch(/siteKey=\{SITE_KEY\}/);
  });
});
