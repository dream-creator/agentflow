# Payment Gateway: PayMongo

**Status:** Production-ready on `feat/paymongo-migration` (Stripe removed).  
**Goal:** Accept subscriptions via PayMongo for Philippine and international users.  
**Pricing:** $8 / month or $80 / year (USD).  
**Created:** 2026-06-19

## Why PayMongo

Stripe is not fully supported in the Philippines. The user is based in the Philippines and cannot verify a Stripe account without a US LLC. PayMongo is BSP-regulated, Philippine ID-only KYC, and supports Mastercard/Visa + GCash + Maya + QR Ph + Online Banking + BNPL.

## PayMongo Fee Summary (on USD $8)

| Payment Method | Fee | On $8/mo |
|----------------|-----|----------|
| Local Visa/Mastercard | 3.125% + ₱13.39 | ~$0.50 |
| International Visa/Mastercard | 4.02% + ₱13.39 | ~$0.59 |
| GCash | 2.23% | ~$0.18 |
| Maya | 1.79% | ~$0.14 |
| GrabPay | 1.96% | ~$0.16 |
| ShopeePay | 1.70% | ~$0.14 |
| QR Ph | 1.34% | ~$0.11 |
| Online Banking (BDO, BPI, etc.) | 0.71% or ₱13.39 | ~$0.13 |
| BNPL (BillEase) | 1.34% | ~$0.11 |

No setup fee, no monthly fee, pay-as-you-go.

---

## Architecture

```
User clicks "Upgrade"
  → POST /api/paymongo/checkout
  → Rate limit + Zod validation
  → Get or create PayMongo Customer
  → Get or create Plan ($8/mo or $80/yr USD)
  → Create Subscription + Checkout Session
  → Redirect user to PayMongo hosted checkout
  → User pays (Card / GCash / Maya / QR Ph / Banking / BNPL)
  → PayMongo fires webhook → POST /api/paymongo/webhook
  → Verify HMAC-SHA256 signature
  → Insert into webhook_events (atomic dedup)
  → Update profiles table (plan: "pro", subscription active)
```

### Webhook Deduplication

The `webhook_events` table is the single source of truth for whether an event has been processed. The handler:

1. Verifies the webhook signature.
2. Inserts a row with `status: 'pending'` and `paymongo_event_id`.
3. A PostgreSQL `UNIQUE` constraint on `paymongo_event_id` makes duplicate events fail with `23505`; the handler returns 200 and skips reprocessing.
4. If business logic succeeds, the row is updated to `status: 'processed'`.
5. If business logic fails, the row is updated to `status: 'failed'` with `error_message`, so PayMongo retries can be observed and reprocessed.

---

## Core PayMongo Module

**File:** `src/lib/paymongo.ts`

| Function | Purpose |
|----------|---------|
| `getPayMongoConfig()` | USD price config, overridable via env vars |
| `payMongoFetch()` | All API calls go through here; injects `Authorization`, `Content-Type`, and `Idempotency-Key` |
| `getOrCreatePlan()` | Reuses an existing plan or creates one; cached in memory |
| `getOrCreatePayMongoCustomer()` | Creates a PayMongo Customer and stores `paymongo_customer_id` on the profile |
| `createSubscription()` | Creates Plan + Subscription + Checkout Session, returns checkout URL |
| `cancelPayMongoSubscription()` | Calls `POST /v1/subscriptions/{id}/cancel` |
| `handleSubscriptionActive()` | Sets `plan: "pro"`, `subscription_status: "active"` |
| `handleSubscriptionCancelled()` | Resets to `plan: "free"`, `subscription_status: "cancelled"` |
| `handlePaymentFailed()` | Sets `subscription_status: "past_due"` |
| `verifyWebhookSignature()` | HMAC-SHA256 verification against `PAYMONGO_WEBHOOK_SECRET` |

### Idempotency

Every PayMongo POST includes an `Idempotency-Key` UUID. This prevents duplicate customer/plan/subscription creation if the request is retried.

### Pricing Config

```typescript
{
  monthly: { amount: 800,  currency: "usd" },  // $8.00
  annual:  { amount: 8000, currency: "usd" },  // $80.00
}
```

Override via env vars if needed (not recommended):
- `PAYMONGO_PRICE_MONTHLY`
- `PAYMONGO_PRICE_ANNUAL`
- `PAYMONGO_CURRENCY`

---

## Database Migrations

### `003_add_paymongo_to_profiles.sql`

```sql
ALTER TABLE profiles
  ADD COLUMN paymongo_customer_id TEXT,
  ADD COLUMN paymongo_subscription_id TEXT;
```

### `004_create_webhook_events.sql`

```sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paymongo_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
  payload JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_events DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_events_paymongo_event_id ON webhook_events(paymongo_event_id);
```

