# GLM 5.2 — AgentFlow Comprehensive Security Audit & Capability Analysis

## Project Context

**AgentFlow** is a production SaaS CRM for solo real estate agents, live at `https://agent-flow.app` with real paying users ($8/mo Pro tier via Stripe).

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, TypeScript strict) | 14.2.35 |
| Database | Supabase Cloud (PostgreSQL + GoTrue + RLS) | — |
| Payments | Stripe (checkout sessions + webhooks) | stripe 16.x |
| CAPTCHA | Cloudflare Turnstile | @marsidev/react-turnstile 1.5 |
| Email | Resend | 3.5.x |
| Hosting | Vercel (Edge middleware) | — |
| Error tracking | Sentry | @sentry/nextjs 10 |
| Validation | Zod | 4.x |
| Testing | Vitest (unit) + Playwright (e2e + load) | — |
| CI/CD | GitHub Actions (5 workflows) | — |

### Architecture Overview
- **Auth**: Supabase GoTrue (magic link + Google OAuth), middleware at `src/middleware.ts` protects `/dashboard`, `/pipeline`, `/leads`, `/follow-ups`, `/settings`, `/api/leads`, `/api/pipeline`
- **Database**: PostgreSQL with Row Level Security (RLS) on all tables. Service-role key used server-side only for webhook handlers and cron jobs.
- **Payments**: Stripe checkout sessions (subscription mode, $8/mo). Webhook at `/api/stripe/webhook` verifies signature. Handlers use `createServiceClient()` (bypasses RLS).
- **API**: Next.js Route Handlers under `src/app/api/`. Each handler authenticates via `supabase.auth.getUser()`, applies rate limiting, validates input with Zod.
- **Client**: React components fetch data via custom hooks (`useLeads`, `useProfile`, `useActions`). Data flows: component → hook → Supabase client (with user JWT) → database.

---

## PART 1: SECURITY AUDIT

You must analyze every file listed below. For each file, identify specific vulnerabilities with line numbers. Do not generalize — cite the exact code.

### Files to Analyze

#### Authentication & Session Management
| File | What to check |
|------|--------------|
| `src/middleware.ts` | Route protection completeness, bypass vectors, matcher regex |
| `src/lib/supabase/middleware.ts` | Session handling, cookie security, fail-closed behavior, redirect validation |
| `src/lib/supabase/server.ts` | Client creation, cookie handling, error handling |
| `src/lib/supabase/client.ts` | Browser client, token storage, session persistence |
| `src/lib/supabase/service.ts` | Service-role key usage, import guards, RLS bypass scope |
| `src/app/auth/callback/route.ts` | OAuth code exchange, redirect validation (open redirect), error handling |
| `src/lib/auth.ts` | Origin detection, callback URL construction |
| `src/app/(auth)/login/page.tsx` | CAPTCHA integration, error handling, rate limiting on client |
| `src/app/(auth)/signup/page.tsx` | Same as login |

#### API Routes (Attack Surface)
| File | What to check |
|------|--------------|
| `src/app/api/leads/route.ts` | GET/POST auth, rate limiting, plan limit enforcement, input validation, pagination DoS |
| `src/app/api/leads/[id]/route.ts` | GET/PUT/DELETE auth, IDOR prevention, input validation, protected columns |
| `src/app/api/stripe/checkout/route.ts` | Auth, price tampering, customer ID reuse |
| `src/app/api/stripe/webhook/route.ts` | Signature verification, event replay, handler errors |
| `src/app/api/cron/daily-digest/route.ts` | Bearer token auth, service-role usage, email enumeration |
| `src/app/api/health/route.ts` | Info leakage, authentication |

