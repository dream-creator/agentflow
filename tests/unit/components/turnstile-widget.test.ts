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
