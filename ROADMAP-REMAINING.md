# AgentFlow — Remaining Tasks Roadmap
## LOCAL ONLY — Do NOT push to remote

Generated: May 31, 2026
Status: Phase 4 (Production) ~70% complete

---

## TOP PRIORITY — Do First (June 1, 2026)

### Price Change $19/mo → $5/mo
- **Why:** Strategic pricing decision for more clients
- **Time:** 7 minutes
- **Code changes:**
  - src/lib/stripe.ts:16 — `price: 1900` → `price: 500`
  - src/app/page.tsx:218 — `$19` → `$5`
  - src/app/(dashboard)/settings/billing/page.tsx:87,115 — `$19/mo` → `$5/mo`
  - src/app/(dashboard)/settings/page.tsx:109 — `$19/mo` → `$5/mo`
  - tests/unit/lib/stripe.test.ts:58 — `1900` → `500`
- **Stripe dashboard:** Create new price at $5/mo, deactivate old $19 price

---

## CRITICAL — Must Complete Before Public Launch

### 1. Google OAuth End-to-End Testing
- **Status:** FIX DEPLOYED — awaiting manual testing
- **Action:** Visit /login → "Continue with Google" → authenticate → verify redirect to /dashboard
- **If fails:** Check browser console + Supabase logs
- **Files:** src/components/auth-callback-rescue.tsx, src/app/auth/callback/route.ts

### 2. Stripe Integration
- **Status:** NOT CONFIGURED
- **Action:**
  1. Create Stripe account at https://dashboard.stripe.com
  2. Get API keys (Developers → API keys)
  3. Set in Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  4. Create webhook endpoint: https://agentflow-inky.vercel.app/api/stripe/webhook
  5. Test: create subscription → verify checkout flow
- **Files:** src/lib/stripe.ts, src/app/api/stripe/checkout/route.ts, src/app/api/stripe/webhook/route.ts

### 3. Resend Email Configuration
- **Status:** NOT CONFIGURED
- **Action:**
  1. Create Resend account at https://resend.com
  2. Add domain agentflow-inky.vercel.app
  3. Verify DNS records (SPF, DKIM)
  4. Set RESEND_API_KEY in Vercel
  5. Test: trigger daily digest cron, verify email delivery
- **Files:** src/lib/resend.ts, src/app/api/cron/daily-digest/route.ts

---

## HIGH — Required for Production Hardening

### 4. Rate Limiter Migration
- **Status:** In-memory only (resets on serverless cold starts)
- **Action:** Migrate to Upstash Redis (@upstash/ratelimit)
- **Impact:** Rate limits ineffective across cold starts currently
- **Files:** src/lib/rate-limiter.ts

### 5. TypeScript Strictness Upgrade
- **Status:** strict: true enabled, missing noUncheckedIndexedAccess
- **Action:** Enable noUncheckedIndexedAccess + noImplicitReturns in tsconfig.json
- **Impact:** Will surface existing type errors — needs dedicated PR
- **Files:** tsconfig.json

### 6. GitHub Secrets Configuration
- **Status:** Partially configured
- **Action:**
  - Set PRODUCTION_APP_URL = https://agentflow-inky.vercel.app
  - Set VERCEL_TOKEN (from Vercel account settings)
  - Verify: gh secret list

### 7. Clean Up Test Releases
- **Status:** v0.2.0-v0.2.14 exist (many are test releases)
- **Action:** Delete test releases, keep only meaningful ones
- **Command:** gh release delete v0.2.X --yes --cleanup-tag

### 8. Update GitHub Actions Node.js
- **Status:** Using Node.js 20 (deprecated June 2026)
- **Action:** Update actions/checkout@v4 → v5, actions/setup-node@v4 → v5
- **Deadline:** September 2026 (Node.js 20 removed from runners)

---

## MEDIUM — Improvements

### 9. Constants Extraction
- **Status:** SOURCES and PIPELINE_STAGES arrays duplicated in leads/new/page.tsx and leads/[id]/edit/page.tsx
- **Action:** Extract to src/lib/constants.ts

### 10. Contact Actions Component
- **Status:** Phone/Mail/MessageSquare link pattern duplicated across 3+ pages
- **Action:** Extract to src/components/ui/contact-actions.tsx

### 11. formatDate Utility
- **Status:** Defined locally in dashboard/page.tsx
- **Action:** Extract to src/lib/utils.ts, use consistently across dashboard + follow-ups