#### Data Layer
| File | What to check |
|------|--------------|
| `src/lib/validations.ts` | Zod schema completeness, edge cases, type coercion attacks |
| `src/lib/constants.ts` | Plan limits, type safety |
| `src/lib/plan-limit.ts` | Limit enforcement, bypass vectors |
| `src/lib/rate-limiter.ts` | In-memory store, serverless bypass, key collision, race conditions |
| `src/lib/stripe.ts` | Price hardcoded vs configurable, webhook secret handling, service-role usage |
| `src/lib/resend.ts` | API key handling, email injection |
| `src/lib/feature-flags.ts` | Env var injection, fail-open vs fail-closed |
| `src/types/index.ts` | Type safety, data exposure |

#### Client-Side
| File | What to check |
|------|--------------|
| `src/hooks/useLeads.ts` | Data fetching, error handling, cache invalidation |
| `src/hooks/useProfile.ts` | Profile data exposure |
| `src/hooks/useActions.ts` | Action data handling |
| `src/components/turnstile-widget.tsx` | CAPTCHA bypass, token handling, error states |
| `src/components/auth/captcha-status-pill.tsx` | State machine correctness |
| `src/app/(dashboard)/leads/import/page.tsx` | CSV parsing, file size limits, formula injection, binary content, XSS via cell data |
| `src/app/(dashboard)/leads/[id]/edit/page.tsx` | IDOR, protected field updates |
| `src/app/(dashboard)/leads/[id]/page.tsx` | Data exposure, access control |

#### Infrastructure
| File | What to check |
|------|--------------|
| `next.config.mjs` | CSP headers, HSTS, COOP/CORP, cache headers, Sentry config |
| `src/sentry.client.config.ts` | DSN exposure, trace rates |
| `src/app/global-error.tsx` | Error boundary, Sentry integration |
| `src/app/layout.tsx` | Meta tags, font loading, preconnect hints |
| `public/sw.js` | Service worker caching strategy, stale data, cache poisoning |
| `package.json` | Dependency versions, known CVEs |

---

### 1.1 Authentication & Authorization (CRITICAL)

#### 1.1.1 Middleware Bypass Analysis
The middleware at `src/middleware.ts` uses a regex matcher:
```
/((?!_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)/
```

**Test these bypass vectors:**
- Does `/../dashboard` bypass the matcher?
- Does `/%2e%2e/dashboard` bypass?
- Does `/dashboard%00` (null byte) bypass?
- Does `/DASHBOARD` (case variation) bypass?
- Does `/dashboard?foo=/login` (query param injection) bypass?
- Does the middleware correctly handle URL-encoded paths?
- Does `/api/leads` with POST bypass rate limiting (matcher applies to all methods)?
- Can an attacker hit `/api/leads` without the middleware (e.g., via a direct fetch from a different origin)?

#### 1.1.2 Session Security
In `src/lib/supabase/middleware.ts`:
- Are cookies set with `httpOnly: true`, `secure: true`, `sameSite: "lax"`?
- What is the cookie domain scope?
- Can session cookies be exfiltrated via a subdomain?
- Is there session fixation risk during the OAuth flow?
- What happens when `supabase.auth.getUser()` throws? (line 76-78 — it catches and continues)
- **CRITICAL**: When the catch block runs (line 76-78), the middleware continues to `return supabaseResponse` on line 80. This means a Supabase client error silently passes the request through without auth checking. An attacker who can trigger Supabase errors (e.g., malformed cookies) bypasses authentication.

#### 1.1.3 IDOR Prevention
In `src/app/api/leads/[id]/route.ts`:
- Every query includes `.eq("user_id", user.id)` — verify this is present on ALL operations (GET, PUT, DELETE)
- The PUT handler uses `leadUpdateSchema` (partial) — can an attacker set `user_id` to a different user? Check if `user_id` is in the update schema or excluded.
- What happens if `id` is not a UUID? Does Supabase return an error or does the query silently return nothing?
- Can an attacker use SQL injection via the `id` parameter? (Supabase client should prevent this, but verify)

