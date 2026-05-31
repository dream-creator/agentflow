# AgentFlow — "The CRM for agents who hate CRMs"

## Tech Stack
- **Framework:** Next.js 14.2.3 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS 3.4.x (Teal #0F766E primary, Sky #0369A1 accent)
- **Database:** Supabase Cloud (project: fsxdduvwshirrheenmag) — PostgreSQL with RLS
- **Auth:** Supabase Auth — Magic Link OTP + Google OAuth
- **Payments:** Stripe 16.x — $19/mo Pro tier
- **Email:** Resend 3.5.x
- **Hosting:** Vercel (https://agentflow-inky.vercel.app) + Supabase Cloud
- **CI/CD:** GitHub Actions — 4 workflows (pr-gatekeeper, staging-promotion, production-release, scheduled-health-check)
- **Monitoring:** Sentry error tracking + Vercel Analytics + Speed Insights
- **Testing:** Vitest (124 unit tests) + Playwright (11 E2E auth tests + 5 load tests)

## Project Status
- Phase 1-3: 100% complete
- Phase 4 (Production): 60% complete
- Build: Passing, lint clean, 140 tests (96.68% coverage)
- **LIVE:** https://agentflow-inky.vercel.app

## Key Directories
- `src/app/` — 21 routes (landing, auth, dashboard, API)
- `src/lib/` — stripe.ts, resend.ts, utils.ts, validations.ts, rate-limiter.ts
- `src/hooks/` — useLeads.ts, useProfile.ts, useActions.ts
- `src/components/` — UI components
- `tests/` — unit/, e2e/, load/
- `.github/workflows/` — 4 CI/CD workflows

## Conventions
- Use Lucide React icons (no emoji)
- Zod for API input validation
- Lazy init for Stripe/Resend/Supabase client (build-time safe)
- In-memory rate limiting
- SVG PWA icons with gradient

## CRITICAL ISSUES (Highest Priority)

### Google OAuth Login Broken
- **Status:** UNRESOLVED — highest priority
- **Symptom:** Google login redirects to `/?code=...` instead of `/auth/callback?code=...`
- **Error:** User lands on root URL with code parameter, page freezes
- **Supabase config verified correct via API:**
  - site_url: `https://agentflow-inky.vercel.app` ✓
  - uri_allow_list: `/auth/callback` and `/**` ✓
  - Google OAuth enabled: true ✓
  - Google client ID: `89182633418-9mcj8uptevu2ifkl6uctkb7p7qr3oo8d.apps.googleusercontent.com` ✓
- **Google Cloud Console redirect URI:** `https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback` ✓
- **Callback route works:** `/auth/callback` returns 307 when tested via curl ✓
- **What's NOT working:** Supabase is redirecting to Site URL (`/`) instead of the `redirectTo` parameter (`/auth/callback`)
- **Possible causes to investigate:**
  1. Supabase `signInWithOAuth` not passing `redirectTo` correctly
  2. The `getOAuthRedirectTo()` function might return a relative path during SSR
  3. The `createClient()` in callback route returns null during prerendering, causing silent failure
  4. Middleware might be intercepting the callback route
- **Files to check:**
  - `src/lib/auth.ts` — `getOAuthRedirectTo()` function
  - `src/app/auth/callback/route.ts` — callback handler
  - `src/lib/supabase/server.ts` — server client creation
  - `src/lib/supabase/middleware.ts` — middleware auth check
  - `src/app/(auth)/login/page.tsx` — Google OAuth call
  - `src/app/(auth)/signup/page.tsx` — Google OAuth call

## CI/CD Gotchas (Lessons Learned)
- **Sentry config:** `withSentryConfig()` in `next.config.mjs` must be conditional — crashes Vercel build if `SENTRY_ORG`/`SENTRY_PROJECT` aren't set
- **Supabase client:** Must use lazy init pattern in auth pages — `createClient()` called at component top-level crashes during Next.js prerendering (env vars unavailable server-side). Use `getSupabase = () => createClient()` and call inside event handlers only. In `client.ts`, return a stub `{}` object during SSR prerendering (when `typeof window === "undefined"`) instead of throwing — the real client initializes on the client side where `NEXT_PUBLIC_` vars are available. In `server.ts` and `middleware.ts`, check for env vars before calling `createServerClient()` and return early if missing.
- **Staging workflow:** Avoid `case` shell statements with `${{ matrix.* }}` inline expansion — use `if/elif` with env vars instead (GitHub Actions YAML validator rejects it)
- **Shell scripts in YAML:** Pass GitHub expressions as `env:` vars, reference via `$VAR` in shell — never inline `${{ }}` in shell syntax

## Environment Variables (Vercel)
All set for Production + Development on `agentflow` project:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://fsxdduvwshirrheenmag.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (set)
- `SUPABASE_SERVICE_ROLE_KEY` = (set)
- `NEXT_PUBLIC_APP_URL` = `https://agentflow-inky.vercel.app`

**Still needed:**
- `STRIPE_SECRET_KEY` (not configured yet)
- `STRIPE_WEBHOOK_SECRET` (not configured yet)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (not configured yet)
- `RESEND_API_KEY` (not configured yet)

## Design Tools (ECC Skills)
- **ui-ux-pro-max**: Primary design system — use for new pages, components, color/typography decisions
- **hallmark**: Anti-AI-slop audit + design DNA extraction — use for review and competitor analysis

### Hallmark Workflows
- `hallmark audit <target>` — Score existing page against 65 anti-pattern gates (no edits, punch list only)
- `hallmark study <screenshot|URL>` — Extract design DNA (macrostructure, type, color) from inspiration
- `hallmark redesign <target>` — Rebuild page keeping content, replacing visual structure
- Store extracted DNA in `design-system/` directory for future reference
- Keep existing Tailwind + Teal/Sky tokens — Hallmark is reference, not replacement

## Session History
### May 31, 2026 Session (22 observations)
1. Created `opencode.json` with skill paths
2. Created `AGENTS.md` with project context
3. Installed Hallmark skill for audit/study/redesign workflows
4. Created `design-system/` directory for extracted DNA
5. Analyzed Hallmark repo — decided to use as reference tool, not replacement
6. Generated BUSL 1.1 LICENSE file (replaced MIT), removed outdated LICENSING file
7. Updated README license section with full BUSL 1.1 details
8. Fixed staging-promotion.yml YAML error (line 230): replaced `case` with `if/elif` + env var
9. Fixed Vercel production build crash: conditional Sentry config in next.config.mjs
10. Fixed Vercel production build crash: lazy Supabase client in auth pages (login/signup)
11. Fixed Vercel production build crash: stub Supabase client during SSR prerendering (all dashboard pages)
12. All fixes pushed to main — 140 tests passing, build clean
13. Migrated from MIT to BUSL 1.1 license
14. Updated README with full BUSL 1.1 details
15. Deleted outdated LICENSING file
16. Set up Supabase CLI (v2.102.0)
17. Configured Vercel env vars via CLI for agentflow project
18. Deleted startupvo1 Vercel project
19. Verified agentflow deployment — all routes working (login, signup, dashboard, API)
20. Configured Google OAuth in Supabase and Google Cloud Console
21. Investigated Google OAuth redirect issue — code lands on root instead of /auth/callback
22. **UNRESOLVED:** Google OAuth login still broken — Supabase redirects to Site URL instead of redirectTo parameter
