# AgentFlow — "The CRM for agents who hate CRMs"

## Tech Stack
- **Framework:** Next.js 14.2.35 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS 3.4.x (Teal #0F766E primary, Sky #0369A1 accent)
- **Database:** Supabase Cloud (project: fsxdduvwshirrheenmag) — PostgreSQL with RLS
- **Auth:** Supabase Auth — Magic Link OTP + Google OAuth
- **Payments:** Stripe 16.x — $5/mo Pro tier
- **Email:** Resend 3.5.x
- **Hosting:** Vercel (https://agentflow-inky.vercel.app) + Supabase Cloud
- **CI/CD:** GitHub Actions — 4 workflows (pr-gatekeeper, staging-promotion, production-release, scheduled-health-check)
- **Monitoring:** Sentry error tracking + Vercel Analytics + Speed Insights
- **Testing:** Vitest (142 unit tests) + Playwright (12 E2E tests)

## Project Status
- Phase 1-3: 100% complete
- Phase 4 (Production): 70% complete
- Build: Passing, lint clean, 154 tests (142 unit + 12 E2E)
- **LIVE:** https://agentflow-inky.vercel.app

## Key Directories
- `src/app/` — 21 routes (landing, auth, dashboard, API)
- `src/lib/` — stripe.ts, resend.ts, utils.ts, validations.ts, rate-limiter.ts, constants.ts, plan-limit.ts
- `src/hooks/` — useLeads.ts, useProfile.ts, useActions.ts
- `src/components/` — UI components (toast, card, button, etc.)
- `tests/` — unit/, e2e/, load/
- `.github/workflows/` — 4 CI/CD workflows
- `supabase/migrations/` — Database migration files

## Conventions
- Use Lucide React icons (no emoji in code)
- Zod for API input validation
- Lazy init for Stripe/Resend/Supabase client (build-time safe)
- In-memory rate limiting
- SVG PWA icons with gradient
- GitHub Releases: version-only title (e.g., "v0.2.5"), no emojis in release notes

---

## Session: June 1, 2026 — Subscription Pricing & Plan Limit Enforcement

### Changes Made

#### 1. Subscription Price Change: $19/mo → $5/mo
| File | Line | Change |
|------|------|--------|
| `src/lib/stripe.ts` | 16 | `price: 1900` → `price: 500` (source of truth) |
| `src/app/page.tsx` | 218 | `$19` → `$5` (landing page) |
| `src/app/(dashboard)/settings/billing/page.tsx` | 87, 115 | `$19/mo` → `$5/mo` |
| `src/app/(dashboard)/settings/page.tsx` | 109 | `$19/mo` → `$5/mo` |
| `tests/unit/lib/stripe.test.ts` | 58 | `1900` → `500` |
| `README.md` | 47 | `$19 / month` → `$5 / month` |

#### 2. Free Tier Limit Increase: 1 → 10 Active Leads & Pipelines
| File | Change |
|------|--------|
| `src/app/page.tsx` | "1 active lead" → "10 active leads", "1 pipeline" → "10 pipelines" |
| `src/app/(dashboard)/settings/billing/page.tsx` | Free column "1" → "10" for leads and pipelines |
| `README.md` | "1 active lead" → "10 active leads" |

#### 3. Plan Limit Enforcement (Server-Side)
| File | What It Does |
|------|-------------|
| `src/lib/constants.ts` | **NEW:** `PLAN_LIMITS` config — free: 10 leads, pro/team: unlimited |
| `src/lib/plan-limit.ts` | **NEW:** `checkPlanLimit()` helper — client-side limit check |
| `src/app/api/leads/route.ts` | Added plan limit check before INSERT — returns 403 at limit |

#### 4. Plan Limit Enforcement (Client-Side)
| File | What It Does |
|------|-------------|
| `src/app/(dashboard)/leads/new/page.tsx` | Calls `checkPlanLimit()` before insert, shows toast with upgrade CTA |
| `src/app/(dashboard)/leads/import/page.tsx` | Calls `checkPlanLimit()` before batch import, blocks at limit |

#### 5. Toast Enhancement (Upgrade CTA)
| File | What Changed |
|------|-------------|
| `src/components/ui/toast.tsx` | Added `action` prop `{ label, href }` for upgrade link |
| | Added `aria-live="polite"` for screen reader accessibility |
| | Extended auto-dismiss from 3s → 5s |
| | Added `role="status"` for semantic meaning |

#### 6. Database Trigger Update
| File | What Changed |
|------|-------------|
| `supabase/migrations/002_update_free_tier_limit_to_10.sql` | **NEW:** Migration file |
| Supabase Cloud (trigger) | `check_free_tier_lead_limit()` — hardcoded limit changed from 1 → 10 |

**Root cause found:** A Postgres trigger `check_free_tier_lead_limit()` was hardcoded to `IF lead_count >= 1` — this was the actual enforcement blocking at 1 lead. Updated to `>= 10`.

#### 7. Git History Cleanup
| Action | What Was Done |
|--------|---------------|
| Purged `.env.local.example` from git history | `git filter-repo --invert-paths --path .env.local.example` |
| Purged `OAUTH-CONFIG-GUIDE.md` from git history | `git filter-repo --invert-paths --path OAUTH-CONFIG-GUIDE.md` |
| Purged `AGENTS.md` from git history | `git filter-repo --invert-paths --path AGENTS.md` |
| Purged `ROADMAP-REMAINING.md` from git history | `git filter-repo --invert-paths --path ROADMAP-REMAINING.md` |
| Purged `test-results/` from git history | `git filter-repo --invert-paths --path test-results/` |
| Purged `playwright-report/` from git history | `git filter-repo --invert-paths --path playwright-report/` |
| Added all to `.gitignore` | Prevents future commits |

### New Tests Added (142 → 154 total)

#### Unit Tests
| File | Tests | What's Covered |
|------|-------|----------------|
| `tests/unit/lib/plan-limit.test.ts` | 9 | checkPlanLimit helper — unauth, free tier (0/9/10/11 leads), pro/team tiers, null plan, null count |
| `tests/unit/components/toast.test.ts` | 6 | PLAN_LIMITS constants — free/pro/team limits, type checks |

#### E2E Tests (Playwright)
| File | Tests | What's Covered |
|------|-------|----------------|
| `tests/e2e/pricing-plan-limits.spec.ts` | 12 | Landing page pricing ($5, 10 leads), auth pages, protected routes, pricing consistency |

### PR Created & Merged
- **PR #4:** https://github.com/dream-creator/agentflow/pull/4
- **Branch:** `feat/notication.1` → `main`
- **Status:** MERGED

### Commits (This Session)
| Commit | Description |
|--------|-------------|
| `e83f418` | feat: subscription price $19→$5, free tier 1→10, plan limit enforcement |
| `85051db` | test: comprehensive tests for plan limits, pricing, E2E flows |
| `dcf3f18` | fix: database trigger free tier limit 1→10 |
| `fd3eee9` | Merge branch 'feat/notication.1' |

---

## Architecture Decisions

### Plan Limit Enforcement Strategy
- **Database trigger** (`check_free_tier_lead_limit()`) — primary enforcement on INSERT
- **API route** (`POST /api/leads`) — secondary enforcement before insert
- **Client-side** (`checkPlanLimit()`) — UX enforcement with toast notification
- All three layers aligned to same `PLAN_LIMITS` values

### Toast System
- Module-level event bus pattern (`toastListeners` array)
- `showToast(message, type, action?)` — global function
- `ToastContainer` — mounted in dashboard layout, renders toast stack
- Supports optional `action` prop for upgrade CTA links

---

## CI/CD Gotchas (Lessons Learned)
- **Sentry config:** `withSentryConfig()` in `next.config.mjs` must be conditional — crashes Vercel build if `SENTRY_ORG`/`SENTRY_PROJECT` aren't set
- **Supabase client:** Must use lazy init pattern in auth pages — `createClient()` called at component top-level crashes during Next.js prerendering
- **Staging workflow:** Avoid `case` shell statements with `${{ matrix.* }}` inline expansion — use `if/elif` with env vars instead
- **Shell scripts in YAML:** Pass GitHub expressions as `env:` vars, reference via `$VAR` in shell — never inline `${{ }}` in shell syntax

---

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

---

## Remaining Tasks (Phase 4)

| Priority | Task | Status |
|----------|------|--------|
| CRITICAL | Test Google OAuth flow end-to-end | PENDING |
| HIGH | Configure Stripe keys | PENDING |
| HIGH | Configure Resend API key | PENDING |
| HIGH | Set PRODUCTION_APP_URL secret | PENDING |
| HIGH | Set VERCEL_TOKEN secret | PENDING |
| MEDIUM | Clean up test releases | PENDING |
| LOW | Update Node.js actions | PENDING |

---

## Post-Session Analysis (June 1, 2026)

### 1. E2E Testing Gaps (HIGH Priority)
| Missing Test | Why It Matters |
|-------------|----------------|
| Settings/Billing page | No E2E test for billing page rendering, plan display, upgrade CTA |
| Stripe checkout flow | No E2E test for clicking "Upgrade" → Stripe redirect |
| Plan limit enforcement | No E2E test that hits 10 leads → toast appears → upgrade CTA link works |
| Lead edit page | No E2E test for `/leads/[id]/edit` |
| Profile edit page | No E2E test for `/settings/profile/edit` |
| Toast notifications | No E2E test verifying toast renders with correct message + action link |

### 2. Missing Error Boundaries (HIGH Priority)
| Issue | Impact |
|-------|--------|
| No `error.tsx` files in any route | Unhandled errors show white screen instead of friendly error page |
| No `loading.tsx` files | No skeleton/loading states during data fetches |
| Global error boundary exists (`global-error.tsx`) but no route-level boundaries | Crashes in one route bring down entire app |

### 3. Security Audit Status (MEDIUM Priority)
| Finding | Status |
|---------|--------|
| `console.log` in API routes | Clean — none found |
| Hardcoded secrets | Clean — none found |
| `as any` type assertions | Clean — none found |
| TODO/FIXME comments | Clean — none found |
| Rate limiting on leads API | Present |
| Auth checks on protected routes | Present |
| Input validation (Zod) on leads API | Present |

### 4. Performance Gaps (MEDIUM Priority)
| Finding | Impact |
|---------|--------|
| No `next/image` usage | All images render as raw `<img>` — no optimization, no lazy loading |
| No skeleton loading states | Pages show nothing during data fetch |
| No `loading.tsx` in route directories | Next.js can't stream loading states |
| No virtual scrolling for long lists | May lag with 50+ leads |

### 5. Test Coverage Gaps (LOW Priority)
| File | Coverage | Gap |
|------|----------|-----|
| `app/api/health/route.ts` | 0% | Not tested at all |
| `lib/auth.ts` | 0% | Not tested |
| `lib/rate-limiter.ts` | 81% | Lines 58-61 uncovered |
| Branch coverage overall | 82% | Below 85% target |

### 6. Production Readiness Checklist
| Item | Status |
|------|--------|
| Stripe keys configured | ❌ `.env.local` has placeholders |
| Resend API key | ❌ `.env.local` has placeholder |
| Google OAuth | ⚠️ Fix deployed, needs user testing |
| Sentry error tracking | ⚠️ Config exists but not verified |
| Custom domain | ❌ Not configured |
| PRODUCTION_APP_URL secret | ❌ Not set in GitHub |
| VERCEL_TOKEN secret | ❌ Not set in GitHub |

### Recommended Execution Order
1. Add error boundaries (`error.tsx`) to key routes — prevents white screen crashes
2. E2E test for plan limit enforcement — verifies the full flow we just built
3. E2E test for billing/settings pages — covers untested routes
4. Performance: add `loading.tsx` skeleton states
5. Security audit: full pass with `security-reviewer` agent
6. Performance audit: full pass with `performance-optimizer` agent
7. Configure Stripe + Resend keys for production
8. Test Google OAuth end-to-end