#### 1.1.4 Service-Role Key Exposure
In `src/lib/supabase/service.ts`:
- Is `SUPABASE_SERVICE_ROLE_KEY` ever referenced in any `NEXT_PUBLIC_*` variable?
- Is it imported in any client-side component (any file without `"use server"` or in `src/app/(dashboard)`)?
- Search for `SUPABASE_SERVICE_ROLE_KEY` across all files — is it only in `service.ts` and env config?
- The `createServiceClient()` bypasses RLS — verify it's only used in:
  - `src/app/api/stripe/webhook/route.ts` (via `lib/stripe.ts`)
  - `src/app/api/cron/daily-digest/route.ts`
  - Nowhere else in client-facing code

#### 1.1.5 Protected Route Completeness
The middleware protects: `/dashboard`, `/pipeline`, `/leads`, `/follow-ups`, `/settings`, `/api/leads`, `/api/pipeline`

**Analyze what's NOT protected:**
- `/api/health` — is this intentional? Does it leak anything?
- `/changelog`, `/contact`, `/privacy`, `/terms` — public pages (intentional)
- `/demo` — is this a public demo page? Does it expose any data?
- Are there any other API routes that should be protected but aren't?

---

### 1.2 Input Validation & Injection (CRITICAL)

#### 1.2.1 Zod Schema Analysis
In `src/lib/validations.ts`:
```typescript
export const leadSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  source: z.enum([...]).default("manual"),
  pipeline_stage: z.enum([...]).default("new_lead"),
  notes: z.string().max(1000).optional().nullable(),
  next_action: z.string().max(200).optional().nullable(),
  next_action_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});
```

**Check these attack vectors:**
- `next_action_date` is `z.string()` — is it validated as a date format? Can an attacker pass arbitrary strings?
- `full_name` allows 100 characters — is this sufficient? Could a very long name cause UI rendering issues (CSS injection, layout breaking)?
- `notes` allows 1000 characters — is there XSS risk if this is rendered as HTML anywhere?
- `leadUpdateSchema = leadSchema.partial()` — can an attacker update `is_active` to `false` to "hide" leads? Is `is_active` supposed to be user-controllable?
- Does the API route strip `user_id` from the request body before inserting? (It should — the user should not be able to set their own `user_id`)

#### 1.2.2 CSV Import Security
In `src/app/(dashboard)/leads/import/page.tsx`:
- File size limit: what is it? (Previously 5MB, check current)
- Row limit: what is it? (Previously 1000, check if removed)
- Is the CSV parsed client-side or server-side?
- If client-side: is the parsed data sent to the API for insertion? Is the API validated?
- **Formula injection**: Does the CSV parser sanitize cells starting with `=`, `+`, `-`, `@`? (Excel interprets these as formulas)
- **Binary content**: Is there detection for null bytes or binary content in CSV cells?
- **XSS via cell data**: If a cell contains `<script>alert(1)</script>` and is rendered in the UI, is it escaped?
- **Prototype pollution**: Does the CSV parser use `Object.assign` or spread with untrusted data?

#### 1.2.3 XSS Analysis
Check every place where user-provided data is rendered:
- `full_name` — rendered in lead cards, dashboard greeting, settings
- `email` — rendered in lead details
- `phone` — rendered in lead details
- `notes` — rendered in lead details
- `next_action` — rendered in follow-ups
- `source` — rendered as a badge/label
- `pipeline_stage` — rendered as a badge/label

For each: Is it rendered via `{variable}` (safe, React escapes) or via `dangerouslySetInnerHTML` (unsafe)?

#### 1.2.4 SQL Injection
Supabase client uses parameterized queries by default. But check:
- Are there any raw SQL queries (`.rpc()`, `.sql()`, `.raw()`)?
- Is there any string concatenation in queries?
- Can an attacker inject via the `.eq()` filter with crafted values?

---

### 1.3 Payment Security (CRITICAL)

