# Payment Gateway Migration: Stripe → PayMongo

## Problem
Stripe is not fully supported in the Philippines. The user is based in the Philippines and cannot fully verify a Stripe account without a US LLC. PayMongo is the best alternative — BSP-regulated, Philippine ID-only KYC, supports Mastercard/Visa + GCash + Maya + QR Ph + Online Banking.

## Constraints
- Keep USD pricing ($8/mo)
- No active Stripe subscribers (clean slate)
- All payment methods: Cards, GCash, Maya, QR Ph, Online Banking, BNPL
- International clients must be able to pay

## PayMongo Fee Summary

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

No setup fee. No monthly fee. Pay-as-you-go only.

---

## Architecture

```
User clicks "Upgrade"
  → POST /api/paymongo/checkout
  → PayMongo: Create Customer + Subscription + Payment Intent
  → Redirect to PayMongo hosted checkout (supports all methods)
  → User pays (Card / GCash / Maya / QR Ph / Banking)
  → PayMongo fires webhook → POST /api/paymongo/webhook
  → Update profiles table (plan: "pro", subscription active)
```

---

## Phase 1: Core PayMongo Module

**New file: `src/lib/paymongo.ts`** (~150 lines)

| Function | Purpose |
|----------|---------|
| `getPayMongoClient()` | Lazy-initialized HTTP client for PayMongo API (Bearer token auth) |
| `PAYMONGO_CONFIG` | Price (800 = $8.00), currency "usd", plan name, interval |
| `getOrCreatePayMongoCustomer(userId, email, fullName)` | Creates PayMongo Customer, stores `paymongo_customer_id` on profile |
| `createSubscription(customerId, userId)` | Creates Plan + Subscription + returns checkout URL |
| `handleSubscriptionActive(subscriptionId, userId)` | Sets `plan: "pro"`, `subscription_status: "active"` |
| `handleSubscriptionCancelled(subscriptionId)` | Resets to `plan: "free"`, `subscription_status: "cancelled"` |
| `handlePaymentFailed(subscriptionId)` | Sets `subscription_status: "past_due"` |
| `verifyWebhookSignature(body, signature)` | Verifies PayMongo webhook HMAC-SHA256 signature |

### PayMongo API Pattern (raw HTTP, not SDK)
```typescript
const response = await fetch("https://api.paymongo.com/v1/subscriptions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
  },
  body: JSON.stringify({ data: { attributes: { customer_id, plan_id } } }),
});
```

### Why raw HTTP instead of `josu-paymongo` SDK:
- The SDK has minimal docs and is community-maintained
- PayMongo's API is simple REST — no need for a heavy wrapper
- We control error handling and retry logic
- Matches the pattern of `src/lib/stripe.ts` (thin wrapper, not a full SDK)

---

## Phase 2: Database Schema

**New migration: `003_add_paymongo_to_profiles.sql`**

```sql
ALTER TABLE profiles
  ADD COLUMN paymongo_customer_id TEXT,
  ADD COLUMN paymongo_subscription_id TEXT;
```

Keep existing Stripe columns (nullable, unused). Removing them requires full type regeneration and is unnecessary.

---

## Phase 3: API Routes

### 3a. Checkout Route
**New file: `src/app/api/paymongo/checkout/route.ts`** (~40 lines)

```
POST /api/paymongo/checkout
→ Auth check (401 if no user)
→ Get or create PayMongo customer
→ Create subscription (Plan + Subscription)
→ Return { url: checkout_session_url }
```

### 3b. Webhook Route
**New file: `src/app/api/paymongo/webhook/route.ts`** (~60 lines)

```
POST /api/paymongo/webhook
→ Verify PayMongo webhook signature (HMAC-SHA256)
→ Parse event type:
  - "subscription.activated"  → handleSubscriptionActive()
  - "subscription.cancelled"  → handleSubscriptionCancelled()
  - "invoice.payment_failed"  → handlePaymentFailed()
→ Return 200
```

### 3c. Cancel Route
**New file: `src/app/api/paymongo/cancel/route.ts`** (~30 lines)

```
POST /api/paymongo/cancel
→ Auth check
→ Get paymongo_subscription_id from profile
→ Call PayMongo API to cancel subscription
→ Return success
```

---

## Phase 4: UI Changes

### 4a. Billing Page
**Modified: `src/app/(dashboard)/settings/billing/page.tsx`**

