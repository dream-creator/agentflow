# Authentication

AgentFlow uses Supabase for auth (magic link / Google OAuth / email-password
/ passkey), with Cloudflare Turnstile in front of every auth request. This
document covers the four pieces that have to work together:

1. **Supabase clients** — three of them, one per runtime.
2. **Edge middleware** — route gating.
3. **PKCE callback** — the `/auth/callback` route handler.
4. **Turnstile** — captcha on auth pages, with two escape hatches.

## Supabase clients

There are three Supabase client modules, one per Next.js runtime. They
all use the same project (the `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` pair) but the cookie handling differs.

### Browser — `src/lib/supabase/client.ts`

Singleton client created with `createBrowserClient` from `@supabase/ssr`.
Memoized across calls so React's strict-mode double-invocation doesn't
double-create it.

**SSR fallback:** if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
are missing, the function returns an empty object cast to `SupabaseClient`
instead of throwing. This is intentional — the module is imported from
client components that may briefly render on the server during static
prerender (e.g. login page during build). A real call would fail at
runtime, but the build succeeds.

### Server (RSC + Server Actions) — `src/lib/supabase/server.ts`

Per-request client using `createServerClient` and Next.js's
`cookies()` helper. Each request gets a fresh instance because the
cookie adapter is per-request.

**Throws on missing env vars.** This is the server-side counterpart to
the browser's "safe `{}`" fallback. If you see this throw in a deployed
environment, check `vercel env ls`.

### Edge (middleware) — `src/lib/supabase/middleware.ts`

Edge-runtime client used in `src/middleware.ts`. Uses
`createServerClient` again but with a different cookie adapter that
reads/writes from `NextRequest.cookies` and writes to the
`NextResponse`.

**`updateSession(request)`** is the function the middleware calls. It:

1. Creates a Supabase client bound to the request.
2. Calls `supabase.auth.getUser()`. This validates the access token
   (refreshes if needed) and returns either a user or `null`.
3. Applies path-based redirects:
   - **Protected paths** (need a user): `/dashboard`, `/pipeline`,
     `/leads`, `/follow-ups`, `/settings`, `/api/leads`,
     `/api/pipeline`. If `getUser()` returns `null` →
     `NextResponse.redirect("/login?redirect=<original>")`.
   - **Auth paths** (forbid a user): `/login`, `/signup`. If a user
     exists → `NextResponse.redirect("/dashboard")`.
   - Otherwise: pass through.
