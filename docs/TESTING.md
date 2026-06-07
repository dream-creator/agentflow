# Testing

Two test layers:

- **Vitest** for unit tests (Node environment, fast, no
  browser).
- **Playwright** for end-to-end tests (3 browser projects:
  chromium / firefox / mobile-chrome).

Plus **Lighthouse CI** for performance / accessibility /
best-practices / SEO budgets.

Coverage gate: **80%** (lines, branches, functions,
statements) on `src/lib/**` and `src/app/api/**`. Components
and pages are excluded from the coverage gate (they're covered
by Playwright + visual review).

## Quick reference

| Command | What it does |
| --- | --- |
| `npm test` | Vitest in watch mode. |
| `npm test -- --run` | Vitest once (no watch). |
| `npm run test:coverage` | Vitest with v8 coverage + 80% gate. |
| `npm run test:e2e` | Playwright (3 projects). |
| `npm run test:e2e -- --project=chromium` | Playwright chromium only. |
| `npm run test:e2e -- tests/e2e/auth.spec.ts` | Single file. |
| `npm run test:lighthouse` | Lighthouse CI against the dev server. |

## Vitest

### Configuration

`vitest.config.ts`:

```ts
{
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts"],
      thresholds: {
        lines: 80, functions: 80, branches: 80, statements: 80,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
}
```

The `json-summary` reporter is required by the
`coverage-gate` job in `pr-gatekeeper.yml`. If you remove it,
the CI step will fail with a missing `coverage-summary.json`.

### File structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── auth.test.ts
│   │   ├── plan-limit.test.ts
│   │   ├── rate-limiter.test.ts
│   │   ├── stripe.test.ts
│   │   ├── resend.test.ts
│   │   ├── supabase-middleware.test.ts
│   │   ├── utils.test.ts
│   │   └── constants.test.ts
│   ├── api/
│   │   ├── leads.test.ts
│   │   └── cron.test.ts
│   ├── hooks/
│   │   ├── useLeads.test.ts
│   │   └── useProfile.test.ts
│   └── components/
│       ├── toast.test.ts
│       └── nav-data.test.ts
```

### Patterns

**Pure function tests** (most of `src/lib/`):

```ts
import { describe, it, expect } from "vitest";
import { formatStage } from "@/lib/utils";

describe("formatStage", () => {
  it("underscores to spaces and title-cases", () => {
    expect(formatStage("new_lead")).toBe("New Lead");
    expect(formatStage("closed_won")).toBe("Closed Won");
  });
});
```

**Env stubbing** (for `auth.ts`, which reads
`NEXT_PUBLIC_APP_URL` and `window.location`):

```ts
import { vi, afterEach } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); });

it("returns window origin when available", () => {
  vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
  expect(getBrowserOrigin()).toBe("http://localhost:3000");
});
```

**Async tests** (for `rate-limiter.ts`):

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiRateLimit } from "@/lib/rate-limiter";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("allows 100 requests then blocks the 101st", () => {
  for (let i = 0; i < 100; i++) {
    expect(apiRateLimit("test", "u1").success).toBe(true);
  }
  expect(apiRateLimit("test", "u1").success).toBe(false);
});
```

### Excluded from coverage

- `src/lib/supabase/client.ts` — browser singleton, requires a
  `window` to test.
- `src/lib/supabase/server.ts` — server-side factory, requires
  cookie mocking.
- `src/app/(auth)/*`, `src/app/(dashboard)/*` — pages,
  covered by Playwright.

If you add a new lib file, **add a test**. The coverage gate
will catch it on the next CI run.

## Playwright

### Configuration

`playwright.config.ts`:

```ts
{
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,    // see "Auth fixture" below
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium",      use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",       use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm run dev", port: 3000, reuseExistingServer: !process.env.CI },
}
```

Key behaviors:

- **Three projects.** Tests run on each. CI shards across
  projects in `.github/workflows/staging-promotion.yml`.
