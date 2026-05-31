# AgentFlow — "The CRM for agents who hate CRMs"

## Tech Stack
- **Framework:** Next.js 14.2.3 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS 3.4.x (Teal #0F766E primary, Sky #0369A1 accent)
- **Database:** Supabase Cloud — PostgreSQL with RLS
- **Auth:** Supabase Auth — Magic Link OTP + Google OAuth
- **Payments:** Stripe 16.x — $19/mo Pro tier
- **Email:** Resend 3.5.x
- **Hosting:** Vercel (https://startupvo1.vercel.app)

## Project Status
- Phase 1-3: 100% complete
- Phase 4 (Production): 60% complete
- Build: Passing, lint clean, 140 tests (96.68% coverage)

## Key Directories
- `src/app/` — 21 routes (landing, auth, dashboard, API)
- `src/lib/` — stripe.ts, resend.ts, utils.ts, validations.ts, rate-limiter.ts
- `src/hooks/` — useLeads.ts, useProfile.ts, useActions.ts
- `src/components/` — UI components
- `tests/` — unit/, e2e/, load/
- `.github/workflows/` — 5 CI/CD workflows

## Conventions
- Use Lucide React icons (no emoji)
- Zod for API input validation
- Lazy init for Stripe/Resend/Supabase client (build-time safe)
- In-memory rate limiting
- SVG PWA icons with gradient

## CI/CD Gotchas (Lessons Learned)
- **Sentry config:** `withSentryConfig()` in `next.config.mjs` must be conditional — crashes Vercel build if `SENTRY_ORG`/`SENTRY_PROJECT` aren't set
- **Supabase client:** Must use lazy init pattern in auth pages — `createClient()` called at component top-level crashes during Next.js prerendering (env vars unavailable server-side). Use `getSupabase = () => createClient()` and call inside event handlers only. In `client.ts`, return a stub `{}` object during SSR prerendering (when `typeof window === "undefined"`) instead of throwing — the real client initializes on the client side where `NEXT_PUBLIC_` vars are available. In `server.ts` and `middleware.ts`, check for env vars before calling `createServerClient()` and return early if missing.
- **Staging workflow:** Avoid `case` shell statements with `${{ matrix.* }}` inline expansion — use `if/elif` with env vars instead (GitHub Actions YAML validator rejects it)
- **Shell scripts in YAML:** Pass GitHub expressions as `env:` vars, reference via `$VAR` in shell — never inline `${{ }}` in shell syntax

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
### May 31, 2026 Session
- Enabled ECC skills globally: 249 skills + ui-ux-pro-max + hallmark
- Created `opencode.json` with skill paths
- Created `AGENTS.md` with project context
- Installed Hallmark skill for audit/study/redesign workflows
- Created `design-system/` directory for extracted DNA
- Analyzed Hallmark repo — decided to use as reference tool, not replacement
- Generated BUSL 1.1 LICENSE file (replaced MIT), removed outdated LICENSING file
- Updated README license section with full BUSL 1.1 details
- Fixed staging-promotion.yml YAML error (line 230): replaced `case` with `if/elif` + env var
- Fixed Vercel production build crash: conditional Sentry config in next.config.mjs
- Fixed Vercel production build crash: lazy Supabase client in auth pages (login/signup)
- Fixed Vercel production build crash: stub Supabase client during SSR prerendering (all dashboard pages)
- All fixes pushed to main — 140 tests passing, build clean
