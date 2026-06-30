# Components & Hooks

Catalog of every React component and custom hook in the codebase.
Components are grouped by directory; hooks are documented in
[Hooks](#hooks).

## UI primitives (`src/components/ui/`)

### `Button`

**File:** `src/components/ui/button.tsx`

The workhorse button. Variants: `primary`, `cta`, `secondary`,
`accent`, `destructive`, `ghost`. Sizes: `sm`, `md`, `lg`. Has a
`loading` prop that shows a `Loader2` spinner and disables the
button. Min-height 44px for tap-target compliance.

```tsx
<Button variant="cta" size="md" loading={isSubmitting}>
  Send magic link
</Button>
```

### `Card`

**File:** `src/components/ui/card.tsx`

Compound: `Card`, `CardHeader`, `CardTitle`, `CardContent`. Uses
`rounded-card` and `border border-surface-200` (flat design, no
shadows).

```tsx
<Card>
  <CardHeader><CardTitle>Today</CardTitle></CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### `Badge`

**File:** `src/components/ui/badge.tsx`

Variants: `default`, `primary`, `accent`, `destructive`,
`success`, `warning`. Used for pipeline stage chips and plan
badges.

### `Toast` (system) and `EmptyState`

**File:** `src/components/ui/empty-state.tsx`

This file exports two distinct components (multi-export module):

- **`EmptyState`** — `{ icon, title, description, action, className }`.
  Used in zero-data screens (e.g. no leads yet, empty follow-ups
  list).
- **`Toast`** — single message in the toast stack. `{ variant:
  "success" | "error" | "info", title, description, action }`.
  Rendered by the `ToastContainer` below.

> **Don't confuse with `components/ui/toast.tsx`**, which is the
> pub/sub *system* (publisher + container). The component *shape*
> lives in `empty-state.tsx`.

### `Toast` (system)

**File:** `src/components/ui/toast.tsx`

Publisher/subscriber pattern for cross-page toasts. Exposes:

- `showToast({ variant?, title, description?, action? })` — fire
  a toast from anywhere.
- `ToastContainer` — mounted in `DashboardLayout`; subscribes to
  the publisher and renders the active stack.

A module-level `toastListeners: Array<(toast) => void>` array
holds subscribers; `showToast` iterates and calls each. Toasts
auto-dismiss after 5 seconds (configurable). Optional `action`
prop renders a button linking to `{ label, href }` — used for the
"Upgrade to Pro" CTA on plan-limit errors.

### `Skeleton`

**File:** `src/components/ui/skeleton.tsx`

Trivial primitive: `<div className="skeleton" {...props} />`. The
`skeleton` Tailwind class lives in `globals.css` (animated
shimmer). Used as a placeholder while data loads (e.g. on
`/leads` while `fetchLeads` is in flight).

### `ServiceWorkerRegistration`

**File:** `src/components/ui/sw-register.tsx`

Client component. On mount, registers `/sw.js` against
`navigator.serviceWorker`. Silent on error (returns `null` if
the registration throws — e.g. when served over HTTP in dev
without `localhost` exemption). Mounted once in the dashboard
layout.

## Layout (`src/components/layout/`)

### `DashboardLayout`

**File:** `src/components/layout/dashboard-layout.tsx`

Composes the dashboard chrome: `Sidebar` (md+, fixed left) +
`BottomNav` (mobile, fixed bottom) + `ToastContainer` (top right
floating) + main content area. `pb-20 md:pb-0` reserves mobile
nav space.

```tsx
<DashboardLayout user={user}>{children}</DashboardLayout>
```

Accepts a `user: { fullName, plan }` prop that the layout passes
to the sidebar's user card.

### `Sidebar`

**File:** `src/components/layout/sidebar.tsx`

Desktop sidebar (`md:block`, fixed left, 240px wide). Renders
logo, nav items (Today, Pipeline, Add Lead, Follow-ups,
Settings), and a footer user card with sign-out.

### `StickyHeader`

**File:** `src/components/layout/sticky-header.tsx`

Landing page nav. Scroll-aware (becomes opaque + adds a border
after 60px scroll). Mobile hamburger with full-screen overlay.
Anchor links: `#features`, `#how-it-works`, `#pricing`.

### `BottomNav`

**File:** `src/components/layout/bottom-nav.tsx`

Mobile bottom navigation. Same 5 items as the sidebar, with
active state. 44px touch targets per Apple HIG.

## Pipeline (`src/components/pipeline/`)

### `PipelineBoard`

**File:** `src/components/pipeline/pipeline-board.tsx`

Accordion-based pipeline view with collapsible stage sections.
Each lead card shows action buttons (Call, Email, Text) and a
stage dropdown for one-tap moves. Replaces the old drag-and-drop
board for better mobile UX and accessibility.

## Auth (`src/components/auth/`)

### `CaptchaStatusPill`

**File:** `src/components/auth/captcha-status-pill.tsx`

Three-state pill rendered above the submit button on `/login`
and `/signup`:

- `"verifying"` — `Loader2` spinner, "Verifying you're human..."
- `"ready"` — `ShieldCheck` icon, "Protected by Cloudflare
  Turnstile" (default state once script loads)
- `"verified"` — `CheckCircle2` (success color), "Verified"

Fixed `min-h-[24px]` prevents layout shift. `aria-live="polite"`
for screen readers. `role="status"`.

## Captcha (`src/components/`)

### `TurnstileWidget`

**File:** `src/components/turnstile-widget.tsx`

Lazy wrapper around `@marsidev/react-turnstile`. Three env
switches:

| Env var | Behavior |
| --- | --- |
| `NEXT_PUBLIC_TURNSTILE_DISABLED="true"` | Renders nothing. |
| `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS="true"` | Renders a hidden fake widget that auto-fires `onSuccess("test-bypass-token")` on mount. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set | Renders the real Cloudflare Turnstile widget. |

`onSuccess(token)` is the primary callback — pages consume the
token and pass it to Supabase auth (which verifies it server-side
via the project's Turnstile Secret Key). The component also
exposes `onError` (called by Cloudflare on verification failure),
`onExpire` (token expired, must re-verify), and `onLoad` (widget
mounted). A 10-second timeout fires `onError` if `onLoad` never
fires, surfacing a Retry button to the user.

### `AuthCallbackRescue`

**File:** `src/components/auth-callback-rescue.tsx`

Renders `null`. Effect-only component that watches for
`?code=<pkce>` at the root URL (a misconfiguration where Supabase
GoTrue falls back to `site_url` instead of `additional_redirect_urls`)
and `window.location.replace`s to `/auth/callback?code=...`. Mounted
on the landing page via `next/dynamic`.

## Route error boundary (`src/components/`)

### `RouteError`

**File:** `src/components/route-error.tsx`

Shared error UI used by `app/error.tsx` and
`app/(dashboard)/error.tsx`. Renders a centered card with
"Try again" (calls `reset()`) and "Back to dashboard" buttons.

## Hooks

The hooks directory is a thin client-side data layer over
Supabase. Each hook returns plain data (no React Query / SWR
caching), so components re-fetch on mount. For solo-agent use
this is fine; if load grows, consider migrating to
`@tanstack/react-query` for cache + invalidation.

### `useLeads`

**File:** `src/hooks/useLeads.ts`

```ts
fetchLeads(): Promise<{ data: Lead[]; error: SupabaseError | null }>
createLead(input: NewLead): Promise<{ data: Lead | null; error: SupabaseError | null }>
updateLead(id: string, patch: LeadUpdate): Promise<{ data: Lead | null; error: SupabaseError | null }>
deleteLead(id: string): Promise<{ data: Lead | null; error: SupabaseError | null }>
```

- `user_id` is always set from `auth.getUser()` — never trusted
  from the input.
- `createLead` runs on the browser client, but the API route is
  preferred for plan-limit enforcement. Most call sites use
  `createLead` for speed and accept the client-side check; the
  server check + DB trigger are the safety net.
- `deleteLead` is **soft** — sets `is_active = false` and
  `deleted_at = now()`. Hard delete is not exposed.

### `useProfile`

**File:** `src/hooks/useProfile.ts`

```ts
fetchProfile(): Promise<{ data: Profile | null; error: SupabaseError | null }>
updateProfile(patch: { full_name?: string; email?: string; brokerage?: string }):
  Promise<{ data: Profile | null; error: SupabaseError | null }>
```

Used by the settings page and the sidebar user card. RLS scopes
the read/write to the current user.

### ~~`useActions`~~ (removed)

Previously provided `fetchActions`, `createAction`, `completeAction`.
Removed — no production consumers. The `actions` table exists in the
DB schema but no UI or server code calls these functions.

## Page composition (high level)

The dashboard pages follow a consistent pattern:

```tsx
"use client";
import { useEffect, useState } from "react";
import { fetchLeads } from "@/hooks/useLeads";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads().then(({ data, error }) => {
      if (error) setError(error.message);
      else setLeads(data ?? []);
    });
  }, []);

  if (leads === null) return <Loading />;
  if (error) return <Error error={error} />;
  return <LeadsList leads={leads} />;
}
```

For pages that need write-through (e.g. `/leads/new`):
`onSubmit` calls the hook, the local state updates from the
return value, then navigates. Optimistic updates are used in
`/pipeline` (drag a card → UI moves immediately → API call → if
fail, roll back with a toast).

## What to read next

- [ARCHITECTURE.md](./architecture.md#data-flow) — where the
  hooks fit in the request lifecycle.
- [API-REFERENCE.md](./api-reference.md#leads) — the server
  counterpart of the lead hooks.
- [TESTING.md](./testing.md#hooks) — unit tests for the
  hooks.
