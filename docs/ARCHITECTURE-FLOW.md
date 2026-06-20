# AgentFlow — Codebase Flow

Mermaid diagrams mapping the runtime flow of AgentFlow ("The CRM for agents who hate CRMs"). Rendered in any markdown preview that supports Mermaid (VSCode "Markdown Preview Mermaid Support", GitHub, Obsidian, etc.).

> Last regenerated: 2026-06-07. Source paths reference `src/` at the repo root.

---

## 1. High-Level System Topology

External actors, the Next.js app, and the services it talks to.

```mermaid
flowchart LR
    User([User -- browser])
    CF[Cloudflare Turnstile]
    Supabase[(Supabase<br/>Postgres + Auth)]
    PayMongo[PayMongo]
    Resend[Resend Email]
    Vercel[Vercel<br/>hosting + cron]

    User <-->|HTTPS| Vercel
    Vercel -->|API routes| CF
    Vercel <-->|cookies + RLS| Supabase
    Vercel -->|Checkout Sessions| PayMongo
    PayMongo -.->|webhook| Vercel
    Vercel -->|daily cron GET| Resend
    Resend -.->|digest email| User
```

---

## 2. Auth — Middleware Gate (every request)

`src/lib/supabase/middleware.ts:4` runs on every request. The decision tree below is the single source of truth for who sees what.

```mermaid
flowchart TD
    Req([Incoming request]) --> Mw[middleware.ts<br/>updateSession]
    Mw -->|read cookies| SB[Supabase auth.getUser]
    SB -->|user or null| Decide{Path match?}

    Decide -->|/dashboard, /pipeline,<br/>/leads, /follow-ups,<br/>/settings, /api/leads| Prot[Protected]
    Decide -->|/login, /signup| Auth[Auth pages]
    Decide -->|other| Pass[allow through]

    Prot -->|no user| Login[Redirect -> /login?redirect=&lt;path&gt;]
    Prot -->|has user| Allow[allow]

    Auth -->|has user| Dash[Redirect -> /dashboard]
    Auth -->|no user| Allow2[allow]
```

**Protected prefix list** — `src/lib/supabase/middleware.ts:41`.

---

## 3. Auth — Magic Link / Password Sign-in

User submits the login form → Supabase Auth issues a magic link or verifies a password. The link points back at `/auth/callback` (route handler) which exchanges the `code` for a session cookie.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant L as /login (client)
    participant TW as TurnstileWidget
    participant SB as Supabase Auth
    participant EM as Email
    participant CB as /auth/callback (route)
    participant DB as Postgres

    U->>L: enter email + click "Send magic link"
    L->>TW: onSuccess(captchaToken)
    L->>SB: signInWithOtp({ email, options: { captchaToken, emailRedirectTo: getAuthCallbackUrl() } })
    SB-->>L: { data: {}, error: null }
    L-->>U: "Check your email" toast

    SB->>EM: send magic link
    EM-->>U: email arrives
    U->>CB: GET /auth/callback?code=XYZ

    CB->>SB: exchangeCodeForSession(code)
    SB->>DB: write session row + set cookies
    SB-->>CB: { session }
    CB-->>U: 302 -> /dashboard (or /leads if ?next=)

    alt exchange fails
        CB-->>U: 302 -> /login?error=auth_callback_failed
        L->>L: humanizeAuthError() renders banner
    end
```

Key files:
- `src/app/(auth)/login/page.tsx` — form, captcha wiring, error rendering
- `src/lib/auth.ts:20` — `getOAuthRedirectTo()` builds the callback URL from `window.location.origin`
- `src/app/auth/callback/route.ts:30` — `exchangeCodeForSession`

---

## 4. Auth — Google OAuth

Identical destination as magic link, different entry point. Supabase handles the provider handshake.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant L as /login
    participant SB as Supabase Auth
    participant G as Google
    participant CB as /auth/callback
    participant DB as Postgres

    U->>L: click "Continue with Google"
    L->>SB: signInWithOAuth({ provider: "google", options: { captchaToken, redirectTo: getAuthCallbackUrl() } })
    SB-->>L: { data: { url }, error: null }
    L-->>U: 302 -> Supabase-hosted /auth/v1/authorize

    U->>G: consent screen
    G-->>SB: code + state
    SB-->>CB: 302 -> /auth/callback?code=...

    CB->>SB: exchangeCodeForSession(code)
    SB->>DB: persist session
    CB-->>U: 302 -> /dashboard
```

---

## 5. Leads — 3-Layer Plan-Limit Enforcement

A new lead hits three independent gates before it can be inserted. All three read from `PLAN_LIMITS` (`src/lib/constants.ts`).