4. Returns a `NextResponse` that includes the refreshed cookies
   (so the next request doesn't re-refresh).

### Why three clients?

| Client | Runtime | Cookie source | Used by |
| --- | --- | --- | --- |
| `client.ts` | Browser | `document.cookie` | `useLeads`, `useProfile`, browser-side `supabase.auth.*` calls |
| `server.ts` | Node (RSC + actions) | `next/headers` `cookies()` | Server Components, Server Actions, Route Handlers that need auth |
| `middleware.ts` | Edge | `NextRequest.cookies` | `src/middleware.ts` only |

Mixing them is the most common auth bug. If a server route is
`return supabase.auth.getUser()` but it imported from `client.ts`,
it'll silently return `null` because the browser client has no
session to read on the server. Always import the runtime-appropriate
client.

## Middleware

`src/middleware.ts` is 22 lines — a thin wrapper that calls
`updateSession(request)`. The interesting part is the `matcher`
config:

```ts
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
]
```

This regex excludes:

- `_next/static`, `_next/image` — Next's own assets.
- `favicon.ico` — always anonymous.
- `manifest.json` — PWA manifest, no auth needed.
- `sw.js` — service worker must be reachable when offline.
- `auth/callback` — Supabase OAuth PKCE callback. **Critical:** if
  middleware intercepted this path, it would try to validate a session
  before the code exchange happened and break OAuth entirely.
- Image extensions — public assets, no auth needed.

Everything else routes through `updateSession`, which is what
provides the `?redirect=<original>` behavior on unauthenticated
navigations to protected pages.

## PKCE callback

`src/app/auth/callback/route.ts` is the destination of every Supabase
auth flow that uses a code exchange (Google OAuth, password reset,
magic link click).

The flow:

1. Supabase GoTrue redirects the user to `<origin>/auth/callback?code=<pkce>`.
2. The route handler reads `code` from the URL.
3. Calls `supabase.auth.exchangeCodeForSession(code)`. This exchanges
   the PKCE code for a session and writes the auth cookies.
4. On success, redirects to `<origin>/dashboard` (or the configured
   `next` param if present).
5. On error, redirects to `<origin>/login?error=auth_callback_failed`.

`getBrowserOrigin()` (from `src/lib/auth.ts`) is used to build the
redirect URL. It prefers `window.location.origin` and falls back to
`NEXT_PUBLIC_APP_URL`. This matters because the callback URL must
match the origin that initiated the request, not a hardcoded
production URL (Vercel preview deploys each have a unique origin).

### `auth-callback-rescue.tsx`

There is a second component, `src/components/auth-callback-rescue.tsx`,
that exists for a specific edge case. When Google OAuth is
configured with `site_url = "https://agent-flow.app"`, GoTrue will
sometimes drop the user back to the site root with `?code=<pkce>`
instead of going through `/auth/callback`. This component is mounted
on the landing page via `next/dynamic` and watches for `?code=` at
the root — when it sees one, it does
`window.location.replace("/auth/callback?code=" + code)`.

This is a defensive fix for a misconfigured Supabase auth path. The
proper fix would be to set `additional_redirect_urls` correctly in
`supabase/config.toml` (which we do, but GoTrue still occasionally
falls back to `site_url` in certain OAuth provider scenarios).

## Turnstile captcha

`src/components/turnstile-widget.tsx` wraps
`@marsidev/react-turnstile` with three env-controlled behaviors:

| Env var | Effect |
| --- | --- |
| `NEXT_PUBLIC_TURNSTILE_DISABLED="true"` | Component renders nothing. **Emergency kill switch.** |
| `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS="true"` | Renders a hidden fake widget that auto-fires `onSuccess("test-bypass-token")`. Used in e2e tests. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (set) | Renders the real Turnstile widget. Required in production. |

The widget is **lazy-loaded**: the inner `<Turnstile>` is wrapped in
`React.lazy(() => import("@marsidev/react-turnstile"))` inside a
`<Suspense>`. This prevents the Cloudflare script from being in the
main bundle, and means if the script fails to load, the Suspense
fallback (or a `loadError` state set by a 10-second timeout) is shown
rather than blocking the whole page.

The `auth/captcha-status-pill.tsx` component renders a small
"Protected by Cloudflare" / "Verifying..." / "Verified" pill that
sits above the submit button. This gives the user visible feedback
that Turnstile is doing something — important because in Invisible
mode, the user otherwise sees no UI at all.

### CSP

Turnstile requires `challenges.cloudflare.com` in `script-src`,
`connect-src`, and `frame-src`. These are set in `next.config.mjs`
in the global CSP. See [SECURITY.md](./SECURITY.md#content-security-policy).

## Auth flows

### Magic link (primary)

1. User submits email on `/login` (or `/signup`).
2. Page calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getAuthCallbackUrl() } })`.
3. Supabase sends a magic link to the user's email.
4. User clicks the link → Supabase redirects to
   `<origin>/auth/callback?code=...`.
5. PKCE exchange → session cookies written → redirect to `/dashboard`.

### Google OAuth

1. User clicks "Continue with Google" on `/login` or `/signup`.
2. Page calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthCallbackUrl() } })`.
3. Browser redirects to Google → user authorizes → Google redirects
   back to Supabase's `/auth/v1/callback` → Supabase redirects to
   `<site_url>/auth/callback?code=...` (or sometimes `<site_url>/?code=...`,
   in which case `auth-callback-rescue.tsx` rescues).
4. PKCE exchange → session cookies → redirect to `/dashboard`.

### Email + password

1. User submits email + password on `/login`.
2. Page calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, session cookies written → redirect to `/dashboard`.

Sign-up goes through the magic-link flow (one-time password sent via
email). The "password" sign-in is only for returning users.

### Passkey