- **`BASE_URL` override.** If set, the webServer is skipped and
  tests run against the deployed URL (used in CI for Vercel
  preview deploys).
- **Workers = 1.** This is forced by the auth fixture (see
  below) which uses a per-worker session cache.

### Auth fixture

`tests/e2e/fixtures/auth.ts` provides:

```ts
import { test, expect } from "./fixtures/auth";

test("can create a lead", async ({ authenticatedPage, authFixture }) => {
  // authenticatedPage has the Supabase session cookie injected
  // authFixture has { email, userId, cookieValue }
});
```

The fixture mints a session **server-side** by:

1. Creating a new user via the Supabase admin API
   (`auth.admin.createUser`).
2. Generating a magic link via `auth.admin.generate_link`.
3. Exchanging the OTP via `/auth/v1/verify`.
4. Base64-encoding the session in the
   `@supabase/ssr` cookie format (`base64-<base64url(JSON.stringify(session))>`).
5. Injecting the cookie into the Playwright browser context.

This bypasses the captcha entirely (the password grant
requires captcha, but magic-link generation does not). The
session is cached per-worker (`sessionCache` module-level
variable) so subsequent tests reuse the same user and the same
Supabase rate-limit budget.

**Required env vars** (in `.env.local` for local, or Vercel
Preview env for CI):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The test user is deleted in `releaseSession()` after the last
ref count, so e2e runs do not pollute the production database.

### Captcha bypass

The Vercel **Preview** env sets
`NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true`. The
`turnstile-widget.tsx` component sees this and renders a fake
widget that auto-fires `onSuccess("test-bypass-token")`. This
is the **only** way to make Playwright tests pass against a
preview URL — there is no way to solve a Cloudflare challenge
from Playwright without a 3rd-party service.

The Production env **does not** have this flag set. The
`security_captcha_enabled = true` setting on the Supabase
project means the test token would be rejected anyway.

### Test files

```
tests/e2e/
├── auth.spec.ts              login, signup, redirect, captcha
├── lead-crud-auth.spec.ts    create / read / update / soft-delete
├── pipeline-auth.spec.ts     drag-and-drop, stage persistence
├── follow-ups-auth.spec.ts   overdue/today/upcoming, complete
├── csv-import.spec.ts        4-step import wizard
├── mobile-nav.spec.ts        bottom nav, sidebar collapse
├── turnstile-timeout.spec.ts captcha timeout + retry
├── pricing-plan-limits.spec.ts  landing page copy, plan gate
└── load/
    └── concurrent-users.spec.ts  5 concurrent users
```

All `*-auth.spec.ts` files use the auth fixture. The public
ones (`auth.spec.ts`, `mobile-nav.spec.ts`, etc.) don't.

### Running a single project

```bash
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome
```

### Debugging

```bash
npx playwright test --headed --project=chromium --debug
```

Trace files are saved on first retry to `test-results/`. View:

```bash
npx playwright show-trace test-results/.../trace.zip
```

## Lighthouse CI

`lighthouserc.json` collects three URLs (`/`, `/login`,
`/dashboard`) and asserts:

| Metric | Threshold |
| --- | --- |
| Performance | ≥ 0.7 |
| Accessibility | ≥ 0.9 |
| Best practices | ≥ 0.9 |
| SEO | ≥ 0.8 |

Plus resource budgets (500KB total, 200KB script) and timing
budgets (FCP < 2s, LCP < 3s, CLS < 0.1, TBT < 500ms,
interactive < 5s).

Run with `npm run test:lighthouse`. In CI, the `pr-gatekeeper`
workflow runs it as a best-effort job (continues on error).

## What to read next

- [DEPLOYMENT.md](./DEPLOYMENT.md#ci-workflows) — what each CI
  workflow actually tests.
- [AUTHENTICATION.md](./AUTHENTICATION.md#testing-auth) — the
  auth fixture in more detail.
- [ONBOARDING.md](./ONBOARDING.md#running-tests) — first-time
  test setup.