#### 1.1.1 Stripe Webhook Verification
In `src/app/api/stripe/webhook/route.ts`:
- Signature verification uses `stripe.webhooks.constructEvent()` — this is correct
- But verify: is the `STRIPE_WEBHOOK_SECRET` the same for test and production?
- What happens if `STRIPE_WEBHOOK_SECRET` is not set? (Line 11 — returns 500, which is correct)
- Can an attacker replay old webhook events? (Stripe events have timestamps — does the SDK check this?)
- What if the webhook handler throws? (Line 42-44 — returns 500, Stripe will retry. Is there idempotency handling?)

#### 1.1.2 Price Tampering
In `src/lib/stripe.ts`:
```typescript
export const STRIPE_CONFIG = {
  price: 800, // $8.00
  currency: "usd",
  ...
};
```
- The price is hardcoded server-side — this is correct
- But the checkout session is created with `price_data` (not a Stripe Price ID) — verify this means the price cannot be changed client-side
- Can an attacker create a checkout session with a different price by modifying the request?
- Is there any validation that the webhook's `amount_paid` matches `STRIPE_CONFIG.price`?

#### 1.1.3 Plan Upgrade Flow
In `handleCheckoutCompleted`:
- The webhook handler updates `profiles.plan` to `"pro"` based on `session.metadata.user_id`
- Can an attacker set `metadata.user_id` to another user's ID when creating a checkout session?
- The checkout session is created in `createCheckoutSession(customerId, userId)` — the `userId` comes from `supabase.auth.getUser()` — verify this is safe
- What if `session.metadata.user_id` is missing? (Line 100-101 — returns early, which is correct)

#### 1.1.4 Subscription Downgrade
In `handleSubscriptionDeleted`:
- Finds profile by `stripe_subscription_id` — correct
- Sets `plan: "free"` — correct
- But what if the subscription is cancelled but the user still has active leads > 10? Is there enforcement?

---

### 1.4 Rate Limiting (HIGH)

#### 1.4.1 In-Memory Store Bypass
In `src/lib/rate-limiter.ts`:
```typescript
const store = new Map<string, { count: number; resetTime: number }>();
```
- This is an in-memory `Map` — it does NOT survive serverless cold starts
- On Vercel, each request may hit a different instance — the rate limit counter resets per instance
- An attacker can bypass rate limiting by sending requests fast enough to trigger new instances
- **Impact**: Rate limiting is effectively decorative against a determined attacker
- **Question**: Is this acceptable for the current threat model? Should Redis/Upstash be used?

#### 1.4.2 Rate Limit Scope
Check all rate-limited endpoints:
- `leads:get` — 100 requests per 60s per user
- `leads:create` — 30 requests per 60s per user
- Are there rate limits on:
  - `/api/stripe/checkout` (POST) — should be very restrictive (e.g., 5 per hour)
  - `/api/stripe/webhook` (POST) — Stripe handles this, but should we add our own?
  - `/api/cron/daily-digest` — protected by Bearer token, but should have rate limit
  - `/login` (auth) — Supabase handles this, but should we add our own?
  - `/signup` (auth) — same question

#### 1.4.3 Key Collision
- Rate limit keys are `leads:get:${user.id}` — can an attacker manipulate `user.id`?
- What if `user.id` contains special characters?
- Is there a global rate limit (per IP) in addition to per-user?

---

### 1.5 Content Security Policy (MEDIUM)

In `next.config.mjs`:
```javascript
"script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : "")
```

**Analyze:**
- `'unsafe-inline'` in `script-src` — this allows inline `<script>` tags. Is this necessary? (Next.js requires it for hydration scripts)
- `'unsafe-eval'` in development only — correct, but verify it's truly conditional
- `style-src 'self' 'unsafe-inline'` — allows inline styles. Is this necessary? (Tailwind requires it)
- `img-src 'self' data: blob: https:` — allows any HTTPS image. Could this be exploited for data exfiltration?
- `connect-src` includes `https://fsxdduvwshirrheenmag.supabase.co` — is this the only Supabase URL needed?
- `frame-src 'self' https://challenges.cloudflare.com` — is Turnstile the only iframe?
- `font-src 'self' https://challenges.cloudflare.com` — are Cloudflare fonts needed?
- Are there any missing directives? (e.g., `worker-src` for service worker, `manifest-src` for PWA)

