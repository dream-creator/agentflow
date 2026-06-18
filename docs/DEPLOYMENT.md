# Deployment

AgentFlow deploys via Vercel, with Supabase / Stripe / Resend /
Cloudflare Turnstile as managed services. CI is GitHub Actions;
the production release is on a fast-forward merge to `main` plus a
Sentry release upload.

## Branch / environment topology

```
┌────────────┐   PR        ┌────────────┐   PR/merge   ┌────────────┐
│  feature/* ├────────────►│  develop   ├─────────────►│   main     │
└────────────┘              └────────────┘              └─────┬──────┘
                                                                │
                                                                ▼
                                                      ┌──────────────────┐
                                                      │ Vercel Production│
                                                      │ agent-flow.app   │
                                                      └──────────────────┘
```

| Branch | Triggers | What runs |
| --- | --- | --- |
| `feature/*` → PR to `develop` | `pr-gatekeeper.yml` | lint, typecheck, build, unit tests, coverage gate, security audit, Lighthouse CI (best-effort) |
| push to `develop` | `staging-promotion.yml` | apply migrations, deploy Vercel preview, run e2e tests against preview |
| push to `main` (or manual dispatch) | `production-release.yml` | validate, deploy to Vercel production, smoke test, Sentry release |
| every hour | `scheduled-health-check.yml` | curl `/login`, `/api/health`, `/manifest.json` |
| weekly (Thu 00:30 UTC) | `codeql.yml` | CodeQL scan for actions + JavaScript/TypeScript |

## Vercel

The Vercel project is `agentflow` (or
`ryans-projects-9d1f8f11/agentflow` in Vercel-team URL format).
Live URL: **https://agent-flow.app**.

### Environment configuration

