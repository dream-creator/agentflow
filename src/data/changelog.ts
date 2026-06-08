import type { ChangelogEntry } from "@/lib/changelog";

/**
 * Hand-curated changelog entries, newest first.
 *
 * Edit this file to add a new release. The /changelog page
 * auto-renders, sorts, and groups whatever is here.
 *
 * Fields:
 *   id          — URL-safe slug, used as React key
 *   date        — ISO date (YYYY-MM-DD)
 *   version     — optional semver shown as a small badge
 *   title       — short, user-facing title
 *   summary     — 1-2 sentences in plain English
 *   items       — bullet points describing what changed
 *   pinned      — when true, renders at the top (one entry at a time)
 *   cta         — optional { label, href } for a call-to-action link
 *   publishedAt — optional ISO datetime; entry is hidden until then
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "login-signup-redesign",
    date: "2026-06-08",
    version: "0.20.0",
    title: "Login & signup page redesign",
    summary:
      "A cleaner, more focused sign-in experience. The left panel is now a calm brand statement with centered typography, and the right panel is streamlined with better heading consistency.",
    items: [
      "Left panel redesigned with clean light background and centered content",
      "New brand headline: 'The only thing on your screen should be who to call today.'",
      "Supporting line and three feature lines for quick value communication",
      "Trust badge removed from login right panel for a cleaner form",
      "Headings ('Welcome back' / 'Create your account') centered on both pages",
      "Font sizes bumped on left panel for better readability",
      "Right panel heading sizes aligned between login and signup",
    ],
  },
  {
    id: "shipping-status-bar",
    date: "2026-06-07",
    version: "0.19.0",
    title: "Shipping Status Bar + feature flags",
    summary:
      "A new amber banner on every dashboard page tells you what we're actively building, with a one-click link to the full changelog. Behind the scenes we also shipped a feature flag system for safer rollouts.",
    items: [
      "Amber banner with a pulse dot on every dashboard page",
      "Dismiss with the X button or press Escape — reappears on a new session",
      "Honors your 'prefers-reduced-motion' setting (no pulsing)",
      "3 feature flags ready to use: CSV Import, Pipeline view, Bulk Actions",
    ],
    pinned: true,
  },
  {
    id: "design-token-cleanup",
    date: "2026-06-07",
    title: "Design token cleanup",
    summary:
      "We replaced the last 9 raw Tailwind color references (red-500, green-50, etc.) with semantic design tokens. Same look, much easier to evolve.",
    items: [
      "Toast notifications now use semantic success / destructive / accent colors",
      "LIVE STATS badge, completed-action checkmarks, and error states aligned",
      "Sets us up for a future dark mode with zero code changes",
    ],
  },
  {
    id: "turnstile-mobile-fix",
    date: "2026-06-06",
    title: "Cloudflare Turnstile — mobile fix",
    summary:
      "The captcha widget now loads reliably on mobile, with a clear error message and retry button if your connection is slow or the script is blocked.",
    items: [
      "10-second timeout fallback with a 'Retry' button",
      "Responsive width (280px) so it fits on 320px screens",
      "Visible error state when the script fails to load",
      "Forgot-password form is now also gated behind the captcha",
    ],
  },
  {
    id: "auth-stack-unblocked",
    date: "2026-06-06",
    title: "Auth stack unblocked",
    summary:
      "Magic-link sign-in and Google OAuth now work reliably across localhost, Vercel preview deploys, and the production domain.",
    items: [
      "OAuth callback URL uses your current origin (no more stale env var)",
      "Sign-in errors from the URL (?error=...) now display in a friendly banner",
      "Supabase redirect URLs allowlisted for *.vercel.app + localhost + agent-flow.app",
    ],
  },
  {
    id: "codebase-docs",
    date: "2026-06-06",
    title: "Codebase documentation",
    summary:
      "A complete docs/ suite covering architecture, auth, database, API, environment variables, security, deployment, and onboarding. New contributors can go from zero to first deploy in under an hour.",
    items: [
      "12 markdown files, ~4,000 lines, 11 architecture diagrams",
      "docs/ONBOARDING.md walks a new dev from clone to live deploy",
      "docs/SECURITY.md captures CSP, headers, captcha, and secret rotation",
    ],
  },
  {
    id: "vercel-env-recovery",
    date: "2026-06-06",
    title: "Vercel env recovery + defensive guard",
    summary:
      "We caught and fixed a Production regression where 4 environment variables had been silently wiped to empty strings. A new defensive guard makes the UI fail loud next time instead of breaking silently.",
    items: [
      "All NEXT_PUBLIC_* and SUPABASE_SERVICE_ROLE_KEY restored and re-encrypted at rest",
      "Turnstile widget now shows 'Captcha is misconfigured' if the site key is missing",
      "Defensive .gitignore entries prevent secrets leaking from 'vercel env pull'",
    ],
  },
  {
    id: "pricing-update",
    date: "2026-06-04",
    title: "Pricing: Pro is now $5/month",
    summary:
      "Lowered the Pro tier from $19 to $5/month and bumped the free tier from 1 lead to 10 active leads and 10 pipelines. Same features, lower price.",
    items: [
      "Existing Pro subscribers automatically pay the new price on next billing cycle",
      "Free tier enforcement on the API, the database, and the client UI",
      "Upgrade CTA on the toast that appears when you hit the free limit",
    ],
  },
  {
    id: "ui-redesign",
    date: "2026-06-03",
    title: "UI/UX redesign",
    summary:
      "Full marketing and auth redesign with a flat-design system, orange CTAs everywhere, and WCAG AA contrast on every text element.",
    items: [
      "Landing page rebuilt with a product mockup, animated stats, and pricing toggle",
      "Signup page is now two-column with social proof on the left",
      "Color tokens consolidated: primary (teal), CTA (orange), accent (sky), success, warning, destructive",
    ],
  },
  {
    id: "turnstile-integration",
    date: "2026-06-04",
    title: "Cloudflare Turnstile — bot protection",
    summary:
      "Added Cloudflare Turnstile to sign-in and sign-up to stop automated abuse. Free, privacy-friendly, no image puzzles — just a checkbox that disappears for trusted users.",
    items: [
      "Magic link, password sign-in, and signup all gated",
      "Google OAuth remains CAPTCHA-free (Supabase doesn't support it there yet)",
      "Widget runs in Invisible mode for most users — they never see a challenge",
    ],
  },
  {
    id: "csv-import",
    date: "2026-05-30",
    title: "CSV lead import",
    summary:
      "Drag-and-drop CSV import for leads with auto-detected columns and batch insert. Bring your existing list in under a minute.",
    items: [
      "First-row preview before you commit",
      "Validation errors highlighted per row",
      "Up to 1,000 leads per import",
    ],
  },
  {
    id: "drag-drop-pipeline",
    date: "2026-05-30",
    title: "Drag-and-drop pipeline",
    summary:
      "Move leads between pipeline stages by dragging them. Optimistic updates with rollback on error, so the UI feels instant.",
    items: [
      "4-stage pipeline: New → Contacted → Qualified → Won",
      "Touch-friendly on mobile (long-press to start a drag)",
      "Stage order is re-orderable from Settings",
    ],
  },
];
