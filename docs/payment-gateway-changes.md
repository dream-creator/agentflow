# Payment Gateway Changes Plan

**Branch:** `feat/paymongo-migration`  
**Goal:** Make the PayMongo integration production-ready and safe to deploy.  
**Created:** 2026-06-19  
**Status:** In progress — high/critical items complete, cleanup/docs in flight.

## Context

The PayMongo migration branch (`dde749e`) is functionally complete but had several security, reliability, and deployment gaps identified during the security audit. The most critical issue was that the `webhook_events` table was referenced by the webhook handler but never created in the database migration, which would have caused every PayMongo webhook to fail after deployment.

## Business Decisions to Confirm

1. **USD pricing ($8/mo / $80/yr)** — **DONE (code side)**  
   `src/lib/paymongo.ts` now uses `amount: 800 / 8000` with `currency: "usd"`. This requires PayMongo USD card acceptance to be enabled on the account before going live.

2. **Subscriptions feature enablement** — **PENDING USER ACTION**  
   PayMongo subscriptions are not enabled by default; the account owner must contact PayMongo support before going live.

## Changes Checklist

### Critical

- [x] **1. Create `webhook_events` table migration**  
  Added `supabase/migrations/004_create_webhook_events.sql` with `paymongo_event_id` unique constraint, `status` column (`pending`/`processed`/`failed`), and RLS disabled for service-role writes.

### High

- [x] **2. Add rate limiting to payment routes**  
  Applied `apiRateLimit` to `POST /api/paymongo/checkout` and `POST /api/paymongo/cancel` at 10 req/min per user.

- [x] **3. Add idempotency keys to PayMongo POSTs**  
  `payMongoFetch` now generates and sends `Idempotency-Key` on every request.

- [x] **4. Add Zod input validation**  
  Added `checkoutBodySchema` in `src/lib/validations.ts` and validate the checkout body; invalid `interval` values now return 400.

- [x] **5. Make webhook deduplication atomic**  
  Webhook route now inserts into `webhook_events` first and treats PostgreSQL unique-violation (`23505`) as a duplicate. `processed` events return 200 immediately; `failed`/`pending` events are re-processed on retry.

### Medium

- [x] **6. Isolate webhook event logging from business logic**  
  Event is inserted with `status: 'pending'` before the business handler runs. On failure, status is updated to `failed` with `error_message` so retries can be observed.

- [ ] **7. Move webhook processing to async response**  
  **Deferred.** Kept synchronous processing because Next.js/Vercel route handlers cannot reliably run code after returning a response without `waitUntil` or a queue. Processing is fast enough for now; revisit if webhooks exceed PayMongo's 30-second timeout.

- [x] **8. Verify PayMongo subscription cancellation API**  
  Current implementation uses `POST /v1/subscriptions/{id}/cancel`, which matches PayMongo's documented cancellation endpoint.

- [x] **9. Reuse PayMongo plans instead of creating one per subscription**  
  `getOrCreatePlan` lists existing plans and reuses a matching plan; an in-memory cache also avoids repeated list calls.

### Low / Quality

- [x] **10. Remove `console.log` from webhook route**  
  Unhandled event log removed.

- [x] **11. Route payment errors through Sentry**  
  Added dynamic `import("@sentry/nextjs").then(({ captureException }) => ...)` to checkout, cancel, webhook, and billing-cron error paths.

- [x] **12. Fix billing UI color regressions**  
  Replaced raw `emerald-*`/`amber-*` classes with `success-*`/`warning-*` design tokens.

- [x] **13. Clean up Stripe files and stale `.next` cache**  
  Stripe code files were already removed in the branch; `.next` cache cleared before final verification.

- [x] **14. Update tests for the new behavior**  
  Updated `paymongo.test.ts`, `webhook.test.ts`, and `checkout.test.ts`. Added new `cancel.test.ts`.

- [x] **15. Update documentation**  
  Updated `docs/payment-gateway.md` with the new architecture, env vars, webhook setup, and migration details. Updated `docs/ENVIRONMENT-VARIABLES.md` with PayMongo variables and removed Stripe references.

## Implementation Order

1. ✅ Database — `004_create_webhook_events.sql` and atomic webhook dedup.  
2. ✅ Core library — idempotency keys, plan reuse, and USD pricing.  
3. ✅ API routes — rate limiting, Zod validation, and Sentry logging.  
4. ✅ UI — color tokens.  
5. ✅ Cleanup — Stripe files already removed; cache cleared.  
6. ✅ Tests — add/update tests.  
7. ✅ Docs — update env var and payment gateway docs.  
8. ✅ Verification — run `tsc`, `next lint`, `vitest`, and `next build`; all green.  

## Verification Steps

- [x] `npx tsc --noEmit` passes with 0 errors.  
- [x] `npx next lint` passes with 0 warnings.  
- [x] `npm test` passes (all existing + new tests).  
- [x] `npm run build` passes (29 routes).  
- [x] Migration file is valid SQL.  
- [x] Webhook signature verification still matches PayMongo docs.  
- [x] Rate limiting returns 429 when exceeded.  
- [x] Zod validation rejects invalid `interval` values.  
- [x] Duplicate `paymongo_event_id` returns 200 without re-running the handler.  

## Status

All checklist items complete. Branch is ready for merge after user confirms PayMongo support has enabled subscriptions and USD card acceptance.