---

### 1.6 Dependency Security (MEDIUM)

Run `npm audit` and check:
- Are there any `high` or `critical` vulnerabilities?
- Are dependencies pinned in `package.json` or floating?
- Are there any dependencies with known Supply Chain risks?
- Check these specific packages:
  - `papaparse` (CSV parser) — any known vulnerabilities?
  - `@supabase/ssr` — any known vulnerabilities?
  - `stripe` — any known vulnerabilities?
  - `next` — any known vulnerabilities?
  - `react` — any known vulnerabilities?

---

### 1.7 Data Exposure (MEDIUM)

#### 1.7.1 Error Messages
Check every `console.error` and error response:
- `src/app/api/leads/route.ts:49` — `console.error("Leads GET error:", error.message)` — does `error.message` contain sensitive info?
- `src/app/api/leads/[id]/route.ts:27` — same question
- `src/app/api/stripe/webhook/route.ts:26` — `console.error("Stripe webhook verification failed:", err)` — does `err` contain the webhook secret?
- Are error responses to the client safe? (They should only show generic messages, not stack traces)

#### 1.7.2 PII Exposure
- Is user email exposed in any public endpoint?
- Is user phone number exposed in any public endpoint?
- Is `stripe_customer_id` exposed in any client-side code?
- Is `stripe_subscription_id` exposed in any client-side code?
- Is `SUPABASE_SERVICE_ROLE_KEY` ever logged?

#### 1.7.3 Logging
- Search for all `console.log`, `console.error`, `console.warn` in API routes
- Are any of them logging sensitive data (passwords, tokens, full card numbers, etc.)?
- Is Sentry capturing any PII? Check `src/sentry.client.config.ts` for ` beforeSend ` configuration

---

### 1.8 Open Redirect (HIGH)

In `src/app/auth/callback/route.ts`:
```typescript
const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";
// ...
const resolved = new URL(next, origin);
if (resolved.origin === origin && resolved.pathname.startsWith("/")) {
  redirectPath = resolved.pathname + resolved.search;
}
```

**Test these bypass vectors:**
- `?redirect=//evil.com` — does `new URL("//evil.com", origin)` resolve to the attacker's domain?
- `?redirect=/\evil.com` — does the backslash bypass the origin check?
- `?redirect=/login%00.evil.com` — null byte injection
- `?next=javascript:alert(1)` — protocol handler injection
- `?redirect=/dashboard@evil.com` — URL authority confusion
- The code checks `resolved.origin === origin` — is this sufficient?

---

### 1.9 Service Worker Security (MEDIUM)

In `public/sw.js`:
- What caching strategy is used? (cache-first, network-first, stale-while-revalidate?)
- Does the service worker cache API responses? If so, can stale data be served?
- Can a compromised service worker intercept all requests?
- Is the service worker scope limited to `/`?
- Can an attacker register a service worker from a different path?

---

### 1.10 Cookie Security (HIGH)

Analyze the cookies set by Supabase:
- Are `sb-<project-ref>-auth-token` cookies set with `httpOnly: true`?
- Are they set with `secure: true` (HTTPS only)?
- Are they set with `sameSite: "lax"` or `"strict"`?
- What is the cookie `path`? (Should be `/`)
- What is the cookie `domain`? (Should be `.agent-flow.app` or `agent-flow.app`)
- Are there any cookies set without security flags?
- Is there a refresh token? If so, how long does it persist?

---

## PART 2: THREAT MODEL

### 2.1 Attacker Profiles

**Script Kiddie**: Automated scanners, basic injection attempts
- Tests: SQL injection, XSS, directory traversal, default credentials
- Mitigation: Input validation, CSP, rate limiting

