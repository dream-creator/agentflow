# AgentFlow — "The CRM for agents who hate CRMs"

## Tech Stack
- **Framework:** Next.js 14.2.35 (App Router, TypeScript strict)
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
- Phase 4 (Production): 65% complete
- Build: Passing, lint clean, 124 tests (96.68% coverage)
- **LIVE:** https://agentflow-inky.vercel.app

## Key Directories
- `src/app/` — 21 routes (landing, auth, dashboard, API)
- `src/lib/` — stripe.ts, resend.ts, utils.ts, validations.ts, rate-limiter.ts
- `src/hooks/` — useLeads.ts, useProfile.ts, useActions.ts
- `src/components/` — UI components
- `tests/` — unit/, e2e/, load/
- `.github/workflows/` — 4 CI/CD workflows

## Conventions
- Use Lucide React icons (no emoji in code)
- Zod for API input validation
- Lazy init for Stripe/Resend/Supabase client (build-time safe)
- In-memory rate limiting
- SVG PWA icons with gradient
- GitHub Releases: version-only title (e.g., "v0.2.5"), no emojis in release notes

## CRITICAL ISSUES (Highest Priority)

### Google OAuth Login Broken — FIX DEPLOYED, NEEDS TESTING
- **Status:** FIX DEPLOYED — awaiting user testing
- **Root Cause (Two issues identified):**
  1. **Google OAuth client was invalid** — old credentials from `startupvo1.vercel.app` domain. Fixed by creating new OAuth client in Google Cloud Console and updating Supabase via Management API.
  2. **Supabase GoTrue server ignores `redirect_to` parameter** — After Google auth completes, Supabase redirects to `site_url` (`/`) with `?code=<pkce_code>` instead of to the `redirectTo` URL (`/auth/callback`). The `redirect_to` cookie on Supabase's domain is lost during the OAuth redirect chain.
- **Fix applied (3 changes):**
  1. `src/components/auth-callback-rescue.tsx` — New client component that detects `?code=` on root page and redirects to `/auth/callback?code=...`
  2. `src/middleware.ts` — Excluded `/auth/callback` from middleware matcher to prevent cookie interference with PKCE code exchange
  3. `src/app/layout.tsx` — Fixed stale fallback URL from `startupvo1.vercel.app` to `agentflow-inky.vercel.app`
- **Supabase config verified correct via Management API:**
  - site_url: `https://agentflow-inky.vercel.app` ✓
  - uri_allow_list: `https://agentflow-inky.vercel.app/auth/callback,https://agentflow-inky.vercel.app/**` ✓
  - Google OAuth enabled: true ✓
  - Google client ID: `89182633418-18d0fvgrc27goo8vmej5g9iuqc73244h.apps.googleusercontent.com` ✓ (new client)
  - Google client secret: stored ✓
- **Google Cloud Console:**
  - OAuth consent screen: Published to Production ✓
  - Authorized domains: `agentflow-inky.vercel.app` + `supabase.co` (old `startupvo1.vercel.app` removed) ✓
  - Redirect URI: `https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback` ✓
- **Supabase Management API:** Available — PAT stored in session, can update auth config via `PATCH https://api.supabase.com/v1/projects/fsxdduvwshirrheenmag/config/auth`
- **Files involved:**
  - `src/components/auth-callback-rescue.tsx` — NEW: client-side PKCE rescue redirect
  - `src/app/page.tsx` — imports AuthCallbackRescue
  - `src/lib/auth.ts` — `getOAuthRedirectTo()` function
  - `src/app/auth/callback/route.ts` — callback handler
  - `src/lib/supabase/server.ts` — server client creation
  - `src/lib/supabase/middleware.ts` — middleware auth check
  - `src/middleware.ts` — excludes /auth/callback from matcher
  - `src/app/(auth)/login/page.tsx` — Google OAuth call
  - `src/app/(auth)/signup/page.tsx` — Google OAuth call
  - `supabase/config.toml` — local Supabase config

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
### May 31, 2026 — Security Audit & CI/CD Session (this session)
1. Ran comprehensive DevSecOps security audit using ECC skills (security-review, production-audit, react-patterns, coding-standards)
2. Fixed 17 findings across 15 files (3 CRITICAL, 4 HIGH, 4 MEDIUM, 6 LOW)
3. Added 9 security headers to next.config.mjs (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP)
4. Fixed stored XSS in email templates — added escapeHtml() to resend.ts
5. Sanitized error responses across all API routes (leads, cron, stripe webhook)
6. Fixed open redirect in auth callback — blocked protocol-relative URLs
7. Added user_id ownership checks on client-side lead queries (IDOR defense-in-depth)
8. Removed version/environment disclosure from health endpoint
9. Replaced null-as-any with explicit throw in Supabase server client
10. Removed non-null assertions in Supabase browser client
11. Fixed PR gatekeeper coverage artifact error (skip download when tests fail)
12. Automated release notes from commit bodies using awk-based parser
13. Fixed awk body iteration order bug (for-in → for-i=1-to-n)
14. Fixed release notes parsing to write directly to category files (while-read loses multi-line content)
15. Verified release notes automation end-to-end (v0.2.14 confirmed working)
16. Removed ARCHITECTURE.md and TEST_RELEASE_NOTES.txt from entire git history (git filter-repo)
17. Added both files to .gitignore
18. Force pushed rewritten history to remote

