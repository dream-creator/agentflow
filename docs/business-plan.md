# Business Registration + PayMongo Setup Plan

> This document is personal and business-sensitive — kept out of git via `.gitignore`.

---

## Phase 0: Business Registration (do this first — takes days/weeks)

| # | Task | Where | Cost | Notes |
|---|---|---|---|---|
| 0.1 | **Register business name with DTI** | https://bnrs.dti.gov.ph | ₱200–₱2,000 depending on scope | Sole proprietor. National = ₱2,000. City = ₱500. Online, certificate emailed immediately after payment |
| 0.2 | **Register with BIR** | https://orus.bir.gov.ph | Free | Get your Certificate of Registration (Form 2303). You need a TIN. Can be done online via ORUS |
| 0.3 | **Open a business bank account** | Any Philippine bank | Varies | You need this for PayMongo settlements. Some banks require DTI + BIR COR before opening |
| 0.4 | **Get a mayor's permit** (optional but recommended) | Your city/municipality | Varies | Some PayMongo verification requests this. Not always required for online-only businesses |

---

## Phase 1: PayMongo Account Setup

| # | Task | Where | Notes |
|---|---|---|---|
| 1.1 | **Create a PayMongo account** | https://dashboard.paymongo.com | Sign up with your email |
| 1.2 | **Submit KYC verification** | PayMongo Dashboard → Settings → Verification | You'll need: Government ID, DTI registration, BIR COR, bank account details. **Approval: 2–5 business days** |
| 1.3 | **Request Subscriptions API access** | Email `support@paymongo.com` | Subject: "Request Subscriptions API access for [your business name]". The Subscriptions API is NOT enabled by default — you MUST request it. **This is the critical blocker** |
| 1.4 | **Wait for approval** | — | Both KYC + Subscriptions API access must be approved before testing |

---

## Phase 2: PayMongo Dashboard Configuration

| # | Task | Where | Notes |
|---|---|---|---|
| 2.1 | **Get your test API keys** | Dashboard → Developer Tools → API Keys | You'll get `sk_test_...` (secret) and `pk_test_...` (public). **Test mode** is separate from live mode |
| 2.2 | **Create a webhook endpoint** | Dashboard → Developer Tools → Webhooks → Add Endpoint | URL: `https://agent-flow.app/api/paymongo/webhook` (for production). **For testing locally, you'll need a tunnel** (see Phase 4) |
| 2.3 | **Select webhook events to subscribe to** | Same page as 2.2 | Subscribe to ALL of these: `subscription.created`, `subscription.updated`, `subscription.activated`, `subscription.cancelled`, `subscription.deleted`, `invoice.paid`, `invoice.payment_failed` |
| 2.4 | **Copy the webhook signing secret** | Dashboard → Webhooks → click your endpoint → Secret Key | This is your `PAYMONGO_WEBHOOK_SECRET`. Starts with `whsec_...` |
| 2.5 | **Verify your webhook works** | After deploying, use PayMongo Dashboard → Webhooks → click endpoint → "Send test event" | Sends a test payload to your endpoint. Confirm you get a 200 response |

---

## Phase 3: Environment Variables

| # | Task | Where | Notes |
|---|---|---|---|
| 3.1 | **Set `PAYMONGO_SECRET_KEY`** | Vercel Production env | `sk_live_...` for production, `sk_test_...` for testing |
| 3.2 | **Set `PAYMONGO_WEBHOOK_SECRET`** | Vercel Production env | `whsec_...` from Phase 2.4 |
| 3.3 | **Set `PAYMONGO_PUBLIC_KEY`** | Vercel Production env | `pk_live_...` / `pk_test_...` |
| 3.4 | **Set `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY`** | Vercel Production env | Same as 3.3, but with `NEXT_PUBLIC_` prefix for client-side |
| 3.5 | **Set `CRON_SECRET`** | Vercel Production env | Random string for the billing-check cron endpoint. Generate with `openssl rand -hex 32` |
| 3.6 | **Update `.env.local` locally** | `.env.local` | Use test keys: `sk_test_...`, `whsec_...`, etc. |

---

## Phase 4: Local Testing

