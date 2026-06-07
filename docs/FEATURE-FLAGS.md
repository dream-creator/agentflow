# Feature Flags

Operational reference for the env-var feature flag system. For the
**why** and the alternatives we considered, see
[ADR-0001: Env-var feature flag system](./adr/0001-env-var-feature-flags.md).

## Current flags

| Flag | Env var | Default | Used by |
| --- | --- | --- | --- |
| `csv_import` | `NEXT_PUBLIC_FEATURE_CSV_IMPORT` | **on** | The "Import" button in `/leads` |
| `pipeline` | `NEXT_PUBLIC_FEATURE_PIPELINE` | **on** | (reserved — no consumer yet) |
| `bulk_actions` | `NEXT_PUBLIC_FEATURE_BULK_ACTIONS` | **on** | (reserved — no consumer yet) |

Plus one non-flag toggle that lives next to the flags for convenience:

| Toggle | Env var | Default | Effect |
| --- | --- | --- | --- |
| Maintenance banner | `NEXT_PUBLIC_MAINTENANCE_BANNER` | **off** | The amber "Shipping Status Bar" on dashboard pages |

## How to flip a flag

### Production

1. Go to [Vercel → agentflow project → Settings → Environment Variables](https://vercel.com/ryans-projects-9d1f8f11/agentflow/settings/environment-variables).
2. Find the env var (e.g. `NEXT_PUBLIC_FEATURE_CSV_IMPORT`).
3. Edit its value:
   - To **turn off**: set the value to the literal string `false`.
   - To **turn on**: set the value to anything else (`true`, `1`, `yes`, `on`)
     — or remove the var entirely to fall through to the code default.
4. **Important**: trigger a redeploy. `NEXT_PUBLIC_*` values are inlined
   at build time, so a value change in the Vercel dashboard does not
   affect already-deployed code.

   Use one of:
   ```bash
   vercel deploy --prod --yes
   ```
   or push a commit to `main` (CI redeploys automatically).

### Preview / staging

Same as production, but set the value on the **Preview** environment
in the Vercel dashboard. The flag will apply to all preview deploys
until you remove it.

### Local dev

Add the env var to your `.env.local` (gitignored) and restart
`npm run dev`:

```bash
# .env.local
NEXT_PUBLIC_FEATURE_CSV_IMPORT=false
```

Restart the dev server. Next.js only reads `.env.local` at startup.

## Semantics — read this before flipping

### Flags (fail-open)

Only the literal lowercase string `false` kills a flag. **Everything
else falls through to the code default.**

| Env var value | Result |
| --- | --- |
| `"false"` | Flag is **off** |
| `"FALSE"` | Flag is **on** (falls through to default) |
| `"0"` | Flag is **on** (falls through to default) |
| `"no"` | Flag is **on** (falls through to default) |
| `""` (empty) | Flag is **on** (falls through to default) |
| Missing var | Flag is **on** (falls through to default) |

**Why fail-open?** A typo'd env var should never silently turn off a
paying feature. The only string that can break a flag is the canonical
kill string.

### Maintenance banner (fail-closed)

The banner is the **opposite** — only the literal lowercase string
`true` shows it.

| Env var value | Result |
| --- | --- |
| `"true"` | Banner is **visible** |
| `"TRUE"` | Banner is **hidden** (falls through to default) |
| `"1"`, `"yes"`, `"on"` | Banner is **hidden** (falls through to default) |
| `""` (empty) | Banner is **hidden** (falls through to default) |
| Missing var | Banner is **hidden** (falls through to default) |

**Why fail-closed?** The banner appears on every dashboard page, in
front of paying users. It must never appear by accident.

## How to add a new flag

1. **Decide the default.** Most flags should default to **on** (the
   feature is live) or **off** (the feature is hidden, code is staged).
   Document the choice in the PR.

2. **Add the entry to the registry** in
   [`src/lib/feature-flags.ts`](../src/lib/feature-flags.ts):

   ```ts
   export const FEATURE_FLAGS = {
     csv_import:   { label: "CSV Lead Import",   default: true },
     pipeline:     { label: "Pipeline View",     default: true },
     bulk_actions: { label: "Bulk Actions",      default: true },

     // ↓ new flag below
     new_feature:  { label: "New Feature Name",  default: false },
   } as const satisfies Record<string, FeatureFlag>;
   ```

3. **Call it in code:**

   ```tsx
   import { isFeatureEnabled } from "@/lib/feature-flags";

   if (isFeatureEnabled("new_feature")) {
     // render the new UI
   }
   ```

4. **Add a unit test** to
   [`tests/unit/lib/feature-flags.test.ts`](../tests/unit/lib/feature-flags.test.ts).
   The existing tests cover the fail-open / fail-closed matrix; add
   at least one test for the new flag's default.

5. **Document it in the table above.** Add a row to "Current flags"
   with the env var, default, and consumer.

6. **Update `docs/ENVIRONMENT-VARIABLES.md`.** Add the new env var to
   the "Quick reference" table and to the "Feature flags" section.

7. **(Optional) Set the env var in Vercel.** If you want the flag
   flipped differently from the default in production, set it in
   Vercel. Otherwise, the code default applies.

## Implementation files

- [`src/lib/feature-flags.ts`](../src/lib/feature-flags.ts) — the registry
  and the `isFeatureEnabled()` / `isMaintenanceBannerVisible()`
  helpers.
- [`src/components/maintenance-banner.tsx`](../src/components/maintenance-banner.tsx) —
  the first consumer of `isMaintenanceBannerVisible()`.
- [`src/app/(dashboard)/leads/page.tsx`](../src/app/(dashboard)/leads/page.tsx) —
  the first consumer of `isFeatureEnabled("csv_import")`.
- [`tests/unit/lib/feature-flags.test.ts`](../tests/unit/lib/feature-flags.test.ts) —
  10 unit tests covering defaults, env overrides, and fail-open /
  fail-closed semantics.

## Limitations

- **Sub-minute rollbacks require Vercel deploy.** A flag flip is
  effective at the next build. For instant rollback during an outage,
  use Vercel's per-deployment "Redeploy" button on a previous build
  rather than flipping a flag.
- **No percentage rollouts, no per-user targeting.** When we need
  either, we'll move to a managed service (LaunchDarkly, PostHog,
  GrowthBook). The ADR captures the trigger conditions for that
  move.
- **Client-side only.** Flags are inlined in the browser bundle.
  Server-side code (API routes, middleware) can't check
  `isFeatureEnabled()` — the server bundle doesn't include
  `NEXT_PUBLIC_*` values and would always see the code default.
  Today we don't need server-side flag checks; flag for the day we
  do.