The login page renders a passkey option that calls
`supabase.auth.signInWithWebAuthn()` (WebAuthn API). Browser
shows the platform passkey prompt (TouchID / Windows Hello / etc.)
and on success, a session is established.

## `auth.ts` helpers

`src/lib/auth.ts` exposes three small helpers used throughout:

- **`getBrowserOrigin()`** — returns `window.location.origin` if
  available, else `process.env.NEXT_PUBLIC_APP_URL`, else `""`.
  Used in any place that needs to build a URL tied to the current
  origin (Vercel preview deploys, magic links, OAuth callbacks).
- **`getAuthCallbackUrl(path = "/auth/callback")`** — combines
  `getBrowserOrigin()` with a path. Returns
  `http://localhost:3000/auth/callback` in dev,
  `https://agent-flow.app/auth/callback` in prod, or
  `https://agentflow-<hash>.vercel.app/auth/callback` in preview.
- **`getOAuthRedirectTo(path = "/dashboard")`** — same idea, used
  for the post-OAuth landing page.

These are all unit-tested in `tests/unit/lib/auth.test.ts` (the test
suite stubs `window` with `vi.stubGlobal`).

## Where auth touches the database

When a new user signs up:

1. Supabase GoTrue creates a row in `auth.users`.
2. A database trigger (defined in the bootstrap migration) creates
   a matching row in `public.profiles` with `id = auth.users.id` and
   `email = auth.users.email`.
3. Subsequent RLS checks on `leads` and `actions` use
   `auth.uid()` to scope queries to the current user.

The trigger and the `profiles` table are described in
[DATABASE.md](./DATABASE.md#profiles).

## Testing auth

- **Unit tests** in `tests/unit/lib/auth.test.ts` cover the three
  helpers. 7 tests, all stub `window` with `vi.stubGlobal`.
- **E2E tests** in `tests/e2e/fixtures/auth.ts` provide a Playwright
  fixture that bypasses the UI entirely: it uses the Supabase admin
  API (`auth.admin.createUser` + `generate_link` + `/auth/v1/verify`)
  to mint a session server-side, then injects the resulting
  `@supabase/ssr`-formatted cookie into the Playwright browser
  context. This is necessary because (a) the password grant requires
  captcha interaction, and (b) the magic-link flow requires an email
  inbox that doesn't exist in CI.
- The cookie format is documented in the fixture: `base64-<base64url(JSON.stringify(session))>`.
  The fixture is **worker-scoped** (one user, one session, one
  Supabase rate-limit hit per Playwright worker) to avoid hitting
  Supabase's `~30 req/min` rate limit on `/auth/v1/verify`.
- The captcha bypass is also env-controlled: setting
  `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true` on the Vercel preview
  env makes the widget auto-succeed with a token that Supabase's
  captcha verification accepts (or rejects, depending on the project
  setting — see [DEPLOYMENT.md](./DEPLOYMENT.md#captcha)).

## Common pitfalls

- **Forgetting to add `auth/callback` to the matcher exclusion.**
  This breaks OAuth. The matcher is in `src/middleware.ts:20` — if
  you change it, leave the `auth/callback` exclusion in place.
- **Using `getSession()` instead of `getUser()`.** `getSession()`
  reads from cookies without validation and is vulnerable to
  tampering. Always use `getUser()` in server code, which validates
  the JWT with Supabase.
- **Hardcoding `agent-flow.app` instead of using `getBrowserOrigin()`.**
  Breaks preview deploys. Always use the helper.
- **Assuming `updateSession` redirects for non-protected paths.**
  It only redirects for the explicit protected + auth path lists in
  `src/lib/supabase/middleware.ts`. Other paths pass through.
- **Setting `NEXT_PUBLIC_TURNSTILE_DISABLED=true` in production.**
  The kill switch is for emergency use only. Captcha is the bot
  protection layer; disabling it in prod exposes every auth route to
  brute force.

## What to read next

- [DATABASE.md](./DATABASE.md) — the `profiles` table and the
  signup trigger.
- [SECURITY.md](./SECURITY.md#captcha) — Turnstile configuration and
  CSP.
- [TESTING.md](./TESTING.md#auth-fixture) — the e2e auth fixture in
  detail.