| # | Task | How | Notes |
|---|---|---|---|
| 4.1 | **Install ngrok or use PayMongo's CLI** | `ngrok http 3000` | You need a public URL so PayMongo can send webhook events to your local machine. ngrok gives you a free tunnel |
| 4.2 | **Register ngrok URL as webhook** | PayMongo Dashboard → Webhooks → Add Endpoint | URL: `https://<your-ngrok-id>.ngrok.io/api/paymongo/webhook` (test mode) |
| 4.3 | **Run dev server** | `npm run dev` | |
| 4.4 | **Test checkout flow** | Open `http://localhost:3000/settings/billing` → Click "Upgrade to Pro" | Should redirect to PayMongo checkout page |
| 4.5 | **Use test card** | Card: `4120000000000007`, any future expiry, any CVC | This card always succeeds in test mode |
| 4.6 | **Verify webhook received** | Check ngrok terminal + your dev server console | Should see the `subscription.created` and `invoice.paid` events |
| 4.7 | **Verify DB updated** | Check Supabase `profiles` table | `paymongo_customer_id`, `paymongo_subscription_id`, `subscription_status` should be populated |
| 4.8 | **Test failure scenario** | Card: `4120000000000018` (insufficient funds) | Should trigger `invoice.payment_failed` webhook, set `past_due` status |
| 4.9 | **Test cancellation** | POST to `http://localhost:3000/api/paymongo/cancel` | Should cancel subscription, webhook fires `subscription.deleted` |
| 4.10 | **Test grace period cron** | Set `grace_period_ends_at` to a past date manually in DB, then hit `GET /api/cron/billing-check` with `Authorization: Bearer <CRON_SECRET>` | Should downgrade user to Free plan |

---

## Phase 5: Database Migration

| # | Task | Where | Notes |
|---|---|---|---|
| 5.1 | **Apply migration 003** | Supabase SQL Editor or `supabase db push` | Adds `paymongo_customer_id`, `paymongo_subscription_id`, `subscription_interval`, `grace_period_ends_at` columns to `profiles` table |
| 5.2 | **Verify migration applied** | Supabase Dashboard → Table Editor → `profiles` | Confirm new columns exist |

---

## Phase 6: Production Deployment

| # | Task | How | Notes |
|---|---|---|---|
| 6.1 | **Merge feature branch to main** | `git checkout main && git merge feat/paymongo-migration` | This replaces Stripe with PayMongo in production |
| 6.2 | **Push to trigger Vercel deploy** | `git push origin main` | Vercel auto-deploys from `main` |
| 6.3 | **Set live API keys in Vercel** | Change test keys (`sk_test_...`) to live keys (`sk_live_...`) | In Vercel Dashboard → Settings → Environment Variables |
| 6.4 | **Update webhook to live URL** | PayMongo Dashboard → Webhooks → Edit endpoint | Change URL from ngrok to `https://agent-flow.app/api/paymongo/webhook`. **Switch to Live mode** in the dashboard first |
| 6.5 | **Verify live webhook** | PayMongo Dashboard → Webhooks → Send test event | Confirm 200 response from production |
| 6.6 | **Run billing-check cron** | Set up a cron job (e.g., Vercel Cron or external) hitting `GET https://agent-flow.app/api/cron/billing-check` with `Authorization: Bearer <CRON_SECRET>` | Daily at midnight. Downgrades expired grace periods |

---

## Phase 7: End-to-End Verification

| # | Task | How | Expected |
|---|---|---|---|
| 7.1 | **Full signup → upgrade flow** | Create account on `agent-flow.app` → go to billing → upgrade to Pro | PayMongo checkout → card payment → redirected back → plan shows "Pro" |
| 7.2 | **Verify subscription in PayMongo** | Dashboard → Subscriptions | Should show active subscription |
| 7.3 | **Verify profile in Supabase** | Table Editor → profiles | `plan = 'pro'`, `paymongo_customer_id` filled, `subscription_status = 'active'` |
| 7.4 | **Test cancellation** | Billing page → Cancel subscription | Subscription cancelled, plan downgraded to Free |
| 7.5 | **Test failed payment** | Use card `4120000000000018` | `past_due` status, 3-day grace period, billing-check cron downgrades after expiry |
| 7.6 | **Check PayMongo is live** | Verify PayMongo references in production | PayMongo checkout and webhook endpoints respond correctly |

---

## Critical Blockers

| Blocker | Why | How to resolve |
|---|---|---|
| **Subscriptions API not enabled** | PayMongo doesn't enable it by default | Email `support@paymongo.com` and request access. This is the #1 blocker |
| **KYC not approved** | Can't process live payments without verification | Submit docs early, wait 2–5 business days |
| **No webhook tunnel for local testing** | PayMongo can't reach `localhost` | Use ngrok (`ngrok http 3000`) |
| **DB migration not applied** | Columns missing → checkout crashes | Run migration before testing |
| **Live mode vs test mode** | Test keys won't process real payments | Switch keys + webhook URL when going live |

---

## Quick Command Reference

```bash
# 1. Switch to feature branch
git checkout feat/paymongo-migration

# 2. Start local dev
npm run dev

# 3. Start ngrok tunnel (in separate terminal)
ngrok http 3000

# 4. Copy the ngrok URL and register it as webhook in PayMongo Dashboard

# 5. Test with card 4120000000000007 (success)

# 6. When ready for production:
git checkout main
git merge feat/paymongo-migration
git push origin main

# 7. In Vercel: change test keys to live keys
# 8. In PayMongo Dashboard: switch webhook to live URL
```