### 12. E2E Test Coverage
- **Status:** 11 auth E2E tests + 5 load tests
- **Action:** Add E2E tests for:
  - Lead CRUD (create → edit → delete)
  - Pipeline drag-and-drop
  - Follow-ups overdue/today/upcoming
  - Settings profile edit
  - Stripe checkout flow (when configured)

### 13. Sentry Production Verification
- **Status:** Configured but unverified
- **Action:** Verify errors are captured in Sentry dashboard after deploy

---

## LOW — Backlog

### 14. Supabase RLS Policy Audit
- **Status:** RLS enabled on leads/actions tables
- **Action:** Verify policies match the new user_id ownership checks added in client code

### 15. CSP Nonce Implementation
- **Status:** CSP header uses 'unsafe-inline' for styles
- **Action:** Implement per-request nonces for scripts (requires middleware integration)

### 16. Performance Optimization
- **Action:**
  - Run Lighthouse audit on all pages
  - Optimize images (Next.js Image component)
  - Add proper caching headers
  - Implement ISR for static pages

### 17. Beta Launch Preparation
- **Action:**
  - Create onboarding flow for new users
  - Add in-app feedback widget
  - Set up customer support email
  - Write help documentation
  - Create demo video/screenshots

### 18. Marketing Assets
- **Action:**
  - Landing page optimization (conversion rate)
  - SEO structured data
  - Social media presence
  - Product Hunt launch preparation

---

## COMPLETED THIS SESSION

| # | Task | Status |
|---|------|--------|
| 1 | Security audit (17 findings, 15 files) | DONE |
| 2 | Security headers (9 headers) | DONE |
| 3 | XSS prevention in email templates | DONE |
| 4 | Error sanitization (all API routes) | DONE |
| 5 | Open redirect fix | DONE |
| 6 | IDOR ownership checks | DONE |
| 7 | Health endpoint info disclosure | DONE |
| 8 | Stripe webhook error sanitization | DONE |
| 9 | null-as-any replacement | DONE |
| 10 | Non-null assertion removal | DONE |
| 11 | PR gatekeeper coverage fix | DONE |
| 12 | Release notes automation (awk-based) | DONE |
| 13 | Release notes body extraction fix | DONE |
| 14 | ARCHITECTURE.md removed from history | DONE |
| 15 | TEST_RELEASE_NOTES.txt removed from history | DONE |
| 16 | Both files added to .gitignore | DONE |

---

## KEY FILES MODIFIED THIS SESSION

### Security Fixes
- next.config.mjs — security headers
- src/lib/resend.ts — escapeHtml() + email template sanitization
- src/lib/supabase/server.ts — null as any → throw
- src/lib/supabase/client.ts — non-null assertion removal
- src/lib/supabase/middleware.ts — console.error cleanup
- src/app/api/leads/route.ts — error sanitization
- src/app/api/leads/[id]/route.ts — error sanitization + ownership check
- src/app/api/cron/daily-digest/route.ts — error sanitization
- src/app/api/health/route.ts — version disclosure removed
- src/app/api/stripe/webhook/route.ts — error sanitization
- src/app/auth/callback/route.ts — open redirect fix
- src/app/(dashboard)/leads/[id]/page.tsx — IDOR fix
- src/app/(dashboard)/leads/[id]/edit/page.tsx — IDOR fix
- src/app/(dashboard)/settings/billing/page.tsx — error feedback
- src/app/page.tsx — import cleanup

### CI/CD Fixes
- .github/workflows/pr-gatekeeper.yml — coverage artifact condition
- .github/workflows/production-release.yml — awk-based release notes

### History Cleanup
- ARCHITECTURE.md — removed from all commits
- TEST_RELEASE_NOTES.txt — removed from all commits
- .gitignore — both files added

---

## ECC SKILLS UTILIZED

| Skill | Purpose |
|-------|---------|
| security-review | Security checklist, OWASP patterns, secret management, XSS/CSRF/injection |
| production-audit | Production readiness scoring, risk lenses, ship/block recommendation |
| react-patterns | React conventions, hooks discipline, state management |
| coding-standards | KISS/DRY/YAGNI, naming, error handling, type safety |

---

## GIT HISTORY NOTE

This file and AGENTS.md are the only places where ARCHITECTURE.md content is referenced.
The actual ARCHITECTURE.md was removed from the entire git history using git filter-repo.
Do NOT recreate ARCHITECTURE.md or commit it to the repository.