### Previous Sessions
See AGENTS.md session history from earlier sessions (May 30-31, 2026).
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
22. Created new Google OAuth client in Google Cloud Console (old domain credentials invalidated)
23. Updated Supabase config with new Google OAuth credentials via Management API
24. Diagnosed GoTrue `redirect_to` cookie failure — Supabase ignores redirectTo, falls back to site_url
25. Implemented client-side PKCE rescue: `AuthCallbackRescue` component on root page
26. Excluded `/auth/callback` from middleware matcher to prevent cookie interference
27. Fixed stale fallback URL in layout.tsx
28. **UNRESOLVED:** Google OAuth login still needs end-to-end testing after fixes deployed
29. Wired up data-fetching hooks in all 6 dashboard pages (settings, settings/profile/edit, leads, pipeline, dashboard, follow-ups)
30. Removed duplicate Supabase client creation from all pages — now using centralized hooks
31. Added professional release notes format to production-release.yml (no emojis, structured sections)
32. Fixed Next.js security vulnerability: upgraded 14.2.3 → 14.2.35 (authorization bypass CVE)
33. Fixed release workflow: version detection, tag creation, contributor auto-detection
34. Simplified release title to version-only format (e.g., "v0.2.5")

## Detailed Fix Report — Next.js Security (May 31, 2026)

### Vulnerability: Authorization Bypass
- **CVE:** Next.js middleware authorization bypass via `x-middleware-subrequest` header
- **Impact:** Attackers could skip middleware auth checks by sending requests with the header
- **Fix:** Upgraded Next.js from 14.2.3 → 14.2.35 (patched version)
- **Verified:** Build passes, 124 tests green, production deployment successful

### Vulnerability: i18n Data Route Authorization Bypass
- **CVE:** Pages Router with i18n + middleware authorization bypass
- **Impact:** Not applicable — project uses App Router, no i18n configured
- **Action:** No fix required

## Detailed Fix Report — Google OAuth (May 31, 2026)

### What Was Done This Session
1. **Queried Supabase Management API** — full auth config retrieved via PAT
2. **Found placeholder bug** — `external_google_client_id` was `env(GOOGLE_CLIENT_ID)` (literal string, not resolved) — fixed to actual client ID via PATCH API
3. **Verified redirect URLs** — `uri_allow_list` and `site_url` are correct
4. **Verified callback route** — `/auth/callback` responds with 307 correctly
5. **Verified authorize endpoint** — Supabase correctly sends `redirect_to` parameter to Google

### Root Cause Analysis
The project was migrated from `startupvo1.vercel.app` to `agentflow-inky.vercel.app`. The Google OAuth client in Google Cloud Console was originally configured for the old domain. Even though the authorized origins were updated, the client credentials (ID + secret) may be invalidated or cached by Google's infrastructure.

Additionally, Supabase's GoTrue server has a known issue where the `redirect_to` cookie is lost during the OAuth redirect chain, causing it to fall back to `site_url` instead of the intended callback URL.

### What Needs To Be Done (User Action Required)

#### Step 1: Create New Google OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project → APIs & Services → Credentials
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Application type: **Web application**
5. Name: `AgentFlow`
6. **Authorized JavaScript origins:** `https://agentflow-inky.vercel.app`
7. **Authorized redirect URIs:** `https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback`
8. Click **Create**
9. Copy **Client ID** and **Client Secret**