**Malicious User**: Legitimate user trying to access other users' data
- Tests: IDOR, privilege escalation, plan bypass, API abuse
- Mitigation: RLS, auth checks, rate limiting

**Sophisticated Attacker**: Targeted attack on the platform
- Tests: Webhook forgery, session hijacking, supply chain, SSRF
- Mitigation: Webhook verification, cookie security, dependency auditing

### 2.2 Attack Scenarios

For each scenario, trace the full attack path and identify whether the codebase defends against it:

1. **Attacker creates a fake Stripe webhook to upgrade their plan**
   - Can they bypass signature verification?
   - What if they use a valid Stripe event but replay it?

2. **Attacker accesses another user's leads via API**
   - Can they guess/generate lead UUIDs?
   - Does the API always filter by `user_id`?

3. **Attacker bypasses CSV import limits to spam the database**
   - Can they send multiple concurrent imports?
   - Is there a server-side row limit or just client-side?

4. **Attacker extracts PII from error messages**
   - Do API errors leak database schema info?
   - Do auth errors reveal whether an email exists?

5. **Attacker hijacks a session via XSS**
   - Is there any XSS vector in user-controlled data?
   - Can they steal session cookies?

6. **Attacker triggers a denial-of-service**
   - Can they exhaust the rate limiter's memory?
   - Can they trigger expensive database queries?
   - Can they flood the daily digest cron with leads?

7. **Attacker modifies their plan via client-side manipulation**
   - Can they change `plan` in localStorage/cookies?
   - Does the server always verify the plan from the database?

---

## PART 3: CAPABILITY ANALYSIS

### 3.1 Feature Completeness Matrix

For each feature, rate: ✅ (complete), ⚠️ (partial), ❌ (missing), 🔒 (security concern)

| Category | Feature | Status | Notes |
|----------|---------|--------|-------|
| **Auth** | Magic link login | | |
| | Google OAuth | | |
| | CAPTCHA (Turnstile) | | |
| | Session management | | |
| | Password reset | | |
| **Leads** | Create lead | | |
| | Read lead | | |
| | Update lead | | |
| | Delete lead | | |
| | Bulk delete | | |
| | Bulk stage change | | |
| | Search leads | | |
| | Filter by stage | | |
| | Sort leads | | |
| | Lead scoring | | |
| **Pipeline** | View pipeline | | |
| | Move between stages | | |
| | Pipeline analytics | | |
| **Follow-ups** | Daily digest email | | |
| | Overdue alerts | | |
| | Action tracking | | |
| | Completion animation | | |
| **CSV Import** | Upload CSV | | |
| | Column mapping | | |
| | Auto-detection | | |
| | Batch insert | | |
| **Payments** | Checkout flow | | |
| | Webhook handling | | |
| | Plan enforcement | | |
| | Free tier limits | | |
| | Billing page | | |
| **Settings** | Profile editing | | |
| | Account management | | |
| | Data export | | |
| | Data deletion (GDPR) | | |
| **PWA** | Manifest | | |
| | Service worker | | |
| | Offline support | | |
| | Install prompt | | |
| **Error Handling** | Error boundaries | | |
| | Loading states | | |
| | Not found page | | |
| **Security** | CSP headers | | |
| | HSTS | | |
| | Rate limiting | | |
| | Input validation | | |

### 3.2 Competitive Gap Analysis

Compare against:
- **Follow Up Boss** ($69/mo) — market leader for solo agents
- **kvCORE** ($100/mo) — all-in-one platform
- **LionDesk** ($25/mo) — budget option
- **HubSpot CRM** (free tier) — general-purpose

