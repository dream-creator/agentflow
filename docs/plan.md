# Auth Pages Redesign Plan — AgentFlow

## Context

The login and signup pages were audited across 5 dimensions: accessibility (WCAG 2.2 AA), React patterns, security, SEO, and anti-slop UX. The pages currently suffer from generic SaaS template patterns (cookie-cutter copy, unnecessary left panel, inconsistent component usage), accessibility violations (missing landmarks, broken focus management, undersized touch targets), and security gaps (user enumeration via raw Supabase error messages). This plan redesigns both pages as a single-column, clean-professional auth flow with Google as primary OAuth, plus Slack and LinkedIn via Supabase providers.

## Design Direction

- **Layout:** Single column centered, no left panel
- **Copy:** Clean professional tone — human, not generic SaaS
- **Auth hierarchy:** Google first (large hero button), then "or" divider, then email form (magic link as primary, password as secondary link)
- **Providers:** Google, Slack, LinkedIn
- **No product mockup** — the video on the landing page already covers this
- **No generic trust badges** — remove "No credit card required", "256-bit encryption", etc.

## Design Tokens (Reference)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Teal #0F766E | Branding, logo, nav accents |
| CTA | Orange #F97316 | Primary action buttons (Google, submit) |
| Accent | Sky #0369A1 | Secondary accents |
| Surface | #F8FAFC | Backgrounds |
| Font heading | Plus Jakarta Sans | Headings |
| Font body | Inter | Body text |
| Border radius | 10px cards, 8px buttons/inputs | Flat design |
| Touch target | 44px minimum | All interactive elements |

---

## Sprint 1: Critical Fixes (Accessibility + Security + CTA Color)

### 1.1 Replace `<div role="main">` with `<main>` element
- **File:** `src/app/(auth)/login/page.tsx`
- **Change:** Replace `<div ... role="main">` (line ~486) with `<main className="...">` and remove the `role="main"` attribute
- **Impact:** Fixes CRITICAL WCAG landmark violation

### 1.2 Fix password show/hide toggle tap target
- **File:** `src/app/(auth)/login/page.tsx`
- **Change:** The toggle button is ~24px. Wrap in a 44x44px hit area: `min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg`
- **Impact:** Fixes CRITICAL WCAG 2.5.8 target size violation

### 1.3 Add autocomplete attributes to all inputs
- **File:** `src/app/(auth)/login/page.tsx`
  - Email (magic-link): `autoComplete="email"`
  - Email (password): `autoComplete="email"`
  - Password: `autoComplete="current-password"`
- **File:** `src/app/(auth)/signup/page.tsx`
  - Full name: `autoComplete="name"`
  - Email: `autoComplete="email"`
- **Impact:** Fixes HIGH a11y + UX improvement (browser autofill)

### 1.4 Fix user enumeration in error messages
- **File:** `src/app/(auth)/login/page.tsx`
  - `handleMagicLink`: Replace `humanizeAuthError(error.message)` with generic "If that email exists, you'll receive a magic link shortly."
  - `handlePasswordSignIn`: Replace `humanizeAuthError(error.message)` with generic "Invalid email or password."
  - `handleForgotPassword`: Replace `humanizeAuthError(error.message)` with generic "If that email exists, you'll receive a reset link shortly."
- **File:** `src/app/(auth)/signup/page.tsx`
  - `handleSignup`: The generic fallback `"Something went wrong..."` is already safe — keep it
- **Impact:** Fixes HIGH security issue (user enumeration)

### 1.5 Fix `btn-primary` → Orange CTA
- **File:** `src/app/globals.css`
  - `btn-primary`: Change `bg-primary` to `bg-cta`, `hover:bg-primary-700` to `hover:bg-orange-600`, `active:bg-primary-800` to `active:bg-orange-700`
- **File:** `src/components/ui/button.tsx`
  - `cta` variant: Change `bg-primary` to `bg-cta`, `hover:bg-primary-700` to `hover:bg-orange-600`, `active:bg-primary-800` to `active:bg-orange-700`
