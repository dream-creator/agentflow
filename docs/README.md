# AgentFlow Documentation

AgentFlow ("The CRM for agents who hate CRMs") — a focused, mobile-first CRM
for solo real estate professionals.

---

## Quick links

| I want to... | Read this |
| --- | --- |
| Set up the dev environment | [Onboarding](./getting-started/onboarding.md) |
| Understand the system architecture | [Architecture](./guides/architecture.md) |
| Look up an API endpoint | [API Reference](./guides/api-reference.md) |
| Find an environment variable | [Environment Variables](./getting-started/environment-variables.md) |
| See what changed recently | [Changelog](https://agent-flow.app/changelog) |

---

## Getting started

Start here if you're new to the project.

| Document | What it covers |
| --- | --- |
| [Onboarding](./getting-started/onboarding.md) | Prerequisites, install, first dev server, common tasks, troubleshooting |
| [Environment Variables](./getting-started/environment-variables.md) | Full env-var matrix — what's required, what's public, where each is set |

## Guides

Deep dives into each subsystem. Read in any order after onboarding.

| Document | What it covers |
| --- | --- |
| [Architecture](./guides/architecture.md) | High-level system design, tech stack, folder map, request lifecycle, data model, design tokens |
| [Architecture Flow](./guides/architecture-flow.md) | Mermaid diagrams mapping runtime flows — system topology, auth, checkout, cron |
| [Authentication](./guides/authentication.md) | Supabase auth (magic link / Google / password / passkey), middleware, PKCE callback, Turnstile captcha |
| [Database](./guides/database.md) | Tables, RLS, plan-limit trigger, generated types, migration history |
| [API Reference](./guides/api-reference.md) | Every route handler — method, path, request/response shape, auth, rate limits, error semantics |
| [Components & Hooks](./guides/components-and-hooks.md) | Catalog of every React component and custom hook with props, signature, and purpose |
| [Security](./guides/security.md) | Defense-in-depth layers, CSP, headers, captcha, rate limiting, secret management |
| [Deployment](./guides/deployment.md) | CI/CD pipelines, Vercel, Supabase, PayMongo, Resend, Sentry, branch/env topology |
| [Testing](./guides/testing.md) | Vitest unit + Playwright e2e patterns, auth fixture, coverage gates, Lighthouse CI |
| [Feature Flags](./guides/feature-flags.md) | Per-flag status, env-var matrix, how to add a new flag |
| [PWA](./guides/pwa.md) | Manifest, service worker, install prompt, icon assets |

## Architecture

Decision records and visual diagrams.

| Document | What it covers |
| --- | --- |
| [Architecture Decision Records](./architecture/adr/README.md) | Why the code looks the way it does — context, alternatives, consequences |
| [ADR-0001: Env-var Feature Flags](./architecture/adr/0001-env-var-feature-flags.md) | Why we chose env vars over LaunchDarkly / DB-backed flags |
| [Architecture Diagrams](./architecture/diagrams/) | Rendered Mermaid diagrams (PNG/SVG) — system topology, auth flow, DB schema ERD |

---

## Recommended reading order

For new developers, read in this order:

1. **[Onboarding](./getting-started/onboarding.md)** — get the dev environment running.
2. **[Architecture](./guides/architecture.md)** — understand the system at a high level.
3. **[Database](./guides/database.md)** — learn the data model and the plan-tier
   enforcement pattern (enforced in 3 places: client UI, server API,
   Postgres trigger).
4. **[Authentication](./guides/authentication.md)** — auth is the most complex
   single subsystem. Middleware, captcha, and PKCE callback all interact
   in ways that aren't obvious from any one file.
5. **[API Reference](./guides/api-reference.md)** — round out the back end.
6. **[Components & Hooks](./guides/components-and-hooks.md)** — the UI layer.

## Cross-cutting concepts

A few patterns are referenced from every page. Knowing these up front makes
the rest easier to read.

- **Two Supabase clients.** `src/lib/supabase/client.ts` is the browser
  singleton (lazy, safe on SSR — returns `{}` if env vars are missing).
  `src/lib/supabase/server.ts` is the server-only client (cookie-bound;
  throws if env vars are missing). `src/lib/supabase/middleware.ts` is
  the edge-runtime client used in `src/middleware.ts` to gate routes.
  See [Authentication — Supabase clients](./guides/authentication.md#supabase-clients).

- **Three-layer plan-limit enforcement.** Free tier is capped at 10
  active leads and 10 pipelines (`PLAN_LIMITS` in
  `src/lib/constants.ts`). The cap is enforced in (1) the client UI via
  `checkPlanLimit()` before insert, (2) the server API in
  `src/app/api/leads/route.ts` before insert, and (3) a Postgres
  trigger `check_free_tier_lead_limit()` in
  `supabase/migrations/002_update_free_tier_limit_to_10.sql`. See
  [Database — plan-tier enforcement](./guides/database.md#plan-tier-enforcement).

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
  [Security — Content Security Policy](./guides/security.md#content-security-policy).

---

## Directory structure

```
docs/
├── README.md                              (you are here)
├── getting-started/
│   ├── onboarding.md                      first-time dev setup
│   └── environment-variables.md           env-var matrix
├── guides/
│   ├── architecture.md                    system design & tech stack
│   ├── architecture-flow.md               Mermaid runtime flows
│   ├── authentication.md                  auth, middleware, captcha
│   ├── database.md                        schema, RLS, migrations
│   ├── api-reference.md                   route handlers
│   ├── components-and-hooks.md            UI catalog
│   ├── security.md                        defense-in-depth
│   ├── deployment.md                      CI/CD & release
│   ├── testing.md                         test patterns
│   ├── feature-flags.md                   flag operations
│   └── pwa.md                             PWA setup
└── architecture/
    ├── adr/                               decision records
    │   ├── README.md
    │   ├── template.md
    │   └── 0001-env-var-feature-flags.md
    └── diagrams/                          rendered Mermaid diagrams
```

## Source of truth

| Concern | File |
| --- | --- |
| Brand & product description | [`README.md`](../README.md) |
| Design tokens | [`design-system/agentflow/MASTER.md`](../design-system/agentflow/MASTER.md) |
| License | [`LICENSE`](../LICENSE) (BUSL 1.1) |
| Env template | [`.env.local.example`](../.env.local.example) |