| Change | Details |
|--------|---------|
| `handleUpgrade()` | POST to `/api/paymongo/checkout` (was `/api/stripe/checkout`) |
| Success banner | Keep as-is (reads `?upgraded=true` URL param) |
| Plan display | No change — shows "Free" or "Pro" based on `profiles.plan` |
| Cancel button | Add "Cancel Subscription" → calls `/api/paymongo/cancel` |

### 4b. Landing Pricing
**Modified: `src/components/landing-pricing.tsx`**

No price change ($8/mo stays). No payment method logos needed — PayMongo's checkout page shows all available methods.

---

## Phase 5: Environment Variables

**Add to `.env.local` and Vercel:**
```
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
```

**Keep (don't break anything):**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## Phase 6: Tests

### Unit Tests (NEW)
| File | Tests | What |
|------|-------|------|
| `tests/unit/lib/paymongo.test.ts` | ~12 | Config, customer creation, subscription, webhook verification |
| `tests/unit/api/paymongo/checkout.test.ts` | ~8 | Auth, customer creation, subscription creation, URL return |
| `tests/unit/api/paymongo/webhook.test.ts` | ~8 | Signature verification, event handling, error cases |

### E2E Tests (MODIFY)
| File | Changes |
|------|---------|
| `tests/e2e/pricing-plan-limits.spec.ts` | Fix stale $5 assertions → $8, update checkout flow |

### Delete Old Stripe Tests
| File | Action |
|------|--------|
| `tests/unit/lib/stripe.test.ts` | Delete |
| `tests/unit/api/stripe/checkout.test.ts` | Delete |
| `tests/unit/api/stripe/webhook.test.ts` | Delete |

---

## Phase 7: Cleanup

| Action | File |
|--------|------|
| Delete Stripe lib | `src/lib/stripe.ts` |
| Delete Stripe checkout route | `src/app/api/stripe/checkout/route.ts` |
| Delete Stripe webhook route | `src/app/api/stripe/webhook/route.ts` |
| Delete Stripe tests | `tests/unit/lib/stripe.test.ts`, `tests/unit/api/stripe/` |
| Update env example | `.env.local.example` |
| Update docs | `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT-VARIABLES.md` |
| Update changelog | `src/data/changelog.ts` |

---

## Implementation Order

| Step | What | Files | Est. Lines |
|------|------|-------|------------|
| 1 | PayMongo core lib | `src/lib/paymongo.ts` (NEW) | ~150 |
| 2 | DB migration | `supabase/migrations/003_add_paymongo_to_profiles.sql` (NEW) | ~15 |
| 3 | Checkout API | `src/app/api/paymongo/checkout/route.ts` (NEW) | ~40 |
| 4 | Webhook API | `src/app/api/paymongo/webhook/route.ts` (NEW) | ~60 |
| 5 | Cancel API | `src/app/api/paymongo/cancel/route.ts` (NEW) | ~30 |
| 6 | Billing page update | `src/app/(dashboard)/settings/billing/page.tsx` (MODIFY) | ~10 changed |
| 7 | Env vars | `.env.local`, Vercel dashboard | config |
| 8 | Unit tests | `tests/unit/lib/paymongo.test.ts`, `tests/unit/api/paymongo/` (NEW) | ~250 |
| 9 | Fix e2e tests | `tests/e2e/pricing-plan-limits.spec.ts` (MODIFY) | ~5 changed |
| 10 | Delete Stripe files | 6 files deleted | — |
| 11 | Update docs/changelog | `docs/`, `src/data/changelog.ts` | ~30 |

**Total new code:** ~550 lines across 5 new files
**Total modified:** ~15 lines across 2 files
**Total deleted:** ~700 lines across 6 files

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PayMongo subscriptions need account activation | Can't test recurring billing | Use one-time payments as fallback; contact PayMongo support early |
| USD pricing on PayMongo (they prefer PHP) | Possible FX conversion on card charges | Test with sandbox; confirm with PayMongo that USD cards work |
| Webhook signature verification differs from Stripe | Security gap if done wrong | PayMongo uses HMAC-SHA256; implement per their docs |
| No existing Stripe data to migrate | Good — clean slate | Just delete Stripe files, no data migration needed |

---

## Prerequisites Before Implementation

1. Sign up at https://dashboard.paymongo.com
2. Get API keys (test + live)
3. Enable card payments on the account
4. Contact PayMongo support to enable subscriptions (required for recurring billing)
5. Set up webhook endpoint in PayMongo dashboard: `https://agent-flow.app/api/paymongo/webhook`