- **Impact:** CTA buttons now Orange as intended by design system

### 1.6 Add `role="alert"` to signup error/success messages
- **File:** `src/app/(auth)/signup/page.tsx`
  - Add `role="alert"` to the error message div
  - Add `role="status"` to the success message div
- **Impact:** Fixes HIGH a11y (screen readers announce errors)

### 1.7 Fix focus ring contrast on login inputs
- **File:** `src/app/(auth)/login/page.tsx`
  - Change `focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]` to `focus:ring-2 focus:ring-primary focus:border-transparent` (matching signup's `input-field` style)
- **Impact:** Fixes MEDIUM a11y (focus indicator invisible at 1.08:1 contrast)

### 1.8 Add `aria-hidden` to decorative icons
- **Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
  - Add `aria-hidden="true"` to all decorative Lucide icons (Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Check, Home, Loader2)
  - Add `aria-label="Google"` to the Google SVG icon (not decorative)
- **Impact:** Fixes HIGH a11y (screen readers skip decorative icons)

---

## Sprint 2: Layout Redesign (Single Column)

### 2.1 Create `(auth)/layout.tsx`
- **New file:** `src/app/(auth)/layout.tsx`
- **Purpose:** Shared auth layout with centered single-column, proper metadata, noindex directive
- **Content:**
  ```tsx
  export const metadata = { title: "Sign in — AgentFlow" }
  export default function AuthLayout({ children }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    )
  }
  ```
- **Impact:** Consistent centering, per-page metadata, SEO noindex

### 2.2 Remove left panel from login
- **File:** `src/app/(auth)/login/page.tsx`
- **Remove:** Entire left panel div (lines ~232-340), mobile top bar (lines ~341-360), and the `DotPattern` import
- **Remove imports:** `DotPattern`, `Home` icon (logo was in left panel)
- **Simplify:** Outer container from `flex flex-col lg:flex-row` to single flex-col
- **Impact:** Cleaner single-column layout, removes ~130 lines

### 2.3 Remove left panel from signup
- **File:** `src/app/(auth)/signup/page.tsx`
- **Remove:** Entire left panel div, mobile top bar
- **Remove imports:** `DotPattern`, `Home` icon
- **Simplify:** Outer container from `flex flex-col lg:flex-row` to single flex-col
- **Impact:** Consistent with login, removes ~100 lines

### 2.4 Standardize input styling
- **File:** `src/app/(auth)/login/page.tsx`
  - Remove inline `inputBase`/`inputNormal`/`inputError` constants
  - Use `className="input-field"` (from globals.css) matching signup
  - For error state: add `input-error` class (add to globals.css if not present)
- **File:** `src/app/globals.css`
  - Add `input-error` class: `@apply border-destructive focus:ring-destructive`
- **Impact:** Single source of truth for input styling

### 2.5 Migrate login submit buttons to `<Button>` component
- **File:** `src/app/(auth)/login/page.tsx`
  - Replace 3 raw `<button className="btn-primary ...">` with `<Button variant="cta" loading={...}>`
  - Remove `btn-primary` CSS dependency from login
- **Impact:** Consistent component usage, loading states, forwardRef support

### 2.6 Consolidate loading states
- **File:** `src/app/(auth)/login/page.tsx`
  - Replace 4 booleans (`magicLinkLoading`, `passwordLoading`, `forgotPasswordLoading`, `resendLoading`) with single state:
    ```ts
    type LoadingAction = null | "magic-link" | "password" | "forgot-password" | "resend"
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
    ```
  - Derived: `const isLoading = loadingAction !== null`
  - Derived per-form: `const isMagicLinkLoading = loadingAction === "magic-link"`
- **Impact:** Fewer state variables, clearer intent

---

## Sprint 3: Auth Flow Redesign (Google + Providers)

### 3.1 Add Slack and LinkedIn OAuth handlers
- **File:** `src/app/(auth)/login/page.tsx`
  - Add `handleSlackLogin`: `signInWithOAuth({ provider: "slack", options: { redirectTo: getOAuthRedirectTo() } })`
  - Add `handleLinkedInLogin`: `signInWithOAuth({ provider: "linkedin_oidc", options: { redirectTo: getOAuthRedirectTo() } })`
  - Add loading states: `slackLoading`, `linkedinLoading` (or use consolidated `loadingAction` if Sprint 2.6 is done)
- **File:** `src/app/(auth)/signup/page.tsx`
  - Same pattern: `handleSlackSignup`, `handleLinkedInSignup`
- **Impact:** Adds 2 new OAuth providers

### 3.2 Create OAuth button row component
- **New file:** `src/components/auth/oauth-buttons.tsx`
- **Purpose:** Shared component rendering the Google (primary, large) + Slack + LinkedIn (secondary, icon row) buttons
- **Layout:**
  - Google: full-width, h-12, `variant="secondary"`, with Google SVG, "Continue with Google"
  - Below: "or" divider
  - Slack + LinkedIn: side-by-side row, each h-11, `variant="secondary"`, icon-only with `aria-label`
- **Impact:** Single source of truth for OAuth UI, shared between login and signup

### 3.3 Add provider icon SVGs
- **File:** `src/components/auth/oauth-buttons.tsx` (inline SVGs)
  - Slack: Official Slack logo SVG
  - LinkedIn: Official LinkedIn "in" logo SVG
  - Google: Move existing Google SVG from login page
- **Impact:** Consistent icon treatment

### 3.4 Update auth form structure
- **File:** `src/app/(auth)/login/page.tsx`
  - New order: `<OAuthButtons />` → "or" divider (already in OAuthButtons) → email input → magic link submit → "or sign in with password" link
  - Google button goes above email form (hero position)
  - Magic link is the default email action (not password)
  - Password is accessible via "Use password instead" link (existing toggle, just repositioned)
- **File:** `src/app/(auth)/signup/page.tsx`
  - New order: `<OAuthButtons />` → email input + name → submit → "Already have an account?" link
  - Same OAuth hierarchy as login
- **Impact:** Modern SaaS auth flow with Google as hero

### 3.5 Update CaptchaStatusPill integration
- **File:** `src/app/(auth)/login/page.tsx`
  - Move CaptchaStatusPill to render below the email input (not above submit)
  - Keeps `aria-live="polite"` for screen reader announcements
- **File:** `src/app/(auth)/signup/page.tsx`
  - Same positioning change
- **Impact:** Better visual proximity — captcha status appears near the email input it gates

---

## Sprint 4: Copy & Polish

### 4.1 Rewrite all auth copy
- **Login page:**
  - Remove "Welcome back" → Replace with something domain-specific or remove h1 entirely (let Google button speak)
  - Remove "Sign in to your AgentFlow account"
  - Remove "No password required — instant sign-in" helper text
  - Remove "Protected by Cloudflare Turnstile" trust badge text (keep the Pill component, just remove verbose text)
  - Magic link success: "Check your email" → keep but simplify copy
  - Password view: minimal copy, just email + password + submit
- **Signup page:**
  - Remove "Create your account"
  - Remove "Start managing leads in 30 seconds" — sounds like a landing page CTA
  - Simplify to just the form fields + submit
- **Impact:** Eliminates generic SaaS copy

### 4.2 Remove generic trust signals
- **Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
  - Remove "256-bit encryption · SOC 2 compliant" badge (if present)
  - Remove "No credit card required · Free forever · Cancel anytime" (if present)
  - Keep CaptchaStatusPill but simplify to icon-only (no text)
- **Impact:** Removes AI slop trust badges

### 4.3 Standardize padding and max-width
- **File:** `src/app/(auth)/layout.tsx`
  - Single `max-w-[380px]` for both pages
  - Single `px-4` for mobile, no special desktop padding
- **File:** `src/app/(auth)/login/page.tsx`
  - Remove `px-6 sm:px-12` — layout handles it
- **File:** `src/app/(auth)/signup/page.tsx`
  - Remove `px-4 sm:px-6` — layout handles it
- **Impact:** Visual consistency

### 4.4 Add `input-error` CSS class
- **File:** `src/app/globals.css`
  - Add: `.input-error { @apply border-destructive focus:ring-destructive; }`
- **Impact:** Reusable error state class

### 4.5 Add maxLength to inputs
- **File:** `src/app/(auth)/login/page.tsx`
  - Email: `maxLength={254}` (RFC 5321 max)
- **File:** `src/app/(auth)/signup/page.tsx`
  - Name: `maxLength={100}`
  - Email: `maxLength={254}`
- **Impact:** Prevents absurdly long inputs

### 4.6 Delete DotPattern component
- **File:** `src/components/ui/dot-pattern.tsx`
  - Delete file (no longer used after left panel removal)
- **Impact:** Dead code removal

### 4.7 Add loading.tsx for (auth) group
- **New file:** `src/app/(auth)/loading.tsx`
  - Simple centered spinner matching the auth layout
- **Impact:** Better UX during route transitions

### 4.8 Add `(auth)/error.tsx` improvement
- **File:** `src/app/(auth)/error.tsx`
  - Currently 13 lines wrapping RouteError — keep as-is, just verify it works with new layout

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/app/(auth)/layout.tsx` | **NEW** — shared auth layout, metadata, noindex |
| `src/app/(auth)/loading.tsx` | **NEW** — auth loading skeleton |
| `src/app/(auth)/login/page.tsx` | Remove left panel, single column, consolidate state, fix a11y, fix security, rewrite copy, add providers |
| `src/app/(auth)/signup/page.tsx` | Remove left panel, single column, fix a11y, rewrite copy, add providers |
| `src/components/auth/oauth-buttons.tsx` | **NEW** — shared OAuth button component |
| `src/components/turnstile-widget.tsx` | No changes needed |
| `src/components/auth/captcha-status-pill.tsx` | Simplify to icon-only variant |
| `src/components/ui/button.tsx` | Fix `cta` variant to use Orange |
| `src/app/globals.css` | Fix `btn-primary` → Orange CTA, add `input-error` class |
| `src/components/ui/dot-pattern.tsx` | **DELETE** — no longer used |

## Files NOT Modified (Verified)

| File | Why no change |
|------|---------------|
| `src/lib/auth.ts` | Already provider-agnostic |
| `src/app/auth/callback/route.ts` | Already provider-agnostic |
| `src/lib/supabase/client.ts` | No provider logic |
| `src/middleware.ts` | Already excludes auth/callback |
| `next.config.mjs` | OAuth redirects are server-side, CSP unaffected |
| `src/app/layout.tsx` | Root layout unchanged; auth layout overrides |

## External Setup Required (User Action)

| Provider | Dashboard | Steps |
|----------|-----------|-------|
| Slack | api.slack.com/apps | Create app → OAuth → scopes: openid, profile, email → Redirect URI → copy Client ID + Secret |
| LinkedIn | linkedin.com/developers | Create app → OAuth 2.0 → scopes: openid, profile, email → Redirect URI → copy Client ID + Secret |
| Supabase | Dashboard → Auth → Providers | Enable Slack + LinkedIn (OIDC), paste credentials |

All providers share the same callback URL: `https://fsxdduvwshirrheenmag.supabase.co/auth/v1/callback`

## Verification

1. `npx tsc --noEmit` — 0 TypeScript errors
2. `npx next lint` — 0 warnings
3. `npx vitest run` — existing tests pass (may need snapshot updates)
4. `npm run build` — 25+ routes, 0 errors
5. Manual browser test: `/login` — Google button visible, email form visible, magic link sends, password works
6. Manual browser test: `/signup` — all 3 OAuth buttons visible, signup form works
7. Accessibility: `axe` audit on both pages — 0 violations
8. Screen reader test: landmarks announced correctly (`<main>` on login), form errors announced via `role="alert"`
9. Responsive: 320px viewport — form centered, touch targets 44px+, no horizontal scroll