See [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md#vercel-environment-topology)
for the full per-env table. Summary:

- **Production env** (`agent-flow.app`): real Stripe + Resend
  keys, real Turnstile site key, real Sentry DSN, real
  Supabase URL.
- **Preview env** (`*.vercel.app`): real services but
  `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true` so e2e tests can
  mint sessions without solving a Cloudflare challenge.
  `NEXT_PUBLIC_APP_URL` is **unset** so `window.location.origin`
  wins for magic links and OAuth callbacks.
- **Development env** (local): `.env.local`.

### Vercel CLI

For local CLI work (e.g. one-off env edits), authenticate with
a Vercel classic token:

```bash
export VERCEL_TOKEN=<your-token>
vercel env ls --environment=production
vercel env add MY_VAR production   # reads from stdin
```

OAuth-session logins via `vercel login` cannot create tokens.
The classic token must be created at
https://vercel.com/account/tokens with full-account scope.

## Supabase

The Supabase project is `fsxdduvwshirrheenmag` on the cloud
free tier. Configuration lives in
[`supabase/config.toml`](../supabase/config.toml) and the
Supabase dashboard.

### Local CLI

```bash
# Link to the cloud project (CI uses SUPABASE_ACCESS_TOKEN)
supabase link --project-ref fsxdduvwshirrheenmag

# Check local migrations vs remote
supabase migration list --linked

# Push a new migration
supabase db push --db-url "$STAGING_SUPABASE_DB_URL"

# Regenerate types/supabase.ts
supabase gen types typescript --db-url "$STAGING_SUPABASE_DB_URL" > types/supabase.ts
```

The staging workflow runs the first three commands. The
generated types are committed to the repo; the staging
workflow's `validate-types-sync` job fails if the committed
file drifts from the remote.

### Connection topology

- **Direct connection** (`db.fsxdduvwshirrheenmag.supabase.co:5432`):
  IPv6-only. Works from GitHub Actions runners (which have IPv6)
  but **not from typical local Linux boxes**.
- **Transaction-mode pooler** (`aws-1-ap-southeast-1.pooler.supabase.com:6543`):
  IPv4-accessible, but the connection pooler can leave orphan
  prepared statements (e.g. `lrupsc_1_0`) that block
  `supabase db pull`.
- **Session-mode pooler** (`aws-1-ap-southeast-1.pooler.supabase.com:5432`):
  IPv4-accessible, each client gets a dedicated connection, no
  prepared statement leak. **This is what CI uses.**

Both workflows rewrite the URL inline to use the session-mode
pooler:

```bash
sed 's/:6543/:5432/' <<<"$STAGING_SUPABASE_DB_URL"
```

### Migrations

`supabase/migrations/` currently has:

1. `001_initial_schema.sql` — comment-only placeholder. The
   original schema (tables, RLS, signup trigger) was applied
   via the Supabase dashboard and never committed. See
   [DATABASE.md](./DATABASE.md#migration-history) for
   recovery steps.
2. `002_update_free_tier_limit_to_10.sql` — real migration with
   the `check_free_tier_lead_limit()` trigger.

To add a new migration:

1. Write the SQL in `supabase/migrations/NNN_description.sql`.
2. Test locally with `supabase db reset` and a local Postgres,
   or apply to a sandbox project.
3. Open a PR; the staging workflow applies it on merge to
   `develop`.
4. Verify the trigger behavior in the Supabase dashboard's
   Table Editor (or via `psql`).
5. Bump `types/supabase.ts` by re-running
   `supabase gen types typescript` and committing the diff.

## PayMongo

### Configuration

- **Dashboard:** https://dashboard.paymongo.com
- **API version:** `2019-08-01` (default PayMongo API version).
- **Webhook endpoint:** `https://agent-flow.app/api/paymongo/webhook`
  (Production). Preview deploys use the same webhook endpoint on
  the live domain — PayMongo does not support per-preview webhooks.
- **Handled events:** `subscription.created`, `subscription.updated`,
  `subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
  See [API-REFERENCE.md](./API-REFERENCE.md#paymongo).

### Setting up PayMongo Subscriptions

1. Email `support@paymongo.com` requesting Subscriptions API access.
2. Once enabled, configure `PAYMONGO_SECRET_KEY` and
   `PAYMONGO_WEBHOOK_SECRET` in Vercel.
3. Create two products in the PayMongo dashboard:
   - **Pro Monthly** — ₱450/mo (≈$8 USD)
   - **Pro Annual** — ₱4,500/yr (≈$80 USD, 2 months free)
4. Set up the webhook endpoint to point to
   `https://agent-flow.app/api/paymongo/webhook` and subscribe to
   `subscription.*` and `invoice.*` events.

### Test card numbers

| Card number | Use case |
| --- | --- |
| `4120000000000007` | Successful payment |
| `4120000000000018` | Insufficient funds |
| `4120000000000026` | Generic decline |

## Resend

### Configuration

- **Dashboard:** https://resend.com
- **Domain:** `agent-flow.app` must be verified (SPF + DKIM
  records) before the digest sender
  `AgentFlow <daily@agentflow.app>` will deliver.
- **API key:** `RESEND_API_KEY`, server-only.

### Daily digest cron

The digest is sent by `GET /api/cron/daily-digest` and
authenticated by `Authorization: Bearer ${CRON_SECRET}`. The
schedule is configured externally — Vercel Cron is the
recommended option:

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/daily-digest", "schedule": "0 13 * * *" }
  ]
}
```

The default `13:00 UTC` is 8 AM ET / 5 AM PT. Change the
schedule string per
https://vercel.com/docs/cron-jobs/manage-cron-jobs#cron-expression.

## Cloudflare Turnstile

- **Dashboard:** https://dash.cloudflare.com/?to=/:account/turnstile
- **Site key:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public, set on
  Vercel Production + Local).
- **Secret key:** stored in the Supabase project (Supabase's
  captcha verification feature uses it server-side). Not
  committed to the repo.
- **Widget domain allowlist:** `agent-flow.app`,
  `*.vercel.app`, `localhost` (in the Cloudflare Turnstile
  site settings).

The widget is in **Invisible mode** for production (no
checkbox / no puzzle; Cloudflare decides whether to show a
challenge based on risk signals). In e2e / preview, the
`NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true` flag auto-fires
`onSuccess` with a stub token.

## Sentry

- **Dashboard:** https://sentry.io
- **Org + project:** set via `SENTRY_ORG` + `SENTRY_PROJECT` env
  vars on Vercel.
- **DSN:** `NEXT_PUBLIC_SENTRY_DSN`. The Sentry SDK only
  initializes in production (`enabled: process.env.NODE_ENV === "production"`)
  and only the relevant subset is bundled into each build
  (server / client / edge).
- **Release upload:** the `production-release.yml` workflow runs
  `sentry-cli releases new <release>` and
  `sentry-cli upload-sourcemaps` after the Vercel deploy. The
  Sentry auth token is `SENTRY_AUTH_TOKEN` (CI-only).

Source maps are **uploaded to Sentry** but **not exposed in the
public bundle** (handled by `withSentryConfig()`'s default
`hideSourceMaps: true`).

## Vercel Analytics + Speed Insights

- **Analytics:** `@vercel/analytics/react` mounted in
  `src/app/layout.tsx`.
- **Speed Insights:** `@vercel/speed-insights/next` mounted in
  `src/app/layout.tsx`.

Both are free on the Vercel hobby tier and require no
configuration beyond the npm install. To disable either, remove
the component from `layout.tsx`.

## CI workflows

All workflows are in `.github/workflows/`. Each runs on the
appropriate trigger and is expected to take under 3 minutes for
a normal PR.

### `pr-gatekeeper.yml`

Triggers: PR opened/synchronized against `develop` or `main`.

Jobs:

- **lint-typecheck** — `next lint` + `tsc --noEmit`.
- **build** — `next build` with placeholder env vars. Catches
  CSR-bailout errors that lint + tsc miss.
- **unit-tests** — `npm test` (Vitest). Depends on `build`
  passing.
- **coverage-gate** — Vitest's `json-summary` reporter output
  is checked against 80% threshold (lines, branches, functions,
  statements).
- **security-audit** — `npm audit --omit=dev --audit-level=critical`.
  Production-only, critical-only.
- **lighthouse-ci** — runs `lhci autorun` against
  `lighthouserc.json`. Best-effort (continues on error).
- **pr-comment** — posts a summary table to the PR.
- **preview-deploy** — applies migrations, deploys a Vercel
  preview, runs e2e tests. Requires all 4 of
  `SUPABASE_ACCESS_TOKEN`, `PREVIEW_SUPABASE_DB_URL`,
  `STAGING_SUPABASE_DB_URL`, `VERCEL_TOKEN` to be set on GitHub
  Actions. Skipped if any are missing.

### `staging-promotion.yml`

Triggers: push to `develop`.

Jobs:

- **migration-preflight** — `supabase link` + `supabase migration list`.
- **apply-staging-migrations** — `supabase db push` against
  the staging DB.
- **validate-types-sync** — `supabase gen types` against the
  staging DB, compared to the committed `types/supabase.ts`.
- **vercel-staging-deploy** — `vercel pull --environment=preview`
  + `vercel build` + `vercel deploy --prebuilt` (no `--prod`!
  this is the staging env, not the live site).
- **e2e-test-matrix** — runs Playwright against the preview URL.
  Files are sharded: `auth-pipeline`, `csv-import`.
- **e2e-report-merge** — combines Playwright reports and posts
  to the workflow run.

### `production-release.yml`

Triggers: push to `main` (auto), or manual `workflow_dispatch`
with a `version_bump` input (`patch` | `minor` | `major`).

Jobs:

- **validate** — lint, typecheck, unit tests, build.
- **deploy-to-vercel** — `vercel deploy --prod --yes`.
- **post-deploy-smoke** — curls the deployed app's key URLs.
  Skipped if `PRODUCTION_APP_URL` is empty.
- **create-release** — bumps the version in `package.json`,
  creates a GitHub release with the new tag (`vX.Y.Z`), and
  uploads the Sentry release + sourcemaps.

### `scheduled-health-check.yml`

Triggers: hourly cron.

One job: curls `/login`, `/api/health`, and `/manifest.json`
on `https://agent-flow.app`. Asserts HTTP 200 (or 302/307 for
`/login` if signed out). Fails the run on any non-2xx/3xx.