| Capability | FUB | kvCORE | LionDesk | HubSpot | AgentFlow | Gap Severity |
|-----------|-----|--------|----------|---------|-----------|-------------|
| Unlimited leads (free) | ✅ | ✅ | ✅ | ✅ | ❌ (10) | |
| Pipeline view | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Mobile app (native) | ✅ | ✅ | ✅ | ✅ | ❌ (PWA) | |
| SMS integration | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Email integration | ✅ | ✅ | ✅ | ✅ | ⚠️ (digest only) | |
| Phone dialer | ✅ | ✅ | ✅ | ✅ | ✅ (one-tap) | |
| Drip campaigns | ✅ | ✅ | ✅ | ✅ | ❌ | |
| Lead scoring | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | |
| Team/ISA support | ✅ | ✅ | ✅ | ✅ | ❌ (solo only) | |
| IDX integration | ✅ | ✅ | ✅ | ❌ | ❌ | |
| Custom branding | ✅ | ✅ | ❌ | ❌ | ✅ (Pro) | |
| Zapier integration | ✅ | ✅ | ✅ | ✅ | ❌ | |
| AI lead scoring | ❌ | ✅ | ❌ | ✅ | ❌ | |
| Reporting/analytics | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | |
| Landing pages | ❌ | ✅ | ❌ | ✅ | ❌ | |
| Power dialer | ✅ | ✅ | ❌ | ❌ | ❌ | |
| Task automation | ✅ | ✅ | ⚠️ | ✅ | ❌ | |

### 3.3 Technical Debt Inventory

Identify:
1. **Code smells** — duplicated logic, overly complex functions, magic numbers
2. **Test gaps** — untested code paths, missing edge cases
3. **Performance issues** — N+1 queries, unnecessary re-renders, large bundle sizes
4. **Accessibility issues** — missing ARIA labels, keyboard navigation gaps
5. **SEO issues** — missing meta tags, broken structured data

---

## PART 4: OUTPUT FORMAT

### Security Findings

For each finding, use this exact format:

```
### [SEVERITY] Finding Title

**ID:** SEC-XXX
**Category:** Authentication / Authorization / Injection / Payment / Rate Limiting / CSP / Data Exposure / Dependency
**File(s):** 
- `src/path/to/file.ts:line-number` — what's wrong
- `src/path/to/another-file.ts:line-number` — related issue

**Description:** 
Detailed explanation of the vulnerability. Include the exact code snippet that causes the issue.

**Attack Vector:** 
Step-by-step how an attacker would exploit this.

**Impact:** 
What the attacker achieves (data access, privilege escalation, DoS, etc.)

**CVSS Estimate:** 
Score / severity / attack vector / complexity / privileges required / user interaction

**Recommendation:** 
Specific code fix with before/after examples.

**Effort:** 
S (< 1 hour) / M (1-4 hours) / L (4+ hours)

**Priority:** 
P0 (fix now) / P1 (fix this week) / P2 (fix this month) / P3 (backlog)
```

### Capability Findings

For each capability:

```
### [Feature Name]

**Current State:** What exists today (with file references).
**Completeness:** ✅ / ⚠️ / ❌ 
**Gap vs Competitors:** How competitors handle this.
**User Impact:** What solo agents think/feel about this gap.
**Recommendation:** What to build, in what order, with what effort.
**Priority:** P0 / P1 / P2 / P3
**Effort:** S / M / L / XL
```

### Executive Summary

At the top of your output, provide:

1. **Security Score**: X/100 (based on findings severity and quantity)
2. **Top 3 Critical Risks**: The most dangerous issues
3. **Top 3 Quick Wins**: Easiest fixes with highest security impact
4. **Overall Capability Score**: X/10 (based on feature completeness vs competitors)
5. **Biggest Competitive Gaps**: The 3 features most likely to cause churn
6. **Recommended Next Sprint**: Top 5 items to work on, in order

---

## CONSTRAINTS

- This is an ANALYSIS-ONLY task. Do NOT modify any code.
- Do NOT output any actual secrets, API keys, tokens, or passwords. Use placeholders.
- Cite specific file paths and line numbers for every finding.
- Prioritize findings by real-world exploitability, not theoretical risk.
- Be brutally honest about gaps — the goal is to improve the product, not to praise it.
- Consider the threat model: this is a $8/mo SaaS for solo real estate agents, not a bank.