#### Step 2: Update Supabase Config (Agent will do this)
Once user provides new credentials, agent will run:
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/fsxdduvwshirrheenmag/config/auth" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_client_id": "<NEW_CLIENT_ID>",
    "external_google_secret": "<NEW_CLIENT_SECRET>"
  }'
```

#### Step 3: Test
1. Visit `https://agentflow-inky.vercel.app/login`
2. Click "Continue with Google"
3. Authenticate with Google
4. Verify redirect to `/auth/callback` → session created → `/dashboard`

### Remaining Tasks (Phase 4)
| Priority | Task | Status | Details |
|----------|------|--------|---------|
| CRITICAL | Test Google OAuth flow end-to-end | PENDING | Visit /login → click "Continue with Google" → authenticate → verify redirect to /dashboard |
| HIGH | Configure Stripe keys | PENDING | Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel |
| HIGH | Configure Resend API key | PENDING | Set RESEND_API_KEY in Vercel, verify domain in Resend dashboard |
| HIGH | Set PRODUCTION_APP_URL secret | PENDING | Add to GitHub repo secrets for smoke tests |
| HIGH | Set VERCEL_TOKEN secret | PENDING | Add to GitHub repo secrets for CI/CD deploys |
| MEDIUM | Clean up test releases | PENDING | Delete v0.2.0-v0.2.14 test releases from GitHub |
| LOW | Update Node.js actions | PENDING | GitHub Actions deprecation — Node.js 20 → 24 before Sept 2026 |

## Next Session Plan (June 1, 2026)

### TOP PRIORITY: Price Change $19/mo → $5/mo
- **Why:** Strategic pricing decision for more clients
- **Time:** 7 minutes (5 min code + 2 min Stripe dashboard)
- **Code changes:**
  - src/lib/stripe.ts:16 — `price: 1900` → `price: 500`
  - src/app/page.tsx:218 — `$19` → `$5`
  - src/app/(dashboard)/settings/billing/page.tsx:87,115 — `$19/mo` → `$5/mo`
  - src/app/(dashboard)/settings/page.tsx:109 — `$19/mo` → `$5/mo`
  - tests/unit/lib/stripe.test.ts:58 — `1900` → `500`
- **Stripe dashboard:** Create new price at $5/mo, deactivate old $19 price
- **DO THIS FIRST before Block 2 (Stripe Integration)**

### Block 1: Google OAuth Testing (30 min)
- Manual test: /login → "Continue with Google" → authenticate → verify redirect
- Test on mobile (Safari iOS, Chrome Android)
- Files: auth-callback-rescue.tsx, auth/callback/route.ts, auth.ts

### Block 2: Stripe Integration (1-2 hrs)
- User creates Stripe account, gets API keys
- Agent sets env vars via Vercel CLI
- Test checkout flow: Settings → Billing → Upgrade → Stripe checkout
- Test webhook: subscription activates in profiles table
- PRICE UPDATE: Change from $19/mo → $5/mo (update STRIPE_CONFIG.price in stripe.ts + recreate Stripe price)
- Files: stripe.ts, api/stripe/checkout/route.ts, api/stripe/webhook/route.ts, settings/billing/page.tsx

### Block 3: Resend Email Config (45 min)
- User creates Resend account, adds domain, verifies DNS
- Agent sets RESEND_API_KEY via Vercel CLI
- Test daily digest cron + welcome email
- Files: resend.ts, api/cron/daily-digest/route.ts

### Block 4: Rate Limiter → Upstash Redis (1 hr)
- Create Upstash account (free tier)
- Install @upstash/ratelimit + @upstash/redis
- Rewrite src/lib/rate-limiter.ts
- Test: 101 rapid requests → verify 429
- Files: rate-limiter.ts, package.json

### Block 5: TypeScript Strictness (30 min)
- Enable noUncheckedIndexedAccess + noImplicitReturns in tsconfig.json
- Fix surfaced errors
- Files: tsconfig.json + multiple

### Block 6: GitHub Secrets + Cleanup (30 min)
- Set PRODUCTION_APP_URL + VERCEL_TOKEN
- Delete test releases v0.2.0-v0.2.14
- Update actions/checkout@v4 → @v5