### `codeql.yml`

Triggers: weekly cron (`30 0 * * 4` = Thursdays 00:30 UTC) and
on push to `main`.

Runs CodeQL for `actions` and `javascript-typescript`.
Results are uploaded to the GitHub Security tab
(`security-events: write`).

## Required GitHub secrets

| Secret | Used by |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | `staging-promotion.yml`, `pr-gatekeeper.yml` |
| `STAGING_SUPABASE_DB_URL` | `staging-promotion.yml`, `pr-gatekeeper.yml` |
| `PREVIEW_SUPABASE_DB_URL` | `pr-gatekeeper.yml` |
| `VERCEL_TOKEN` | `staging-promotion.yml`, `pr-gatekeeper.yml`, `production-release.yml` |
| `SENTRY_AUTH_TOKEN` | `production-release.yml` |
| `PRODUCTION_APP_URL` | `production-release.yml` (optional — enables smoke test) |

Set with `gh secret set SECRET_NAME`. Never commit them.

## Release process

A production release follows this flow:

1. PR merged to `main` (or manual dispatch on `main` with a
   version bump input).
2. `production-release.yml` runs:
   - validate (lint, typecheck, test, build) — must pass
   - deploy to Vercel production (`vercel deploy --prod --yes`)
   - post-deploy smoke (if `PRODUCTION_APP_URL` is set)
   - create GitHub release + Sentry release
3. Vercel auto-deploys a domain alias for `agent-flow.app`.
4. `scheduled-health-check.yml` runs at the next hour mark
   and confirms the deploy is live.

To roll back: use Vercel's "Promote to Production" on a
previous deploy, or `vercel rollback <deployment-url>`.

## Custom domain

`agent-flow.app` is registered on Namecheap. DNS:

- **A record:** `76.76.21.21` (Vercel)
- **CNAME:** `cname.vercel-dns.com` for `www`

Vercel provisions the SSL certificate automatically. To check
DNS:

```bash
dig agent-flow.app +short
dig www.agent-flow.app +short
```

## What to read next

- [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) — the
  full env matrix per service.
- [SECURITY.md](./SECURITY.md) — secret rotation and CSP.
- [TESTING.md](./TESTING.md) — what the CI workflows test.
