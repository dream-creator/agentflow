# Architecture

This document explains how AgentFlow fits together at a high level: the
runtime, the build, the data flow, and the design system. For deep dives
into a specific subsystem, follow the links to the dedicated docs.

## What AgentFlow is

A focused CRM for solo real estate professionals. The product surface
is small and deliberate:

- **Lead pipeline** with 6 stages (`new_lead`, `contacted`, `showing`,
  `offer`, `closed_won`, `closed_lost`).
- **Action follow-ups** that can be scheduled, completed, and filtered
  into "today" / "overdue" / "upcoming".
- **Quick actions** (call, text, email) on every lead card, which open
  native handlers via `tel:`, `sms:`, and `mailto:`.
- **CSV import** for moving from another CRM.
- **Daily digest email** (Resend) summarizing today's actions.
- **PWA install** on iOS/Android for one-tap entry from the home
  screen.
- **Free + Pro tiers** with plan limits enforced in three places
  (see [DATABASE.md](./database.md#plan-tier-enforcement)).

Product copy is in `src/app/page.tsx`, `src/app/privacy/page.tsx`,
`src/app/terms/page.tsx`, and the root `README.md`.

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 14.2.35** (App Router) | RSC + Route Handlers, Edge middleware. |
| Language | **TypeScript 5** strict | `@/*` alias → `./src/*`. |
| Styling | **Tailwind CSS 3.4** | Custom design tokens in `tailwind.config.ts` + `src/app/globals.css`. |
| Auth + DB | **Supabase** (`@supabase/ssr` 0.10.3) | Postgres + GoTrue + Row Level Security. |
| Payments | **PayMongo** | `$8/mo Pro tier. PayMongo API.` |
| Email | **Resend 6** | Daily digest sender `AgentFlow <daily@agentflow.app>`. |
| Validation | **Zod 4** | `src/lib/validations.ts`. |
| Drag & drop | **`@hello-pangea/dnd` 18** | Lazy-loaded on `/pipeline` only. |
| Captcha | **`@marsidev/react-turnstile` 1.5** | Lazy-loaded, with test bypass + kill switch. |
| Error tracking | **`@sentry/nextjs` 10** | Production-only, conditional in `next.config.mjs`. |
| Analytics | **`@vercel/analytics` + `@vercel/speed-insights`** | |
| Testing | **Vitest 4.1.7** (unit) + **Playwright** (e2e + load) | Coverage gate at 80%. |
| Lint | **ESLint** (`next/core-web-vitals`) | |
| CI | **GitHub Actions** | 5 workflows. See [DEPLOYMENT.md](./deployment.md). |
| Hosting | **Vercel** | Custom domain `https://agent-flow.app`. |
| License | **BUSL 1.1** | See `LICENSE`. |

## Folder map

```
startupvo1/
├── docs/                                documentation (you are reading it)
├── src/
│   ├── app/                             App Router routes
│   │   ├── page.tsx                     landing page (SSG)
│   │   ├── layout.tsx                   root layout, fonts, metadata
│   │   ├── globals.css                  design tokens, base styles
│   │   ├── error.tsx                    root error boundary
│   │   ├── global-error.tsx             fallback (Sentry lazy)
│   │   ├── not-found.tsx                404
│   │   ├── auth/callback/route.ts       PKCE exchange
│   │   ├── api/
│   │   │   ├── leads/route.ts           GET list, POST insert
│   │   │   ├── leads/[id]/route.ts      GET, PUT partial update
│   │   │   ├── paymongo/checkout/route.ts POST → Checkout Session
│   │   │   ├── paymongo/webhook/route.ts  signature-verified handler
│   │   │   ├── cron/daily-digest/route.ts   Bearer CRON_SECRET
│   │   │   └── health/route.ts          liveness
│   │   ├── (auth)/login/                magic-link + Google + password
│   │   ├── (auth)/signup/               OTP signup
│   │   ├── (dashboard)/                 gated layout
│   │   │   ├── dashboard/               "Today" follow-ups
│   │   │   ├── leads/                   list / new / [id] / [id]/edit / import
│   │   │   ├── pipeline/                DnD Kanban
│   │   │   ├── follow-ups/              overdue / today / upcoming
│   │   │   └── settings/                / /billing /profile/edit
│   │   ├── privacy/                     policy
│   │   ├── terms/                       terms
│   │   └── contact/                     support card
│   ├── components/
│   │   ├── ui/                          button, card, badge, toast,
│   │   │                                empty-state, skeleton, sw-register
│   │   ├── layout/                      dashboard-layout, sidebar,
│   │   │                                sticky-header, bottom-nav
│   │   ├── pipeline/dnd-board.tsx       Kanban (lazy via next/dynamic)
│   │   ├── auth/                        captcha-status-pill
│   │   ├── turnstile-widget.tsx         Turnstile wrapper (lazy)
│   │   └── auth-callback-rescue.tsx     /?code= → /auth/callback
│   ├── hooks/
│   │   ├── useLeads.ts                  fetchLeads/createLead/updateLead/deleteLead
│   │   ├── useProfile.ts                fetchProfile/updateProfile
│   │   ├── useActions.ts                fetchActions/createAction/completeAction
│   │   └── index.ts                     barrel
│   ├── lib/
│   │   ├── supabase/                    client (browser) / server (RSC) / middleware (edge)
│   │   ├── auth.ts                      getBrowserOrigin / getAuthCallbackUrl / getOAuthRedirectTo
│   │   ├── constants.ts                 PLAN_LIMITS
│   │   ├── plan-limit.ts                checkPlanLimit (client)
│   │   ├── validations.ts               Zod schemas
│   │   ├── rate-limiter.ts              in-memory Map, 100/60s default
│   │   ├── paymongo.ts                   singleton PayMongo + helpers
│   │   ├── resend.ts                    sendDailyDigest
│   │   ├── utils.ts                     cn, formatStage, getStageVariant
│   │   ├── route-error.tsx              shared error boundary component
│   │   └── format.ts
│   ├── types/index.ts                   re-exports Database, Json from ../../types/supabase
│   ├── middleware.ts                    edge middleware entry
│   └── sentry.client.config.ts          Sentry init (prod-only)
├── types/supabase.ts                    generated DB types
├── supabase/
│   ├── config.toml                      site_url, OAuth, JWT config
│   └── migrations/
│       ├── 001_initial_schema.sql       PLACEHOLDER (see DATABASE.md)
│       └── 002_update_free_tier_limit_to_10.sql
├── tests/
│   ├── unit/                            Vitest, 80% coverage gate
│   └── e2e/                             Playwright, 3 projects
├── public/                              sw.js, manifest.json, icons/
├── .github/workflows/                   5 workflows (see DEPLOYMENT.md)
├── lighthouserc.json                    perf budget for /, /login, /dashboard
├── playwright.config.ts                 projects: chromium/firefox/mobile-chrome
├── vitest.config.ts                     80% threshold, src/lib + src/app/api
├── tailwind.config.ts                   design tokens
├── next.config.mjs                      CSP, Sentry, image domains
├── tsconfig.json                        strict, @/* → ./src/*
├── postcss.config.mjs                   tailwindcss plugin
├── .eslintrc.json                       next/core-web-vitals
├── .env.local.example                   env template
├── README.md                            product description, features
├── ROADMAP-PHASES-3-4.md                Phase 3+4 tables (3.1.1–3.1.9)
└── LICENSE                              BUSL 1.1
```

## Request lifecycle

The agent runs on the Vercel edge network. For a typical authenticated
dashboard request:

```
Browser
  │
  ├── 1. GET /dashboard
  │
  ▼
Vercel Edge
  │
  ├── 2. src/middleware.ts runs (Edge runtime)
  │       │
  │       ├─ updateSession() refreshes Supabase auth cookies
  │       ├─ Path in /dashboard|/pipeline|/leads|/follow-ups|/settings?
  │       │    └─ no session → 307 → /login?redirect=/dashboard
  │       └─ Path in /login|/signup + already authed → 307 → /dashboard
  │
  ▼
Next.js Server (Node)
  │
  ├── 3. RSC render of (dashboard)/dashboard/page.tsx
  │       │   fetches leads via RSC if you swap from client fetching
  │       │   (current implementation is "use client" + useEffect)
  │       │
  │       └─ Returns HTML with streamed RSC payload
  │
  ▼
Browser
  │
  ├── 4. React hydrates
  │       └─ useEffect → supabase.from("leads").select(...)
  │       └─ useLeads() wraps that call, returns {data, error}
  │
  └── 5. User clicks drag in /pipeline
      └─ useLeads().updateLead({pipeline_stage}) → Supabase UPDATE
      └─ Postgres trigger check_free_tier_lead_limit fires on INSERT
         (drag is an UPDATE, so the trigger is inert on drag — but
         it WILL fire if any future code path tries to bypass the
         API limit check)
```

For the auth flow specifically, see
[AUTHENTICATION.md](./authentication.md#request-lifecycle).

## Data model

There are three real tables (`profiles`, `leads`, `actions`) and one
Postgres function (`check_free_tier_lead_limit`). The full schema is
in `types/supabase.ts` (generated) and described in
[DATABASE.md](./database.md). The data model is intentionally narrow:

- **`profiles`** (1:1 with `auth.users`): `id`, `email`, `full_name`,
  `plan`, `paymongo_customer_id`, `created_at`, `updated_at`.
- **`leads`** (n:1 to `profiles`): `id`, `user_id`, `full_name`,
  `email`, `phone`, `pipeline_stage`, `source`, `notes`, `next_action`,
  `next_action_date`, `is_active`, `created_at`, `updated_at`,
  `deleted_at`.
- **`actions`** (n:1 to `leads` and `profiles`): `id`, `user_id`,
  `lead_id`, `action_type`, `description`, `due_date`, `completed`,
  `completed_at`, `created_at`.

The `is_active` + `deleted_at` pair is used to soft-delete leads
without breaking the `actions` foreign key.

## Design system

Tailwind tokens in `tailwind.config.ts` define the palette. The full
list lives in `src/app/globals.css` as CSS custom properties.

| Token | Value | Used for |
| --- | --- | --- |
| `primary` | teal `#0F766E` | Brand, links, focus rings, status badges |
| `cta` | orange `#F97316` | Primary action buttons (`btn-primary`, `<Button primary>`) |
| `accent` | sky `#0369A1` | Secondary accents |
| `surface` | slate scale | Backgrounds (`-50` → `-900`) |
| `destructive` | red | Destructive action variants |
| `warning` | amber | Warning badges |
| `success` | green | Success toasts, badges |

Fonts: **Inter** (body) + **Plus Jakarta Sans** (headings), loaded via
`next/font/google` in `src/app/layout.tsx`. Border radius tokens
`rounded-card: 10px`, `rounded-button: 10px`. **Flat design** — cards
use `border border-surface-200`, not shadows.

> **Note on `design-system/agentflow/MASTER.md`.** That file describes
> an aspirational palette (purple `#7C3AED`, Fira Code/Sans fonts) that
> does not match the running app. It was generated by the `ui-ux-pro-max`
> skill on 2026-06-03 and is intended for a future realignment. The
> tokens actually shipped are the Tailwind ones above.

## Cross-cutting patterns

### Lazy init for third-party SDKs

`src/lib/paymongo.ts`, `src/lib/resend.ts`, and `src/components/turnstile-widget.tsx`
all use lazy initialization. This is critical for `next build` —
`PAYMONGO_SECRET_KEY` is not present in CI's environment, so a top-level
`new PayMongo(...)` would crash the build. The pattern is:

```ts
let paymongoInstance: PayMongo | null = null;
export function getPayMongo(): PayMongo {
  if (!paymongoInstance) {
    paymongoInstance = new PayMongo(process.env.PAYMONGO_SECRET_KEY!, { ... });
  }
  return paymongoInstance;
}
```

### Singleton browser Supabase client

`src/lib/supabase/client.ts` returns a memoized client. On SSR (no
`window`) it returns an empty object cast to `SupabaseClient` so the
module can be imported from anywhere without `window is not defined`
errors. Server code should never use this — use `src/lib/supabase/server.ts`
instead.

### Three-layer plan-tier enforcement

The free tier is capped at 10 active leads and 10 active pipelines.
Enforced in three places (so a single bug doesn't break billing):

1. **Client** — `checkPlanLimit()` in `src/lib/plan-limit.ts`, called
   in `leads/new/page.tsx` and `leads/import/page.tsx` before insert.
2. **Server** — `src/app/api/leads/route.ts` POST handler calls
   `checkPlanLimit()` again before insert.
3. **Database** — `check_free_tier_lead_limit()` plpgsql trigger in
   `supabase/migrations/002_update_free_tier_limit_to_10.sql` raises
   an exception if a free user tries to insert and active count >= 10.

All three read the same `PLAN_LIMITS` constant.

### Hook-based client mutations

`src/hooks/{useLeads,useProfile,useActions}.ts` wrap the browser
Supabase client and enforce:

- `user_id` is taken from `auth.getUser()` (never trusted from the
  request body).
- Soft-delete is the only delete (sets `is_active=false` +
  `deleted_at`).
- `Row` types from `types/supabase.ts` are returned directly, so
  components get full type safety.

Components import named functions from the hook (e.g.
`createLead(...)`) rather than the Supabase client. This means if
the data layer changes (e.g. a future move to a Server Action), only
the hooks need to change.

### Pub/sub toast system

`src/components/ui/toast.tsx` exposes a `showToast()` function backed
by a module-level `toastListeners` array. `ToastContainer` (mounted in
`DashboardLayout`) subscribes and re-renders on each publish. This
avoids needing a React Context for cross-page toasts and means the
publisher doesn't need to be inside the provider tree.

## PWA

`public/manifest.json` declares the app as `standalone` with a teal
theme and 4 icon sizes (192, 512, 512 maskable, apple-touch). The
service worker `public/sw.js` is `CACHE_NAME="agentflow-v1"`,
network-first for navigation with cache fallback, and skips
`/api/*`, cross-origin, and non-GET requests. Registered lazily in
`src/components/ui/sw-register.tsx`. See [PWA.md](./pwa.md).

## Build, test, deploy

- **Build:** `npm run build` — Next.js production build. Strips
  server-only code from the client bundle.
- **Unit tests:** `npm test` (Vitest, watch) / `npm run test:coverage`
  (with v8 coverage, 80% threshold).
- **E2E tests:** `npm run test:e2e` (Playwright, 3 projects:
  chromium/firefox/mobile-chrome). Requires live Supabase service-role
  key.
- **Lighthouse:** `lighthouserc.json` runs against `/`, `/login`,
  `/dashboard`. Budget: perf ≥ 0.7, a11y ≥ 0.9, best-practices ≥ 0.9,
  seo ≥ 0.8.
- **Deploy:** GitHub Actions → Vercel. See
  [DEPLOYMENT.md](./deployment.md).

## What to read next

- [AUTHENTICATION.md](./authentication.md) — the most complex single
  subsystem.
- [DATABASE.md](./database.md) — the data model and plan-tier
  enforcement trigger.
- [API-REFERENCE.md](./api-reference.md) — the route handlers.
- [ONBOARDING.md](../getting-started/onboarding.md) — get the dev environment running.