### Block 7: Code Cleanup PR (30 min)
- Extract SOURCES/PIPELINE_STAGES to constants.ts
- Extract ContactActions component
- Extract formatDate to utils.ts
- Files: constants.ts, contact-actions.tsx, utils.ts

### Block 8: E2E Tests (1 hr)
- Lead CRUD, Pipeline drag-and-drop, Follow-ups, Settings, Stripe checkout

### Block 9: Sentry Verification (15 min)
- Trigger error, verify Sentry capture

**Total estimated: ~6 hrs**
**User prep needed:** Google account, Stripe account, Resend account, Upstash account, Vercel token

## Future Next Steps (Post Phase 4)

### Immediate (Next Session)
1. **Google OAuth Testing** — User must manually test the full OAuth flow:
   - Navigate to `https://agentflow-inky.vercel.app/login`
   - Click "Continue with Google"
   - Authenticate with Google account
   - Verify redirect to `/auth/callback` → session created → `/dashboard`
   - If fails, check browser console for errors and Supabase logs

2. **Stripe Integration** — Configure payment processing:
   - Create Stripe account at `https://dashboard.stripe.com`
   - Get API keys from Developers → API keys
   - Set `STRIPE_SECRET_KEY` (sk_live_...)
   - Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
   - Create webhook endpoint at `https://agentflow-inky.vercel.app/api/stripe/webhook`
   - Set `STRIPE_WEBHOOK_SECRET` from webhook signing secret
   - Test: create a test subscription, verify checkout flow

3. **Resend Email Configuration** — Set up transactional email:
   - Create Resend account at `https://resend.com`
   - Add domain `agentflow-inky.vercel.app`
   - Verify DNS records (SPF, DKIM)
   - Get API key from Settings → API keys
   - Set `RESEND_API_KEY` in Vercel
   - Test: trigger daily digest cron, verify email delivery

### Short-Term (This Week)
4. **Production Environment Variables** — Complete GitHub secrets:
   - `PRODUCTION_APP_URL` = `https://agentflow-inky.vercel.app`
   - `VERCEL_TOKEN` = (from Vercel account settings)
   - `SUPABASE_ACCESS_TOKEN` = (from Supabase account settings)
   - Verify all secrets are set: `gh secret list`

5. **Clean Up Test Releases** — Remove debug releases:
   - Delete v0.2.0, v0.2.1, v0.2.2, v0.2.3, v0.2.4 from GitHub
   - Keep v0.1.17 as last stable release
   - Next push will create v0.2.5 (or v0.3.0 if feat commit)

6. **Update GitHub Actions** — Address Node.js deprecation:
   - Update `actions/checkout@v4` → `actions/checkout@v5` (when available)
   - Update `actions/setup-node@v4` → `actions/setup-node@v5` (when available)
   - Or set `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` as temporary fix

### Medium-Term (Next 2 Weeks)
7. **End-to-End Testing** — Verify all user flows:
   - Login (email/password + Google OAuth)
   - Signup (email/password + Google OAuth)
   - Create lead → Edit lead → Delete lead
   - Pipeline drag-and-drop → Stage change persists
   - Follow-ups: overdue/today/upcoming sections
   - Settings: profile edit, subscription status
   - Stripe checkout → Payment → Pro activation

8. **Performance Optimization** — Improve Core Web Vitals:
   - Run Lighthouse audit on all pages
   - Optimize images (Next.js Image component)
   - Add proper caching headers
   - Implement ISR for static pages

9. **Monitoring Setup** — Configure error tracking:
   - Verify Sentry is capturing errors in production
   - Set up Vercel Analytics dashboard
   - Configure Speed Insights for performance monitoring
   - Set up alerts for critical errors

### Long-Term (Month 1)
10. **Beta Launch Preparation** — Get ready for first users:
    - Create onboarding flow for new users
    - Add in-app feedback widget
    - Set up customer support email
    - Write help documentation
    - Create demo video/screenshots

11. **Marketing Assets** — Prepare launch materials:
    - Landing page optimization (conversion rate)
    - SEO meta tags and structured data
    - Social media presence (Twitter, LinkedIn)
    - Product Hunt launch preparation

12. **Business Logic** — Implement remaining features:
    - Email templates for proposal notifications
    - Webhook integrations (Zapier, Make)
    - CSV export for leads
    - Bulk operations (import/export)
