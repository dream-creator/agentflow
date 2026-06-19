# GLM 5.2 — AgentFlow Security & Capability Analysis Prompt

## Context

You are analyzing **AgentFlow**, a production SaaS CRM for solo real estate agents.
It is live at https://agent-flow.app with real users.

**Stack:**
- Next.js 14.2.35 (App Router, TypeScript strict)
- Supabase Cloud (PostgreSQL + GoTrue + RLS)
- PayMongo (payments, webhooks, subscription management)
- Cloudflare Turnstile (CAPTCHA on auth pages)
- Resend (transactional email)
- Vercel (hosting, edge middleware)
- Sentry (error tracking)

**Architecture:**
- Server-side auth via Supabase middleware (Edge runtime)
- Row Level Security (RLS) on all tables
- API routes use service-role key for DB access (with `auth.uid()` checks)
- Client-side data fetching via custom hooks
- PayMongo webhooks for subscription lifecycle

---

## Task 1: Security Audit

Perform a comprehensive security audit of the AgentFlow codebase. Focus on these areas in priority order:

### Critical (must fix before any release)
1. **Authentication & Authorization**
   - Are there any routes that can be accessed without authentication?
   - Can a user access another user's data (IDOR)?
   - Is the Supabase service-role key ever exposed to the client?
   - Are RLS policies correctly enforced, or are there bypass vectors?

2. **Input Validation & Injection**
   - Is every API endpoint validated with Zod?
   - Are there SQL injection vectors via Supabase client?
   - Is user input sanitized before rendering (XSS)?
   - Are file uploads (CSV import) validated for size, content type, and malicious payloads?

3. **Webhook Security**
   - Are PayMongo webhooks verified with signature validation?
   - Can an attacker forge webhook events to upgrade their plan?
   - Is the webhook secret stored securely (not in client bundle)?

4. **Secrets & Configuration**
   - Are any API keys, tokens, or secrets exposed in the client bundle (`NEXT_PUBLIC_*`)?
   - Is `SUPABASE_SERVICE_ROLE_KEY` properly guarded?
   - Are environment variables properly scoped (production vs preview vs development)?

### High
5. **Rate Limiting**
   - Is rate limiting applied to all sensitive endpoints (auth, API, webhooks)?
   - Is the rate limiter distributed (survives serverless cold starts)?
   - Can an attacker bypass rate limiting?

6. **Session & Cookie Security**
   - Are cookies set with `httpOnly`, `secure`, `sameSite`?
   - Is there session fixation or session hijacking risk?
   - How long do sessions persist?

7. **API Security**
   - Are CORS headers configured correctly?
   - Is there CSRF protection on state-changing endpoints?
   - Are error messages safe (no stack traces or internal paths leaked)?

### Medium
8. **Dependency Security**
   - Are there known vulnerabilities in `npm audit`?
   - Are dependencies pinned or floating?
   - Are there any Supply Chain risks?

9. **Content Security Policy**
   - Is CSP configured in production?
   - Are there `unsafe-inline` or `unsafe-eval` directives?
   - Is the CSP sufficient to prevent XSS?

10. **Data Exposure**
    - Is PII (email, phone, name) exposed in any public endpoint?
    - Are database error messages safe?
    - Is logging sanitizing sensitive data?

---

## Task 2: Capability Analysis

Evaluate AgentFlow against these capability dimensions:

### Core CRM
- Lead management (CRUD, import, search, filter)
- Pipeline management (stages, drag-and-drop, bulk actions)
- Follow-up tracking (daily digest, overdue alerts)
- Contact management (phone, email, SMS integration points)

### Authentication & Multi-tenancy
- Magic link authentication
- Google OAuth
- Cloudflare Turnstile CAPTCHA
- Row Level Security (multi-tenant isolation)

### Payments & Subscriptions
- PayMongo checkout (subscription creation)
- Webhook-driven plan enforcement
- Free tier limits (10 leads, 10 pipelines)
- Pro tier (unlimited)

### Developer Experience
- TypeScript strict mode
- CI/CD (GitHub Actions — 5 workflows)
- Unit tests (Vitest, 254 tests)
- E2E tests (Playwright)
- Load tests

### Deployment & Infrastructure
- Vercel edge middleware
- Supabase Cloud (managed Postgres)
- Custom domain (`agent-flow.app`)
- PWA capabilities (manifest, service worker)

---

## Task 3: Gap Analysis

Compare AgentFlow against these competitor capabilities:

| Feature | Follow Up Boss ($69/mo) | kvCORE ($100/mo) | AgentFlow ($8/mo) |
|---------|------------------------|-------------------|-------------------|
| Unlimited leads | ✅ | ✅ | ✅ (Pro) |
| Pipeline view | ✅ | ✅ | ✅ |
| Mobile app | ✅ | ✅ | PWA |
| Email integration | ✅ | ✅ | Via Resend (digest) |
| SMS integration | ✅ | ✅ | ❌ (planned) |
| Calling | ✅ | ✅ | ✅ (one-tap) |
| Drip campaigns | ✅ | ✅ | ❌ (planned) |
| Team features | ✅ | ✅ | ❌ (solo only) |
| IDX integration | ✅ | ✅ | ❌ |
| Custom branding | ✅ | ✅ | ✅ (Pro) |

Identify:
1. **Must-have gaps** — features that prevent adoption by solo agents
2. **Nice-to-have gaps** — features that would increase retention
3. **Security gaps** — areas where AgentFlow is weaker than competitors
4. **Pricing gaps** — where the $8 price point creates expectations that aren't met

---

## Output Format

For each finding, use this format:

```
### [SEVERITY] Finding Title

**Category:** Authentication / Authorization / Injection / etc.
**File(s):** `src/path/to/file.ts:line`
**Description:** What the vulnerability is and how it could be exploited.
**Impact:** What an attacker could achieve.
**Recommendation:** How to fix it, with code example if applicable.
**Effort:** S / M / L (hours to fix)
```

For capability analysis, use:

```
### Capability: [Name]

**Current state:** What exists today.
**Gap level:** None / Minor / Significant / Critical.
**Competitor comparison:** How competitors handle this.
**Recommendation:** What to build or improve.
**Priority:** P0 / P1 / P2 / P3.
```

---

## Constraints

- Do NOT modify any code. This is an analysis-only task.
- Do NOT expose any actual secrets, API keys, or tokens in your output.
- Use placeholder values (e.g., `sk_xxx`, `NEXT_PUBLIC_SUPABASE_URL`) when referencing secrets.
- Focus on actionable findings, not theoretical risks.
- Prioritize findings by real-world exploitability.