RLS is disabled because the table is only written by the service-role client from the webhook route.

---

## API Routes

### `POST /api/paymongo/checkout`

1. Auth check (401 if no user).
2. Rate limit: 10 req/min per user.
3. Zod validation: `interval: "monthly" | "annual"`.
4. Get or create PayMongo customer.
5. Get or create Plan.
6. Create Subscription + Checkout Session.
7. Return `{ url: checkout_session_url }`.

### `POST /api/paymongo/webhook`

1. Verify PayMongo signature.
2. Atomic dedup via `webhook_events` insert.
3. Process event:
   - `subscription.activated` → `handleSubscriptionActive()`
   - `subscription.cancelled` → `handleSubscriptionCancelled()`
   - `invoice.payment_failed` → `handlePaymentFailed()`
4. Return 200 on all recognized events (avoids PayMongo retries).

### `POST /api/paymongo/cancel`

1. Auth check.
2. Rate limit: 10 req/min per user.
3. Look up `paymongo_subscription_id` from profile.
4. Call PayMongo cancel endpoint.
5. Update local profile to `subscription_status: "cancelled"`.

---

## UI Changes

### `src/app/(dashboard)/settings/billing/page.tsx`

- `handleUpgrade()` → POST `/api/paymongo/checkout`.
- Cancel button → POST `/api/paymongo/cancel`.
- Success banner still reads `?upgraded=true`.
- Plan display uses `profiles.plan` and `profiles.subscription_status`.
- Color tokens use `success-*` / `warning-*` / `destructive-*` instead of raw Tailwind palettes.

### Landing Pricing

- `$8/mo` stays.
- No payment-method logos on the landing page; PayMongo's checkout page shows the available methods automatically.

---

## Environment Variables

```bash
# Server-side (Vercel only)
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...

# Public (Vercel + local)
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
```

See `ENVIRONMENT-VARIABLES.md` for the full matrix and topology.

---

## Tests

### Unit Tests

| File | Tests | What |
|------|-------|------|
| `tests/unit/lib/paymongo.test.ts` | ~16 | Config, customer creation, plan reuse, subscription, webhook verification, cancellation |
| `tests/unit/api/paymongo/checkout.test.ts` | ~10 | Auth, rate limiting, Zod validation, customer/subscription creation, URL return |
| `tests/unit/api/paymongo/webhook.test.ts` | ~10 | Signature verification, atomic dedup, event handling, status updates |
| `tests/unit/api/paymongo/cancel.test.ts` | ~6 | Auth, rate limiting, subscription lookup, cancellation API |

### E2E Tests

| File | Changes |
|------|---------|
| `tests/e2e/pricing-plan-limits.spec.ts` | $8 assertions, updated checkout flow |

---

## Webhook Setup Checklist

1. In PayMongo dashboard, create a webhook endpoint: `https://agent-flow.app/api/paymongo/webhook`.
2. Copy the webhook secret into `PAYMONGO_WEBHOOK_SECRET`.
3. Subscribe to events:
   - `subscription.activated`
   - `subscription.cancelled`
   - `invoice.payment_failed`
4. Run `supabase db push` to apply `004_create_webhook_events.sql`.
5. Test with a PayMongo test-mode subscription.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PayMongo subscriptions need account activation | Can't test recurring billing | Contact PayMongo support early; use one-time payments as fallback |
| USD pricing requires USD card acceptance | International cards may be declined | Confirm USD card acceptance enabled in PayMongo dashboard |
| Webhook signature differs from Stripe | Security gap if wrong | HMAC-SHA256 implemented per PayMongo docs |
| Duplicate webhook events | Double-charge / double-upgrade | Atomic dedup via `paymongo_event_id` unique constraint |
| Webhook processing slower than 30s | PayMongo retries | Handler is currently synchronous; keep logic fast and idempotent |

---

## Prerequisites Before Going Live

1. Sign up at https://dashboard.paymongo.com.
2. Get test + live API keys.
3. Enable card payments on the account.
4. **Contact PayMongo support to enable:**
   - Subscriptions feature
   - USD card acceptance (for $8/mo pricing)
5. Set up webhook endpoint in PayMongo dashboard.
6. Set env vars in Vercel and run `supabase db push`.
7. Run a test subscription end-to-end in test mode before switching to live keys.

---

## What Was Removed

All Stripe code and tests were removed from the branch once PayMongo was wired in:

- `src/lib/stripe.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `tests/unit/lib/stripe.test.ts`
- `tests/unit/api/stripe/checkout.test.ts`
- `tests/unit/api/stripe/webhook.test.ts`

Architecture diagrams still reference Stripe for historical context; the live system uses PayMongo.