```mermaid
flowchart TD
    U([User clicks Add Lead]) --> Form[/leads/new form/]
    Form --> C1{checkPlanLimit<br/>client-side<br/>src/lib/plan-limit.ts}
    C1 -->|at limit| Toast[showToast with upgrade CTA -> /settings/billing]
    C1 -->|ok| API

    API[/api/leads POST/] --> Auth1{getUser}
    Auth1 -->|no| R401[401 Unauthorized]
    Auth1 -->|yes| RL1[rateLimit: 30 / min / user]

    RL1 --> Zod[leadSchema.safeParse]
    Zod -->|fail| R400[400 Validation]
    Zod -->|ok| C2[query profiles.plan]

    C2 --> C3[count active leads<br/>is_active = true]
    C3 --> C4{activeLeadCount<br/>>= limits.maxActiveLeads?}
    C4 -->|yes| R403[403 Free plan limited to N]
    C4 -->|no| Insert

    Insert[INSERT into leads] --> Trigger[Postgres trigger<br/>check_free_tier_lead_limit]
    Trigger -->|fail| R500[500]
    Trigger -->|ok| OK[201 Created]
```

The DB trigger (`supabase/migrations/002_update_free_tier_limit_to_10.sql`) is the **last line of defense** — it cannot be bypassed by a client bug.

---

## 6. Pipeline — Drag-and-Drop Stage Move

`/pipeline` is a client component that fetches all leads, groups them by `pipeline_stage`, and uses `@hello-pangea/dnd` (lazy-loaded via `next/dynamic`, `ssr: false`) for the drag interaction. The drop triggers an optimistic update plus a server PATCH.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant P as /pipeline (client)
    participant DB as DndBoard (dynamic chunk)
    participant H as useLeads.updateLead
    participant SB as Supabase
    participant RLS as Postgres RLS

    U->>P: GET /pipeline
    P->>H: fetchLeads()
    H->>SB: SELECT * FROM leads WHERE user_id = me
    SB->>RLS: enforce user_id = auth.uid()
    SB-->>P: leads[] grouped by stage

    U->>DB: drag card from "New" -> "Contacted"
    DB-->>P: onDragEnd(DropResult)
    P->>P: setLeads(optimistic merge)
    P->>H: updateLead(id, { pipeline_stage: "contacted" })
    H->>SB: UPDATE leads SET pipeline_stage, updated_at
    SB->>RLS: enforce user_id = auth.uid()

    alt update succeeds
        SB-->>H: row
        H-->>P: { data, error: null }
    else update fails
        H-->>P: { error }
        P->>P: revert optimistic state + show error toast
    end
```

**Performance note:** `@hello-pangea/dnd` (191KB) is dynamically imported so it only ships when the user actually visits `/pipeline` — it does not appear in the auth/dashboard/landing chunks.

---

## 7. PayMongo — Checkout + Webhook (Pro upgrade)

The flow splits into a synchronous user-facing leg (create-checkout → PayMongo-hosted page) and an async server leg (webhook → DB update). The webhook is the source of truth — never trust the redirect.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant S as /settings/billing
    participant API as /api/paymongo/checkout
    participant PM as PayMongo
    participant WH as /api/paymongo/webhook
    participant DB as Supabase

    U->>S: click "Upgrade to Pro"
    S->>API: POST /api/paymongo/checkout
    API->>API: getUser() -> must be logged in
    API->>DB: SELECT email, full_name FROM profiles
    API->>PM: getOrCreateCustomer + createSubscription
    PM-->>API: checkout URL
    API-->>S: { url }
    S-->>U: window.location → PayMongo-hosted checkout

    U->>PM: enter card, click Subscribe
    PM->>PM: create subscription, charge
    PM-->>U: 302 → /settings?upgraded=true
    PM->>WH: POST /api/paymongo/webhook (event: subscription.activated)
    WH->>WH: verifyWebhookSignature (HMAC-SHA256)
    WH->>DB: UPDATE profiles SET plan='pro', subscription_status='active'
    WH-->>PM: 200 OK
```

**Webhook handlers** (`src/lib/paymongo.ts`):
- `subscription.activated` → `handleSubscriptionActivated` → set plan to `pro`
- `subscription.cancelled` → `handleSubscriptionCancelled` → set plan to `free`
- `invoice.payment_failed` → `handlePaymentFailed` → set `subscription_status='past_due'`
- `invoice.paid` → `handlePaymentPaid` → restore active status

**Idempotency:** PayMongo retries webhooks on 5xx. The DB update is a single row-level UPDATE keyed on `id` (the user) — safe to re-apply. Deduplication uses the `webhook_events` table with `paymongo_event_id` unique constraint.

---

## 8. Daily Digest — Cron + Email

A Vercel Cron hits `/api/cron/daily-digest` once a day. The handler queries all leads with a `next_action_date` ≤ today, groups them by user, and emails each user a digest via Resend.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Vercel Cron
    participant H as /api/cron/daily-digest
    participant SB as Supabase
    participant R as Resend
    participant U as User mailbox

    Cron->>H: GET /api/cron/daily-digest<br/>Authorization: Bearer $CRON_SECRET
    H->>H: verify auth header == CRON_SECRET
    H->>SB: SELECT user_id, full_name, next_action, next_action_date, profiles!inner(email, full_name) FROM leads WHERE is_active AND next_action_date <= today
    SB-->>H: leads[]

    H->>H: group by user_id -> { email, name, leads[] }
    loop per user
        H->>R: emails.send({ to, subject, html: digest template })
        R-->>U: deliver email
    end
    H-->>Cron: { sent: N, failed: M }
