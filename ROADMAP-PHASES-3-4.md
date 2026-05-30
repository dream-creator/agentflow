# AgentFlow — Remaining Roadmap (Phases 3 & 4)

> **Assessment Date:** 2026-05-29
> **Status:** Phase 1 & 2 complete (66/85 items). Build passing. Lint clean. 20 routes.
> **Next:** Phase 3 (Staging & QA) → Phase 4 (Production & Launch)

---

## Phase 3: Staging & QA

### 3.1 Fix MVP Gaps (Must-do before testing)

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1.1 | Create edit lead page | `src/app/(dashboard)/leads/[id]/edit/page.tsx` | HIGH |
| 3.1.2 | Add PWA icon files (192px, 512px) | `public/icons/icon-192.png`, `public/icons/icon-512.png` | HIGH |
| 3.1.3 | Create service worker | `public/sw.js` | HIGH |
| 3.1.4 | Add `scope` to manifest | `public/manifest.json` | MEDIUM |
| 3.1.5 | Wire up Toast component for CRUD feedback | All pages with create/update/delete | MEDIUM |
| 3.1.6 | Fix billing page — fetch actual plan from profile | `src/app/(dashboard)/settings/billing/page.tsx` | MEDIUM |
| 3.1.7 | Fix sidebar — fetch actual user name/plan | `src/components/layout/sidebar.tsx` | MEDIUM |
| 3.1.8 | Extract duplicated `formatStage`/`getStageVariant` to `src/lib/utils.ts` | 4 files | LOW |
| 3.1.9 | Create `src/lib/stripe.ts` and `src/lib/resend.ts` shared modules | 2 new files + 2 route updates | LOW |

### 3.2 GitHub Actions CI Pipeline

| # | Task | Details |
|---|------|---------|
| 3.2.1 | Create `.github/workflows/ci.yml` | Triggers on push to `develop` and `main`, on PRs to `develop` |
| 3.2.2 | Lint job | `npm ci && npm run lint` |
| 3.2.3 | TypeCheck job | `npm run typecheck` |
| 3.2.4 | Unit test job | `npm test -- --coverage` |
| 3.2.5 | Cache node_modules | `actions/cache@v4` with `node_modules` key |
| 3.2.6 | Branch protection rules | Require CI pass + 1 approval on `main` |

### 3.3 Unit Tests (Vitest)

| # | Test File | What It Tests | Target Coverage |
|---|-----------|---------------|-----------------|
| 3.3.1 | `tests/unit/lib/utils.test.ts` | `cn()` merge function | 100% |
| 3.3.2 | `tests/unit/lib/supabase/middleware.test.ts` | Auth guard logic, route protection, redirects | 95% |
| 3.3.3 | `tests/unit/api/leads.test.ts` | CRUD operations, auth check, error handling | 90% |
| 3.3.4 | `tests/unit/api/stripe/checkout.test.ts` | Customer creation, session creation | 85% |
| 3.3.5 | `tests/unit/api/stripe/webhook.test.ts` | Event verification, plan updates on each event type | 90% |
| 3.3.6 | `tests/unit/api/cron/daily-digest.test.ts` | Email grouping, template rendering | 85% |
| 3.3.7 | `vitest.config.ts` | Vitest configuration file | — |

### 3.4 E2E Tests (Playwright)

| # | Test File | Flow | Priority |
|---|-----------|------|----------|
| 3.4.1 | `tests/e2e/auth.spec.ts` | Signup → Magic link → Dashboard redirect | P0 |
| 3.4.2 | `tests/e2e/lead-crud.spec.ts` | Add lead → View in list → Edit → Delete | P0 |
| 3.4.3 | `tests/e2e/pipeline.spec.ts` | Add lead → Move through stages → Close | P0 |
| 3.4.4 | `tests/e2e/follow-ups.spec.ts` | Add lead with due date → See in follow-ups → Mark complete | P0 |
| 3.4.5 | `tests/e2e/csv-import.spec.ts` | Upload CSV → Map columns → Verify leads created | P1 |
| 3.4.6 | `tests/e2e/mobile-nav.spec.ts` | Bottom nav → All pages → Touch targets ≥44px | P1 |
| 3.4.7 | `playwright.config.ts` | Playwright configuration with web server | — |

### 3.5 Quality Gates Checklist

Before any staging build is approved:

| Gate | Tool | Threshold | Blocking? |
|------|------|-----------|-----------|
| ESLint | `npm run lint` | 0 errors, 0 warnings | YES |
| TypeScript | `npm run typecheck` | 0 errors | YES |
| Unit test coverage | `npm test -- --coverage` | ≥ 80% | YES |
| E2E critical paths | `npx playwright test` | All pass | YES |
| Lighthouse Performance | Lighthouse CI or manual | ≥ 90 | YES |
| Lighthouse Accessibility | Lighthouse CI or manual | ≥ 95 | YES |
| Lighthouse PWA | Lighthouse CI or manual | ≥ 90 | NO (warning) |
| Bundle size | `next build` output | < 250KB first load JS | NO (warning) |
| Security audit | `npm audit` | 0 critical, 0 high | YES |
| Supabase RLS | Manual verification | All tables have RLS | YES |
| No secrets in code | `grep` for keys/tokens | 0 matches | YES |
| Touch targets | Manual check | All ≥ 44px | NO (warning) |
| Contrast ratios | Manual check | All ≥ 4.5:1 | NO (warning) |

### 3.6 Vercel Preview Deployment

