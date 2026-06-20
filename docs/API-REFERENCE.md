# API Reference

Every server-side route handler in `src/app/api/` and the auth
callback. Routes are organized by directory.

## Conventions

- **JSON in, JSON out.** All handlers parse `request.json()` and
  return `NextResponse.json(...)`.
- **Auth via the server Supabase client.** Each handler calls
  `supabase.auth.getUser()` (which validates the JWT). A `401` is
  returned if no user.
- **Zod validation.** Request bodies are validated with schemas
  from `src/lib/validations.ts`. A `400` is returned on parse
  failure with `{ error: "Invalid request", details: ... }`.
- **Rate limiting** (where applied) is in-memory via
  `src/lib/rate-limiter.ts`. Limits are per-user (keyed by
  `user.id`). The default is 100 requests / 60s for `leads:get`.
  See [Rate limiting](#rate-limiting).
- **Plan tier limits** are enforced in `POST /api/leads`. See
  [Plan limits](#plan-limits).
- **Error envelope.** `{ error: string, ... }` on failure, with
  appropriate HTTP status code.

## Auth

### `GET /auth/callback?code=...`

**File:** `src/app/auth/callback/route.ts`

PKCE exchange endpoint. Receives the redirect from Supabase GoTrue
after magic link, Google OAuth, password reset, or passkey.

**Query params:**

| Name | Type | Notes |
| --- | --- | --- |
| `code` | string | PKCE code from Supabase. Required. |
| `next` | string | Optional. Path to redirect to after success. Defaults to `/dashboard`. |

**Responses:**

- `307 redirect` to `<origin>/<next>` on success.
- `307 redirect` to `<origin>/login?error=auth_callback_failed` on
  error.

**Notes:** Uses the **server** Supabase client
(`src/lib/supabase/server.ts`). The browser must reach this route
unauthenticated, so `src/middleware.ts:20` excludes `auth/callback`
from the middleware matcher.

## Leads

### `GET /api/leads`

**File:** `src/app/api/leads/route.ts`

List the current user's active leads. Rate-limited to **100 requests
/ 60 seconds** per user.

**Auth:** required (401 if no user).

**Query params:** none.

**Response:**

```ts
200 OK
{
  data: Database["public"]["Tables"]["leads"]["Row"][];
}
```

**Implementation:**

1. `supabase.auth.getUser()` → user (or 401).
2. `apiRateLimit("leads:get", user.id, 100, 60_000)` — returns 429
   if exceeded.
3. `supabase.from("leads").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false })`
4. Return rows.

### `POST /api/leads`

**File:** `src/app/api/leads/route.ts`

Insert a new lead. Enforces the plan tier limit server-side.

**Auth:** required.

**Request body** (validated by `leadSchema`):

```ts
{
  full_name: string;         // required
  email?: string;            // optional
  phone?: string;            // optional
  source: string;            // required, enum
  pipeline_stage?: string;   // optional, default "new_lead"
  notes?: string;            // optional
  next_action?: string;      // optional
  next_action_date?: string; // optional, ISO timestamp
}
```

**Response:**

```ts
201 Created
{
  data: Database["public"]["Tables"]["leads"]["Row"];
}

// Or 403:
{
  error: "Plan limit reached",
  plan: "free",
  currentCount: 10,
  maxAllowed: 10,
}
```

**Implementation:**

1. `supabase.auth.getUser()` → user (or 401).
2. Parse body, validate with `leadSchema`. 400 on parse failure.
3. `checkPlanLimit()` — if `!allowed`, return 403.
4. `supabase.from("leads").insert({ ...validated, user_id: user.id }).select().single()`
5. The `check_free_tier_lead_limit` Postgres trigger fires on
   insert. If it raises, the response is a 500 with the
   `Free tier limited to 10 active leads...` message.

### `GET /api/leads/[id]`

**File:** `src/app/api/leads/[id]/route.ts`

Get a single lead by id. RLS scopes the read to the current user.

**Auth:** required.

**Response:**

```ts
200 OK
{
  data: Database["public"]["Tables"]["leads"]["Row"];
}

// 404 if the row doesn't exist or isn't owned by the user.
```

### `PUT /api/leads/[id]`

**File:** `src/app/api/leads/[id]/route.ts`

Partial update of a lead. All fields optional.

**Auth:** required.

**Request body** (validated by `leadUpdateSchema` — all fields
optional):

```ts
{
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  source?: string;
  pipeline_stage?: string;
  notes?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  is_active?: boolean;
  deleted_at?: string | null;
}
```

**Response:**

```ts
200 OK
{
  data: Database["public"]["Tables"]["leads"]["Row"];
}
```

**Notes:** The plan-limit trigger does NOT fire on update. Drag
operations in `/pipeline` are not rate-limited at the database
level.

## PayMongo

### `POST /api/paymongo/checkout`

**File:** `src/app/api/paymongo/checkout/route.ts`

Create a PayMongo Checkout Session for the AgentFlow Pro subscription.

**Auth:** required (Supabase session).

**Request body:**

```ts
{
  interval?: "monthly" | "annual"; // defaults to "monthly"
}
```

**Response:**

```ts
200 OK
{
  url: string | null; // Checkout redirect URL (null if card already vaulted)
}
```

**Implementation:**

1. `supabase.auth.getUser()` → user.
2. Lazy-init the PayMongo client (`getPayMongoClient()` from
   `src/lib/paymongo.ts`).
3. `getOrCreatePayMongoCustomer(user)` — looks up
   `profiles.paymongo_customer_id`; if missing, creates a PayMongo
   customer (with `metadata: { supabase_user_id: id }`) and updates
   the profile via service-role key.
4. `createSubscription(customer, email, plan, returnUrl)` — creates
   a PayMongo subscription with the selected plan.
5. Return `{ url: checkout_url }` (redirects user to hosted checkout)
   or `{ url: null }` (card already vaulted, payment intent auto-charged).

### `POST /api/paymongo/webhook`

**File:** `src/app/api/paymongo/webhook/route.ts`

PayMongo webhook receiver. Raw body is read via `request.text()`;
signature is verified using HMAC-SHA256 with
`crypto.timingSafeEqual()`.

**Auth:** PayMongo signature verification (no Supabase auth).

**Handled events:**

| Event | Handler |
| --- | --- |
| `subscription.created` / `subscription.updated` | `handleSubscriptionUpdated()` — syncs `plan`, `subscription_status`, `paymongo_customer_id`, `paymongo_subscription_id`, `subscription_interval`, `grace_period_ends_at` |
| `subscription.deleted` | `handleSubscriptionDeleted()` — sets `profiles.plan = 'free'` |
| `invoice.paid` | Logs successful renewal (no-op) |
| `invoice.payment_failed` | `handlePaymentFailed()` — sets `past_due` with 3-day grace period |

All handlers use the service-role key to bypass RLS. Events are
deduplicated via `paymongo_event_id` in `webhook_events` table.

### `POST /api/paymongo/cancel`

**File:** `src/app/api/paymongo/cancel/route.ts`

Cancel an active PayMongo subscription.

**Auth:** required (Supabase session).

**Response:**

```ts
200 OK
{ success: true }

400 Bad Request
{ error: "No active subscription to cancel" }

404 Not Found
{ error: "Subscription not found" }
```

### `GET /api/cron/billing-check`

**File:** `src/app/api/cron/billing-check/route.ts`

Daily cron that checks for expired grace periods and downgrades
users to the Free plan.

**Auth:** Bearer token from `CRON_SECRET` env var.

## Cron

### `GET /api/cron/daily-digest`

**File:** `src/app/api/cron/daily-digest/route.ts`

Sends the daily digest email to all users who have leads with
actions due today or overdue. Authenticated by
`Authorization: Bearer ${CRON_SECRET}`.

**Auth:** Bearer token from `CRON_SECRET` env var. Returns 401
otherwise.

**Response:**

```ts
200 OK
{
  sent: number;   // # of users emailed
  failed: number; // # of users whose email failed
  total: number;  // # of users with due actions
}
```

**Implementation:**

1. Validate `Authorization` header.
2. Lazy-init Resend (`getResend()` from `src/lib/resend.ts`).
3. Query all users who have actions due today or earlier
   (across all users, using service-role key).
4. For each user, query their pending actions grouped by lead.
5. `sendDailyDigest(user.email, items)` — HTML email via Resend.
6. Return counts.

The cron schedule is configured externally (Vercel Cron, GitHub
Actions schedule, etc.) — see
[DEPLOYMENT.md](./DEPLOYMENT.md#cron).

## Health

### `GET /api/health`

**File:** `src/app/api/health/route.ts`

Liveness probe. No auth.

**Response:**

```ts
200 OK
{
  status: "ok",
  timestamp: string; // ISO
}
```

Used by the `scheduled-health-check.yml` workflow and any external
monitoring.

## Plan limits

`src/lib/constants.ts`:

```ts
export const PLAN_LIMITS = {
  free: { maxActiveLeads: 10, maxPipelines: 10, price: 0 },
  pro:  { maxActiveLeads: Infinity, maxPipelines: Infinity, price: 500 },  // $5/mo
  team: { maxActiveLeads: Infinity, maxPipelines: Infinity, price: 0 },   // internal placeholder
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
```

Used by:

- `checkPlanLimit()` in `src/lib/plan-limit.ts` — client-side
  read.
- `POST /api/leads` — server-side re-check.
- `check_free_tier_lead_limit()` Postgres trigger — final defense.
- Landing page pricing section.

## Rate limiting

`src/lib/rate-limiter.ts`:

```ts
apiRateLimit(
  bucket: "leads:get",  // namespace
  userId: string,       // key
  limit?: number,       // default 100
  windowMs?: number,    // default 60_000 (1 min)
): { success: boolean; remaining: number; resetAt: number }
```

In-memory `Map<string, { count, resetAt }>`. **Process-local.**
In serverless / Vercel deployments, the Map is recreated per cold
start, so rate limits are per-instance. This is fine for the
current load (solo-agent CRM) but should be swapped for Redis if
the app scales horizontally.

Currently applied:

- `GET /api/leads` — 100 req / 60s per user.

## Error responses

All endpoints return errors in the shape:

```ts
{ error: string; details?: unknown }
```

with appropriate HTTP status codes:

| Code | Meaning |
| --- | --- |
| `400` | Invalid request body (Zod parse failure) |
| `401` | No authenticated user (or bad PayMongo signature) |
| `403` | Plan limit reached |
| `404` | Resource not found or not owned by user |
| `429` | Rate limit exceeded |
| `500` | Database or third-party error |

## Headers and CORS

There is no explicit CORS configuration. All endpoints are
same-origin by design (Vercel hosts the app; the Supabase URL
is accessed from server-side handlers, not the browser). If you
add a public API, configure CORS explicitly in
`next.config.mjs` and consider an origin allowlist.

## What to read next

- [AUTHENTICATION.md](./AUTHENTICATION.md) — how the auth cookie
  gets to the server and the right Supabase client to use per
  runtime.
- [DATABASE.md](./DATABASE.md#plan-tier-enforcement) — the
  three-layer plan-limit enforcement (the third layer is the
  Postgres trigger in migration 002).
- [SECURITY.md](./SECURITY.md#rate-limiting) — why the rate
  limiter is in-memory and what to do if it becomes a bottleneck.