```

**Auth:** `CRON_SECRET` is set in Vercel env. Anyone without the bearer token gets `401`.

---

## 9. Request Lifecycle — Putting It Together

A typical authenticated page load touches five layers. Use this to trace why something is slow or failing.

```mermaid
flowchart LR
    B[Browser request] -->|1| Edge[Vercel Edge]
    Edge -->|2| Mw[middleware.ts<br/>auth gate]
    Mw -->|3| RSC[Server Component / route handler]
    RSC -->|4| SB[Supabase<br/>Postgres + RLS]
    SB -->|5| RSC2[render HTML / JSON]
    RSC2 -->|6| Edge2[Vercel Edge cache]
    Edge2 -->|7| B

    style Edge fill:#f0fdfa,stroke:#0f766e
    style Edge2 fill:#f0fdfa,stroke:#0f766e
```

| Step | Latency typical | Failure mode |
|------|----------------|--------------|
| 1 → 2 | 5-30ms (TLS) | Network |
| 2 → 3 | <1ms (match) | Misconfigured protected prefix list |
| 3 → 4 | 50-200ms (DB) | Supabase outage, slow query, RLS denial |
| 4 → 5 | <10ms (Postgres) | DB constraint violation, trigger rejection |
| 5 → 6 | <5ms | None |
| 6 → 7 | 5-50ms (TTFB) | Vercel region miss |

---

## 10. Module Dependency Graph (selected)

Who imports what. Useful for understanding blast radius when changing a file.

```mermaid
flowchart TD
    subgraph routes["App routes (src/app)"]
        Login["login/page.tsx"]
        Signup["signup/page.tsx"]
        CB["auth/callback/route.ts"]
        Leads["(dashboard)/leads/page.tsx"]
        Pipeline["(dashboard)/pipeline/page.tsx"]
        Billing["(dashboard)/settings/billing/page.tsx"]
        ApiLeads["/api/leads/route.ts"]
        ApiPayMongo["/api/paymongo/checkout"]
        ApiWH["/api/paymongo/webhook"]
        ApiCron["/api/cron/daily-digest"]
    end

    subgraph shared["Shared modules (src/lib)"]
        Auth[auth.ts]
        Valid[validations.ts]
        RL[rate-limiter.ts]
        PayMongoLib[paymongo.ts]
        ResendLib[resend.ts]
        Constants[constants.ts<br/>PLAN_LIMITS]
        PlanLimit[plan-limit.ts]
    end

    subgraph supa["Supabase wrappers"]
        SBC[client.ts]
        SBS[server.ts]
        SBM[middleware.ts]
    end

    Login --> SBM
    Login --> Auth
    Login --> SBC
    Signup --> SBC
    CB --> SBS
    Leads --> SBC
    Leads --> Valid
    Pipeline --> SBC
    Pipeline -.->|dynamic import| DndBoard[pipeline/dnd-board.tsx]

    ApiLeads --> SBS
    ApiLeads --> Valid
    ApiLeads --> RL
    ApiLeads --> Constants

    Billing --> ApiPayMongo
    ApiPayMongo --> SBS
    ApiPayMongo --> PayMongoLib
    ApiWH --> PayMongoLib
    ApiCron --> SBS
    ApiCron --> ResendLib

    PlanLimit --> Constants
    Login -.->|client check| PlanLimit
```

---

## 11. Database Schema (RLS-enforced)

Three tables, all gated by `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`).

```mermaid
erDiagram
    PROFILES ||--o{ LEADS : owns
    PROFILES ||--o{ ACTIONS : owns
    LEADS ||--o{ ACTIONS : "has actions"

    PROFILES {
        uuid id PK "= auth.uid()"
        text email
        text full_name
        text plan "free|pro|team"
        text stripe_customer_id
        text stripe_subscription_id
        text subscription_status
        timestamptz created_at
        timestamptz updated_at
    }

    LEADS {
        uuid id PK
        uuid user_id FK
        text full_name
        text email
        text phone
        text source
        text pipeline_stage "new|contacted|qualified|proposal|won|lost"
        text next_action
        date next_action_date
        text notes
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    ACTIONS {
        uuid id PK
        uuid user_id FK
        uuid lead_id FK
        text type "call|email|meeting|note|task"
        text description
        timestamptz occurred_at
        timestamptz created_at
    }
```

---

## How to Update

These diagrams map the runtime truth. When you change a flow, edit the corresponding `sequenceDiagram` / `flowchart`. Keep file-path references in the form `src/path:line` so reviewers can jump to the source.
