# Onboarding

First-time setup for a developer joining the AgentFlow
codebase. By the end you should have a working local dev
server, the Supabase database connected, and tests passing.

## Prerequisites

- **Node.js 20+** (Next.js 14 requirement; package.json sets
  `engines.node` accordingly).
- **npm 10+** (Vercel compatibility).
- **Git.**
- A Supabase project (the repo includes the schema; the host
  is your choice — cloud or local Docker).
- A Stripe test account.
- A Resend account (optional for local dev — the daily-digest
  cron will silently no-op without it).
- A Cloudflare Turnstile site key (optional for local dev —
  set the `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS` env var to
  bypass the widget).

## 1. Clone and install

```bash
git clone git@github.com:dream-creator/agentflow.git
cd agentflow
npm install
```

## 2. Environment

Copy the example and edit:

```bash
cp .env.local.example .env.local
```

Required (minimum to run the dev server):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App origin (used in OAuth callback URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Turnstile bypass for local dev (use real key for production)
NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true
```

Optional (for full feature parity):

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# Sentry (no-op without these)
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

See [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) for
the full matrix including what each var does and where it's
used.

## 3. Supabase setup

The fastest path is a fresh Supabase cloud project:

1. Create a project at https://supabase.com.
2. Go to **Settings → API** and copy the URL, anon key, and
  service role key into `.env.local`.
3. Install the Supabase CLI: `npm install -g supabase`.
4. Link the project: `supabase link --project-ref <ref>`.
5. Apply the migration: `supabase db push`. This creates the
  `profiles`, `leads`, `actions` tables, RLS policies, and
  the `check_free_tier_lead_limit()` trigger.

For local-only dev, run Supabase in Docker:

```bash
supabase start
```

This brings up a local Postgres + GoTrue + Storage. The CLI
prints the local URL and keys — copy them into `.env.local`.

### Auth URL configuration

In the Supabase dashboard, go to **Authentication → URL
Configuration** and add:

```
http://localhost:3000/auth/callback
```

Without this, the magic link email will redirect to a broken
URL.

## 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000. You should see the landing page.
Click "Sign in", enter your email, and Supabase will send you
a magic link. The link redirects to `http://localhost:3000/auth/callback?code=...`
and you're in.

If the captcha is enabled, you'll see the Turnstile widget.
With `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true`, it's a fake
widget that auto-verifies.

## 5. Running tests

Unit tests:

```bash
npm test              # watch mode
npm test -- --run     # single run
npm run test:coverage # with 80% coverage gate
```

E2E tests (requires the dev server or a `BASE_URL`):

```bash
npm run test:e2e                                    # all 3 projects
npm run test:e2e -- --project=chromium              # one project
npm run test:e2e -- tests/e2e/auth.spec.ts          # one file
```

The first time you run e2e, install the browsers:

```bash
npx playwright install
```

See [TESTING.md](./TESTING.md) for the full breakdown of
fixtures, projects, and CI behavior.

## Common tasks

### Add a new lead stage

1. Edit the `STAGES` constant in `src/lib/constants.ts`.
2. Add the corresponding column in
  `src/app/(dashboard)/pipeline/page.tsx`.
3. Add the variant mapping in `src/lib/utils.ts`
  (`getStageVariant`).
4. Update the database migration: add a new enum value to
  `pipeline_stage` (or just relax the constraint if it's a
  text column).
5. Add a test for `formatStage` and `getStageVariant` in
  `tests/unit/lib/utils.test.ts`.

### Add a new API endpoint

1. Create `src/app/api/<resource>/route.ts` (or
  `[id]/route.ts` for individual items).
2. Validate input with Zod (see `src/lib/validations.ts` for
  patterns).
3. Wrap with `apiRateLimit(...)` if the endpoint is
  public-facing.
4. Check the user's plan with `checkPlanLimit()` if the
  operation consumes a resource.
5. Return errors using the envelope from
  [API-REFERENCE.md](./API-REFERENCE.md#error-envelope).
6. Add unit tests in `tests/unit/api/`.

### Add a new page

1. Decide: server component (default) or client component?
  See [ARCHITECTURE.md](./ARCHITECTURE.md#server-vs-client).
2. Add a folder under `src/app/` (e.g.
  `src/app/(dashboard)/reports/page.tsx`).
3. If it needs a sidebar entry, update
  `src/components/layout/sidebar.tsx`.
4. If it's protected, add the path to the matcher in
  `src/lib/supabase/middleware.ts`.
5. Add a `loading.tsx` and `error.tsx` for the route.
6. Add a Playwright test in `tests/e2e/`.

### Update env vars

1. Add to `.env.local.example`.
2. Update
  [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md).
3. Add to Vercel (Preview + Development + Production).
4. If it's a server-only secret, also add to GitHub Secrets
  (if used in CI).

## Troubleshooting

### "supabase.from(...).select(...) returns no rows"

Check the RLS policies in
[supabase/migrations/](./DATABASE.md#schema). The user
creating the lead must be authenticated and own the row.

### "Next.js build error: useSearchParams must be wrapped in Suspense"

A page that uses `useSearchParams()` (e.g. the login page
reading `?error=`) must be wrapped in `<Suspense>` or
Next.js will fail the static prerender. See
`src/app/(auth)/login/page.tsx` for the pattern.

### "Captcha never verifies in local dev"

The Turnstile widget is configured for production domains.
Either:

- Set `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true` to render the
  fake widget.
- Add `localhost` to the Turnstile site's allowed hostnames
  in the Cloudflare dashboard.
- Add `127.0.0.1` too — Cloudflare distinguishes between
  the two.

### "Stripe webhook returns 400"

Locally, you need to forward Stripe events to your dev server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This prints a `whsec_...` signing secret. Set it as
`STRIPE_WEBHOOK_SECRET` in `.env.local`. Do **not** use the
production secret locally.

### "Vercel build fails with 'SUPABASE_ACCESS_TOKEN' is empty"

This is a CI secret, not a Vercel env. Set it in
**GitHub → Settings → Secrets and variables → Actions**. The
staging-promotion workflow needs it for `supabase db push`.
The value is a Supabase **personal access token**, not the
project's service role key.

### "Migration 'lrupsc_1_0' already exists"

A leftover from a previous pgbouncer session. Use the
**session-mode** pooler (port `5432`), not the transaction
pooler (port `6543`). The CI workflows already rewrite the
URL; locally, change your `SUPABASE_DB_URL` to:

```
postgresql://postgres.PROJECT-REF:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

(Substitute your region.)

### "Local Postgres is IPv6-only"

Supabase's direct connection
(`db.PROJECT-REF.supabase.co`) is IPv6. If your box doesn't
have IPv6, use the pooler host (above) or run the migration
from a machine with IPv6 (e.g. GitHub Actions).

## What to read next

- [ARCHITECTURE.md](./ARCHITECTURE.md) — the 5-minute
  overview.
- [AUTHENTICATION.md](./AUTHENTICATION.md) — if you're touching
  the login/signup/middleware flow.
- [DATABASE.md](./DATABASE.md) — if you're writing a
  migration or changing a table.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — before merging your first
  PR.
