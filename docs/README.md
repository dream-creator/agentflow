# AgentFlow Documentation

AgentFlow ("The CRM for agents who hate CRMs") — a focused, mobile-first CRM
for solo real estate professionals. This directory contains the
codebase-level reference for the project.

> **Need a runtime flow overview?** See
> [`ARCHITECTURE-FLOW.md`](./ARCHITECTURE-FLOW.md) and the Mermaid
> diagrams in [`architecture-diagrams/`](./architecture-diagrams/) (they
> cover the same architecture at the request-flow level, not the
> code-level reference found here).

## Index

| Document | What it covers |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | High-level system architecture, tech stack, folder map, request lifecycle, data model, design tokens, deployment topology |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | Supabase auth (magic link / Google / password / passkey), middleware route gating, PKCE callback, Turnstile captcha, env kill-switches |
| [DATABASE.md](./DATABASE.md) | Tables, RLS, plan-limit trigger, types/supabase.ts consumption, migration history, regenerating schema |
| [API-REFERENCE.md](./API-REFERENCE.md) | Every route handler with method, path, request/response shape, auth, rate limit, error semantics |
| [COMPONENTS-AND-HOOKS.md](./COMPONENTS-AND-HOOKS.md) | Catalog of every component and hook with props, signature, purpose, and dependencies |
| [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) | Full env-var matrix (Supabase, PayMongo, Resend, Turnstile, Sentry, Cron, Captcha, App URL) with where each is consumed |
| [SECURITY.md](./SECURITY.md) | CSP, RLS, captcha, rate limiting, security headers, secret management, kill switches, Sentry DSN handling |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | CI/CD pipelines, Vercel + Supabase + PayMongo + Resend + Cloudflare Turnstile + Sentry configuration, branch / env topology |
| [PWA.md](./PWA.md) | `manifest.json`, service worker, install prompt, icon assets, off-screen Turnstile iframe |
| [TESTING.md](./TESTING.md) | Vitest unit + Playwright e2e patterns, project setup, auth fixture, captcha bypass, Lighthouse CI |
| [ONBOARDING.md](./ONBOARDING.md) | New-developer setup: install, env, dev workflow, common tasks, troubleshooting |
| [FEATURE-FLAGS.md](./FEATURE-FLAGS.md) | Per-flag status, env-var matrix, how to add a new flag (operational reference) |

### Architecture decision records

When a decision is significant enough to shape future code, it lives in
[`adr/`](./adr/). Each record captures the context, the decision, the
alternatives considered, and the consequences. See
[`adr/README.md`](./adr/README.md) for the conventions.

## Reading order

If you are new to the codebase, read in this order:

1. **[ONBOARDING.md](./ONBOARDING.md)** — get the dev environment running.
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — understand the system at a high level.
3. **[DATABASE.md](./DATABASE.md)** — learn the data model and the plan-tier
   enforcement pattern (it's enforced in 3 places: client UI, server API,
   Postgres trigger).
4. **[AUTHENTICATION.md](./AUTHENTICATION.md)** — auth is the most complex
   single subsystem. Middleware, captcha, and PKCE callback all interact
   in ways that aren't obvious from any one file.
5. **[API-REFERENCE.md](./API-REFERENCE.md)** — round out the back end.
6. **[COMPONENTS-AND-HOOKS.md](./COMPONENTS-AND-HOOKS.md)** — the UI layer.

## Cross-cutting concepts

A few patterns are referenced from every page. Knowing these up front makes
the rest easier to read.

- **Two Supabase clients.** `src/lib/supabase/client.ts` is the browser
  singleton (lazy, safe on SSR — returns `{}` if env vars are missing).
  `src/lib/supabase/server.ts` is the server-only client (cookie-bound;
  throws if env vars are missing). `src/lib/supabase/middleware.ts` is
  the edge-runtime client used in `src/middleware.ts` to gate routes.
  See [AUTHENTICATION.md](./AUTHENTICATION.md#supabase-clients).

- **Three-layer plan-limit enforcement.** Free tier is capped at 10
  active leads and 10 pipelines (`PLAN_LIMITS` in
  `src/lib/constants.ts`). The cap is enforced in (1) the client UI via
  `checkPlanLimit()` before insert, (2) the server API in
  `src/app/api/leads/route.ts` before insert, and (3) a Postgres
  trigger `check_free_tier_lead_limit()` in
  `supabase/migrations/002_update_free_tier_limit_to_10.sql`. See
  [DATABASE.md](./DATABASE.md#plan-tier-enforcement).

- **Lazy module pattern.** PayMongo and Resend are lazy-initialized in
  `src/lib/paymongo.ts` and `src/lib/resend.ts` so a missing API key
  doesn't crash `next build`. The Turnstile widget itself is
  `React.lazy` (in `src/components/turnstile-widget.tsx`) to keep
  the Cloudflare script out of the main bundle.

- **Hook-based client mutations.** The `src/hooks/` directory contains
  thin wrappers around the browser Supabase client. UI pages call
  these hooks instead of talking to Supabase directly so that the
  auth header / RLS context is consistent everywhere.

- **CSP and headers are global.** All security headers (CSP, HSTS,
  COOP, CORP, etc.) are defined once in `next.config.mjs`. Adding a
  third-party service (analytics, captcha, OAuth provider) almost
  always requires updating the CSP. See
  [SECURITY.md](./SECURITY.md#content-security-policy).

## File / folder convention

```
docs/
├── README.md                         (you are here)
├── ARCHITECTURE.md
├── AUTHENTICATION.md
├── DATABASE.md
├── API-REFERENCE.md
├── COMPONENTS-AND-HOOKS.md
├── ENVIRONMENT-VARIABLES.md
├── SECURITY.md
├── DEPLOYMENT.md
├── PWA.md
├── TESTING.md
├── ONBOARDING.md
├── FEATURE-FLAGS.md
├── ARCHITECTURE-FLOW.md              (existing, Mermaid runtime flow)
├── adr/                              (architecture decision records)
└── architecture-diagrams/            (existing, rendered PNG/SVG)
```

## Source-of-truth pointers

| Concern | File |
| --- | --- |
| Brand & product description | [`README.md`](../README.md) |
| Phase 3+4 gaps (already addressed) | [`ROADMAP-PHASES-3-4.md`](../ROADMAP-PHASES-3-4.md) |
| Design tokens (aspirational, see note) | [`design-system/agentflow/MASTER.md`](../design-system/agentflow/MASTER.md) |
| License | [`LICENSE`](../LICENSE) (BUSL 1.1) |
| Env template | [`.env.local.example`](../.env.local.example) |
