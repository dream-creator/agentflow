# Security

AgentFlow's security posture. This document covers the
defense-in-depth layers, the headers that bind them together, and
the kill switches for emergencies.

## Layers

| Layer | What it does | Where |
| --- | --- | --- |
| Edge middleware | Redirects unauth users from protected paths; refreshes auth cookies | `src/middleware.ts` + `src/lib/supabase/middleware.ts` |
| Supabase Row Level Security | Database rows are scoped to `auth.uid()`; the anon key can't read across users | `leads`, `actions`, `profiles` tables |
| Captcha (Turnstile) | Prevents bot traffic on magic-link + Google OAuth + sign-in pages | `src/components/turnstile-widget.tsx` |
| Server-side plan enforcement | Server API re-checks the plan tier before any insert | `src/app/api/leads/route.ts` |
| Postgres trigger | Final DB-level enforcement of the free-tier lead cap | `supabase/migrations/002_*.sql` |
| Zod input validation | Invalid request bodies are rejected before reaching Supabase | `src/lib/validations.ts` |
| Rate limiting | In-memory per-user rate limit on `GET /api/leads` | `src/lib/rate-limiter.ts` |
| Security headers | CSP, HSTS, COOP, CORP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy | `next.config.mjs` |
| PayMongo webhook signature | Prevents forged webhook events (HMAC-SHA256) | `src/app/api/paymongo/webhook/route.ts` |
| Service-role key isolation | Only used server-side; never inlined in client bundle | Env var, no `NEXT_PUBLIC_` prefix |
| Sentry lazy load | Sentry SDK only loaded on actual errors (in `global-error.tsx`) | `src/app/global-error.tsx` |

## Content Security Policy

Defined globally in `next.config.mjs`. Adding a new third-party
service (analytics, captcha, OAuth provider) almost always requires
updating the CSP.

The policy is split across:

- **`default-src 'self'`** — only same-origin by default.
- **`script-src`** — `'self'`, Sentry, Vercel Insights,
  Cloudflare Turnstile challenges, plus inline `'unsafe-inline'`
  and `'unsafe-eval'` for Next.js hydration. **TODO: switch to
  nonce-based script-src** before adding a strict-dynamic
  requirement.
- **`style-src`** — `'self' 'unsafe-inline'` (Tailwind generates
  inline styles; not removable without a build change).
- **`img-src`** — `'self' data: https:` (allows Supabase Storage
  and external lead photos in the future).
- **`connect-src`** — `'self'`, Supabase project URL, Sentry
  ingestion endpoints, Vercel Analytics, Cloudflare Turnstile
  challenges.
- **`frame-src`** — Cloudflare Turnstile challenges.
- **`worker-src`** — `'self' blob:` (the Turnstile iframe creates
  a worker).
- **`font-src`** — `'self' data:` (system fonts from
  `next/font/google` are served as data URIs or self-hosted by
  Next).
- **`object-src 'none'`**, **`base-uri 'self'`**,
  **`form-action 'self'`** — standard hardening.
- **`frame-ancestors 'none'`** — prevents clickjacking via
  iframe embedding.
- **`upgrade-insecure-requests`** — auto-upgrade HTTP → HTTPS
  for any sub-resource that slips through.

### Updating the CSP

When you add a new third-party script or iframe:

1. Identify which directive it needs (`script-src`, `frame-src`,
   `connect-src`, etc.).
2. Add the origin to that directive in `next.config.mjs`.
3. Test locally with `npm run dev` and check the browser console
   for CSP violations.
4. Verify on a Vercel preview deploy before merging.

The headers function in `next.config.mjs` returns the full set
on every response.

## Other security headers

In addition to CSP:

- **`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`** — HSTS for 2 years, includes subdomains, eligible for browser preload list.
- **`X-Frame-Options: DENY`** — same effect as `frame-ancestors 'none'`, kept for legacy browser support.
- **`X-Content-Type-Options: nosniff`** — prevents MIME-type sniffing.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — sends only the origin (not the full URL) on cross-origin navigations.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`** — disables powerful APIs we don't use.
- **`Cross-Origin-Opener-Policy: unsafe-none`** — needed for Supabase OAuth popups.
- **`Cross-Origin-Resource-Policy: cross-origin`** — allows Supabase assets to load from cross-origin contexts.

## Captcha

See [AUTHENTICATION.md](./AUTHENTICATION.md#turnstile-captcha) for
the full Turnstile flow. The relevant security points:

- Captcha is **enforced on every auth request** (magic link,
  Google OAuth, password). Supabase's project-level setting
  `security_captcha_enabled = true` causes the Supabase SDK to
  require a valid token.
- The widget is **lazy-loaded** so the Cloudflare script is only
  fetched on the login/signup pages.
- The widget has a **10-second timeout** in
  `src/components/turnstile-widget.tsx` that surfaces a Retry
  button if the script fails to load.
- The bypass env var `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS` is
  **never set in production** (only in Vercel Preview). The
  Production Supabase project also has captcha enforcement on,
  so a bypass token would be rejected.
- The kill switch `NEXT_PUBLIC_TURNSTILE_DISABLED` removes the
  widget entirely. **Use only for emergencies** (Cloudflare
  outage) — it disables all bot protection on auth.

## Rate limiting

`src/lib/rate-limiter.ts`:

- In-memory `Map<key, { count, resetAt }>`.
- 100 requests per 60s default for `leads:get`.
- Keyed by `user.id` (authenticated) or IP (unauthenticated, not
  currently used).

**Limitations:**

- **Process-local.** In Vercel's serverless deployment, the Map
  is recreated on each cold start. Rate limits are per-instance,
  not global. For a solo-agent CRM, this is fine; for scale,
  swap to Redis (Upstash has a generous free tier).
- **No backpressure on the key itself.** A key that exceeds the
  limit returns 429 but the counter keeps incrementing until the
  window resets.

**Currently applied:**

- `GET /api/leads` — 100 req / 60s per user.

**Where to add more:**

- `POST /api/leads` — currently unprotected. Add a 5 req / 60s
  limit to slow brute-force inserts.
- `POST /api/paymongo/checkout` — currently unprotected. Add a
  3 req / 60s limit to slow webhook-induced loop attacks.

## Input validation

`src/lib/validations.ts` defines Zod schemas:

- `leadSchema` — `POST /api/leads` body.
- `leadUpdateSchema` — `PUT /api/leads/[id]` body (all fields
  optional).
- `actionSchema` — used by the `useActions` hook for new actions.
- `actionUpdateSchema` — used by `useActions` for completion
  updates.

All schemas are `strict()`-equivalent (unknown keys are
stripped or rejected). Validation failures return 400 with the
parse error.

**Coverage:** every public API route validates its body. Hooks
(`useLeads`, `useProfile`, `useActions`) do **not** validate on
the client side — the API route does it server-side. This means
direct Supabase calls from the browser can skip validation, but
RLS still enforces ownership.

## Row Level Security

The RLS policies are in the lost migration 001
(see [DATABASE.md](./DATABASE.md#migration-history)). They are
inferred from the codebase but not directly visible in the
repo. The current observed behavior:

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | own row | trigger-only | own row | not exposed |
| `leads` | own rows | own user_id | own rows | own rows |
| `actions` | own rows | own user_id | own rows | not exposed |

In all cases the predicate is `auth.uid() = user_id` (or `id`
for `profiles`).

The service-role key bypasses RLS. It's used by:

- `src/lib/paymongo.ts` — update `profiles.plan` and
  `paymongo_customer_id` on subscription events.
- `src/lib/resend.ts` and `src/app/api/cron/daily-digest/route.ts` —
  query all users for the daily digest.
- `tests/e2e/fixtures/auth.ts` — test-only admin operations.

## Secret management

| Secret | Where stored | How exposed |
| --- | --- | --- |
| `PAYMONGO_SECRET_KEY` | Vercel Production env | Server only (no `NEXT_PUBLIC_` prefix). |
| `PAYMONGO_WEBHOOK_SECRET` | Vercel Production env | Server only. |
| `RESEND_API_KEY` | Vercel Production env | Server only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production env | Server only. |
| `CRON_SECRET` | Vercel Production env | Server only. |
| `SENTRY_AUTH_TOKEN` | GitHub Actions secret | CI only. |
| `VERCEL_TOKEN` | GitHub Actions secret | CI only. |
| `SUPABASE_ACCESS_TOKEN` | GitHub Actions secret | CI only. |
| Cloudflare Turnstile secret | Supabase project | Server-side, used by Supabase's captcha verification. |

`NEXT_PUBLIC_*` vars are inlined into the client bundle. Treat
them as public; never put a secret there. The Cloudflare
Turnstile **site** key is public; the **secret** key (stored in
Supabase, not in this repo) is what actually verifies tokens.

### Secret rotation

| Secret | How to rotate |
| --- | --- |
| PayMongo secret | PayMongo dashboard → API keys → regenerate. Update Vercel. |
| PayMongo webhook secret | PayMongo dashboard → webhooks → endpoint → rotate. Update Vercel. |
| Resend API key | Resend dashboard → API keys → revoke + re-create. Update Vercel. |
| Supabase service role | Supabase dashboard → Settings → API → service_role → reset. Update Vercel + all CI secrets. |
| Vercel token | Vercel dashboard → account tokens → revoke. Re-create and update GitHub Actions. |
| Cloudflare Turnstile secret | Cloudflare dashboard → Turnstile → site → rotate secret. Update Supabase. |

## Soft delete vs hard delete

Leads are soft-deleted (`is_active = false`, `deleted_at = now()`)
rather than hard-deleted. This preserves:

- The `actions` foreign key (a hard delete on a lead with
  actions would cascade and lose follow-up history).
- Audit trail (a deleted lead still shows up in
  `useLeads().fetchLeads()` filters that explicitly include
  inactive rows).
- Recoverability (undelete is a one-row update).

Hard delete is **not** exposed. The `deleteLead()` hook only
performs the soft delete.

## CSRF

Supabase cookies are `SameSite=Lax`, which is sufficient for
first-party auth flows (the cookie is sent on top-level
navigations to the same site). For state-changing routes, we
rely on:

- **CORS** — Vercel serves the same origin as the API, so no
  cross-origin POST can succeed.
- **SameSite=Lax** — the auth cookie is not sent on
  cross-origin POSTs.

If a future feature introduces a public API, add an explicit
CSRF token or origin check.

## XSS

- All user-provided strings (`lead.full_name`, `lead.notes`,
  `profile.full_name`) are rendered as React children, which
  auto-escapes. There is no `dangerouslySetInnerHTML` in the
  codebase.
- The CSV import uses `FileReader.readAsText`, which doesn't
  execute scripts.
- Email HTML in `src/lib/resend.ts` is built from a template
  string with **all dynamic values HTML-escaped** via the
  `escapeHtml()` helper. Never interpolate user input directly
  into the email template.

## Clickjacking

`frame-ancestors 'none'` in CSP + `X-Frame-Options: DENY` header
ensure the app can't be embedded in an iframe.

## Dependency security

- `package.json` has `overrides` for `tmp`, `uuid`, `glob`, and
  `minimatch` (dev dependencies only) to address npm audit
  findings on transitive deps.
- `npm audit` runs in the pr-gatekeeper CI on
  **production-only** deps with `--omit=dev --audit-level=critical`.
  Dev-only vulns don't block CI.
- `npm audit` failures are treated as build errors. Run
  `npm audit` locally before pushing.

## Git history

The following are gitignored to prevent accidental commits:

- `.env*`
- `supabase/.temp/`
- `supabase/config.toml` (contains OAuth client IDs and secret
  references)
- `playwright-report/`, `test-results/`, `coverage/`
- `scripts/debug-*.ts` (local investigation scripts)

If a secret was ever committed, rotate it and use
`git filter-repo --invert-paths --path <file>` to clean history.

## What to read next

- [AUTHENTICATION.md](./AUTHENTICATION.md) — the auth flow that
  these layers protect.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — where each secret is
  stored and how to rotate.
- [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) — the
  full env matrix.