| # | Task | Details |
|---|------|---------|
| 3.6.1 | Connect GitHub repo to Vercel | Import `dream-creator/agentflow` |
| 3.6.2 | Set environment variables (Preview) | Supabase staging, Stripe test keys, Resend test key |
| 3.6.3 | Verify auto-deploy on PR | Push to feature branch → Preview URL generated |
| 3.6.4 | Test preview deployment | Run E2E tests against preview URL |
| 3.6.5 | Set up Supabase staging project | Separate from production, apply migrations |

---

## Phase 4: Production & Deployment

### 4.1 Pre-Production Setup

| # | Task | Details |
|---|------|---------|
| 4.1.1 | Create Supabase production project | `supabase projects create agentflow-prod` |
| 4.1.2 | Apply production migrations | `supabase db push --linked` |
| 4.1.3 | Verify RLS policies | `supabase inspect db policies` |
| 4.1.4 | Create Stripe live mode | Switch from test to live keys in Stripe Dashboard |
| 4.1.5 | Verify Stripe webhook endpoint | Point to `https://agentflow.app/api/stripe/webhook` |
| 4.1.6 | Configure Resend domain | Verify `agentflow.app` in Resend dashboard |
| 4.1.7 | Set up Vercel production project | `vercel --prod` or Vercel dashboard |
| 4.1.8 | Configure custom domain | `agentflow.app` DNS → Vercel |
| 4.1.9 | Verify SSL certificate | Vercel auto-provisions |

### 4.2 Environment Variables (Production)

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production service role key |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe live mode |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe live mode |
| `RESEND_API_KEY` | `re_...` | Production Resend key |
| `NEXT_PUBLIC_APP_URL` | `https://agentflow.app` | Production URL |
| `CRON_SECRET` | `<random>` | For daily digest cron authorization |

### 4.3 Production Deployment Checklist

```bash
# 1. Final quality gate
npm run lint && npm run typecheck && npm test && npm run build

# 2. Merge to main
git checkout main
git merge develop
git push origin main

# 3. Vercel auto-deploys (or manual)
vercel --prod

# 4. Verify production
curl -I https://agentflow.app              # 200 OK
curl -I https://agentflow.app/login        # 200 OK
curl -I https://agentflow.app/dashboard    # 302 → /login (auth required)

# 5. Smoke test auth flow
# - Sign up with test email
# - Verify magic link received
# - Complete login
# - Add a lead
# - Verify in pipeline and follow-ups

# 6. Smoke test Stripe
# - Click "Upgrade to Pro"
# - Complete checkout with test card
# - Verify plan updated to Pro
# - Verify unlimited leads working

# 7. Smoke test daily digest
# - Add lead with tomorrow's date as next_action_date
# - Wait for cron (or trigger manually)
# - Verify email received
```

### 4.4 Monitoring & Observability Setup

| # | Tool | Purpose | Configuration |
|---|------|---------|---------------|
| 4.4.1 | Vercel Analytics | Web Vitals, page performance | Enable in Vercel dashboard |
| 4.4.2 | Vercel Speed Insights | Real-user performance data | `@vercel/speed-insights` package |
| 4.4.3 | Sentry | Error tracking, stack traces | `@sentry/next.js` package, DSN in env |
| 4.4.4 | Supabase Dashboard | DB metrics, auth logs, API usage | Monitor daily |
| 4.4.5 | Resend Dashboard | Email delivery, bounces, opens | Monitor weekly |
| 4.4.6 | Stripe Dashboard | Payments, subscriptions, disputes | Monitor weekly |
| 4.4.7 | Uptime monitoring | Betterstack or Checkly | Alert if downtime > 1 min |

### 4.5 Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4.0s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| Error rate | < 0.1% | > 1% |
| API response time (p95) | < 500ms | > 2s |
| Email delivery rate | > 99% | < 95% |
| Stripe webhook success | > 99.9% | < 99% |
| Uptime | > 99.9% | < 99.5% |

### 4.6 Post-Launch Maintenance

| Frequency | Task |
|-----------|------|
| Daily | Check Sentry for new errors |
| Daily | Verify Vercel deployment status |
| Weekly | Review Vercel Analytics for regressions |
| Weekly | Check Supabase dashboard for DB growth |
| Weekly | Review Stripe churn and billing issues |
| Monthly | `npm audit` + dependency updates |
| Monthly | Performance audit (Lighthouse, bundle size) |
| Quarterly | Full security audit |
| Quarterly | Review and update ARCHITECTURE.md |

### 4.7 Scaling Milestones

| Milestone | Action | Est. Cost |
|-----------|--------|-----------|
| 100 users | Upgrade Supabase to Pro | +$25/mo |
| 500 users | Add Redis caching for daily digest queries | +$10/mo |
| 1,000 users | Implement rate limiting on API routes | Free |
| 2,000 users | Evaluate Vercel Pro plan | +$20/mo |
| 5,000 users | Consider dedicated Supabase instance | +$75/mo |

---

## Execution Order

```
Phase 3.1 (Fix gaps)         → 2-3 hours
Phase 3.2 (CI/CD)            → 1-2 hours
Phase 3.3 (Unit tests)       → 4-6 hours
Phase 3.4 (E2E tests)        → 4-6 hours
Phase 3.5 (Quality gates)    → 1 hour (verification)
Phase 3.6 (Vercel preview)   → 1 hour
                              ─────────────
Phase 3 Total:               ~13-19 hours

Phase 4.1 (Pre-prod setup)   → 2-3 hours
Phase 4.2 (Env vars)         → 30 min
Phase 4.3 (Deploy)           → 1-2 hours
Phase 4.4 (Monitoring)       → 2-3 hours
Phase 4.5 (Metrics)          → 1 hour
Phase 4.6 (Maintenance)      → Ongoing
                              ─────────────
Phase 4 Total:               ~7-10 hours (first launch)
```
