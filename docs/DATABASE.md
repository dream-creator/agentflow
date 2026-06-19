# Database

The data layer is Supabase Postgres with row-level security. There are
three real tables, one Postgres function (a plan-limit trigger), and
generated TypeScript types in `types/supabase.ts`. The migration
history is short and almost entirely lost — see
[Migration history](#migration-history) for how to recover it.

## Tables

### `profiles`

One row per authenticated user. Created automatically when a user
signs up via a Supabase trigger (the original trigger is in the lost
migration 001; the trigger is recreated implicitly via
`auth.users.id` cascade in current state).

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | — | Primary key. Foreign key to `auth.users.id` (cascade on delete). |
| `email` | `text` | no | — | Synced from `auth.users.email` on signup. |
| `full_name` | `text` | yes | `null` | User-provided display name. |
| `plan` | `text` | no | `'free'` | One of `'free'`, `'pro'`, `'team'`. Set by PayMongo webhook on subscription change. |
| `paymongo_customer_id` | `text` | yes | `null` | Populated on first checkout. |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | Updated by trigger on row update. |

Indexes: PK on `id`. Email lookups happen via RLS-aware queries (the
user can only read their own row).

RLS policies (inferred from the codebase; the original migration is
lost, see below):

- **SELECT**: `auth.uid() = id` — users see only their own profile.
- **UPDATE**: `auth.uid() = id` — users can update only their own
  profile.
- **INSERT**: triggered automatically on auth signup; no client insert.
- **DELETE**: not exposed to clients.

### `leads`

The main CRM entity. Soft-deletable (`is_active` + `deleted_at`).

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | no | — | FK to `profiles.id`. Cascade on delete. |
| `full_name` | `text` | no | — | Lead's display name. |
| `email` | `text` | yes | `null` | Optional. |
| `phone` | `text` | yes | `null` | Optional. |
| `pipeline_stage` | `text` | no | `'new_lead'` | One of `new_lead`, `contacted`, `showing`, `offer`, `closed_won`, `closed_lost`. |
| `source` | `text` | no | — | Free-form or one of: `referral`, `website`, `open_house`, `zillow`, `realtor_com`, `social_media`, `other`. |
| `notes` | `text` | yes | `null` | Free-form. |
| `next_action` | `text` | yes | `null` | Free-form description of next step. |
| `next_action_date` | `timestamptz` | yes | `null` | When the next action is due. |
| `is_active` | `boolean` | no | `true` | Set to `false` on soft-delete. |
| `created_at` | `timestamptz` | no | `now()` | |
| `updated_at` | `timestamptz` | no | `now()` | Trigger-updated. |
| `deleted_at` | `timestamptz` | yes | `null` | Set on soft-delete. |

Indexes: PK on `id`, plus a compound index on `(user_id, is_active)`
(implicit, inferred from query patterns in `api/leads/route.ts` and
`api/leads/[id]/route.ts`).

RLS policies:

- **SELECT**: `auth.uid() = user_id`.
- **INSERT**: `auth.uid() = user_id`. Triggers
  `check_free_tier_lead_limit()` first — see
  [Plan tier enforcement](#plan-tier-enforcement).
- **UPDATE**: `auth.uid() = user_id`. Trigger does NOT fire on
  update (only on insert), so dragging a card through stages is
  never rate-limited.
- **DELETE**: `auth.uid() = user_id`. Soft-delete is preferred; the
  hooks use `update` to set `is_active = false` rather than calling
  delete.

### `actions`

Scheduled follow-ups attached to a lead. Used by the
"Today / Overdue / Upcoming" views and the daily digest email.

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key. |
| `user_id` | `uuid` | no | — | FK to `profiles.id`. Cascade on delete. |
| `lead_id` | `uuid` | no | — | FK to `leads.id`. Cascade on delete. |
| `action_type` | `text` | no | — | Free-form (e.g. `call`, `email`, `showing`). |
| `description` | `text` | yes | `null` | Optional detail. |
| `due_date` | `timestamptz` | no | — | When the action is due. |
| `completed` | `boolean` | no | `false` | |
| `completed_at` | `timestamptz` | yes | `null` | Set by `completeAction()`. |
| `created_at` | `timestamptz` | no | `now()` | |

Indexes: PK on `id`, plus implicit `(user_id, due_date)` for the
follow-up views.

RLS policies:

- **SELECT**: `auth.uid() = user_id`.
- **INSERT**: `auth.uid() = user_id`.
- **UPDATE**: `auth.uid() = user_id`.
- **DELETE**: not exposed to clients. Actions are typically marked
  complete rather than deleted.

## Plan tier enforcement

The free tier is capped at **10 active leads and 10 active
pipelines** (the pipeline cap is currently a soft concept — the
"pipeline" is just the 6-stage view of `leads`, so the lead cap
effectively caps pipelines too). The cap is enforced in three
places. **All three read the same `PLAN_LIMITS` constant** (see
[API-REFERENCE.md](./API-REFERENCE.md#plan-limits)).

### 1. Client UI

`src/lib/plan-limit.ts` exports `checkPlanLimit()`:

```ts
checkPlanLimit(): Promise<PlanLimitResult>
// → { allowed: boolean, plan: "free" | "pro" | "team",
//     currentCount: number, maxAllowed: number }
```

Called in `leads/new/page.tsx` (before the form submits) and
`leads/import/page.tsx` (before the chunked insert). If
`!allowed`, the user sees a toast with an "Upgrade to Pro" action
link. Implementation: query `leads` with `select("id", { count: "exact" })`
filtering by `is_active = true`, then compare to
`PLAN_LIMITS[plan].maxActiveLeads`.

### 2. Server API

`src/app/api/leads/route.ts` POST handler calls `checkPlanLimit()`
**again** before insert. This is a server-side re-check; the
client check exists only to show the toast before the round trip.
The server check returns 403 with `{ error: "Plan limit reached", ...}`
if the cap would be exceeded.

### 3. Postgres trigger

`supabase/migrations/002_update_free_tier_limit_to_10.sql` defines
the function `public.check_free_tier_lead_limit()` and binds it
to `leads` as a `BEFORE INSERT` trigger:

```sql
CREATE OR REPLACE FUNCTION public.check_free_tier_lead_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_plan TEXT;
  v_active_count INT;
BEGIN
  SELECT plan INTO v_user_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF v_user_plan = 'free' THEN
    SELECT COUNT(*) INTO v_active_count
    FROM public.leads
    WHERE user_id = NEW.user_id AND is_active = true;

    IF v_active_count >= 10 THEN
      RAISE EXCEPTION
        'Free tier limited to 10 active leads. Upgrade to Pro for unlimited.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This is the **last line of defense**. If a client manages to
bypass both the UI check and the server check (e.g. via direct
Supabase JS calls with the user's access token), the trigger will
still raise an exception and the insert will fail.

The trigger fires only on `INSERT`, not on `UPDATE`. Dragging a
lead through pipeline stages is not rate-limited.

## Migration history

`supabase/migrations/` contains two files:

1. **`001_initial_schema.sql`** — **a 14-line comment-only
   placeholder**. The original schema (tables, RLS, triggers) was
   applied directly via the Supabase dashboard during the project
   bootstrap and was never committed. The placeholder exists so
   that `supabase db push` (used in the staging workflow) doesn't
   complain about a missing local file for the migration version
   that's already on the remote.

2. **`002_update_free_tier_limit_to_10.sql`** — the real
   migration, containing the `check_free_tier_lead_limit()` trigger
   described above.

### Regenerating the schema

To produce a real `001_initial_schema.sql`:

1. From a host with IPv6 (the Supabase direct DB connection
   `db.fsxdduvwshirrheenmag.supabase.co` resolves to a v6-only
   address), or via the session-mode pooler at
   `aws-1-ap-southeast-1.pooler.supabase.com:5432`, run:
   ```bash
   supabase db pull --db-url "$STAGING_SUPABASE_DB_URL"
   ```
2. Clear any orphaned prepared statements first
   (e.g. `lrupsc_1_0` from a previous failed `db pull`).
3. Rename the generated file to `001_initial_schema.sql` and
   prepend the trigger / RLS policy that was created later.

Or, accept the placeholder and just add new migrations going
forward — the `supabase db push` step in the staging workflow has
a `|| true` fallback that lets migrations succeed even with a
non-existent local file for a version that's already on the
remote.

## TypeScript types

`types/supabase.ts` is generated from the remote database and
re-exports the `Database` and `Json` types via
`src/types/index.ts`:

```ts
// src/types/index.ts
export { Database, Json } from "../../types/supabase";
```

Components import the `Database` type and index into it like:

```ts
import type { Database } from "@/types";
type Lead = Database["public"]["Tables"]["leads"]["Row"];
type NewLead = Database["public"]["Tables"]["leads"]["Insert"];
```

The hooks (`useLeads`, `useProfile`, `useActions`) return these
typed rows directly, so a UI component reading `data[0].pipeline_stage`
gets full type safety without redeclaring the shape.

`types/supabase.ts` is generated by:

```bash
npx supabase gen types typescript --db-url "$SESSION_POOLER_URL"
```

The `validate-types-sync` job in the staging workflow checks
that the committed file matches the current remote schema. If
they drift, the workflow fails.

## Helper functions

The codebase reads the database almost exclusively through the
`src/hooks/` wrappers (`useLeads`, `useProfile`, `useActions`).
Two pure-JS helpers wrap the lead logic in
`src/lib/constants.ts` and `src/lib/plan-limit.ts`:

- `PLAN_LIMITS` — see [API-REFERENCE.md](./API-REFERENCE.md#plan-limits).
- `checkPlanLimit()` — see above.

There is **no direct SQL in the application code**. The only
raw SQL is the trigger in migration 002.

## Common operations

### Insert a lead (client)

```ts
import { createLead } from "@/hooks/useLeads";

const { data, error } = await createLead({
  full_name: "Jane Smith",
  email: "jane@example.com",
  phone: "+1 555 1234",
  source: "referral",
  pipeline_stage: "new_lead",
});
// `data` is a Lead row or null. `error` is SupabaseError or null.
```

`createLead` automatically:

1. Reads `user.id` from `auth.getUser()`.
2. Sets `user_id` on the insert payload (ignores any
   `user_id` field in the input).
3. Triggers the `check_free_tier_lead_limit` Postgres function
   on the way to the database.

### Update a lead (client)

```ts
import { updateLead } from "@/hooks/useLeads";

const { data, error } = await updateLead(leadId, {
  pipeline_stage: "contacted",
});
```

The hook validates that the row belongs to the current user
(Supabase RLS enforces this server-side; the client doesn't
double-check).

### Soft-delete a lead

```ts
import { deleteLead } from "@/hooks/useLeads";

const { data, error } = await deleteLead(leadId);
// Sets is_active = false, deleted_at = now()
```

Hard deletes are not exposed.

## Common pitfalls

- **Modifying `profiles` from a client.** The RLS policy is
  `auth.uid() = id`, which works. But the `plan` column should
  never be set from a client — it's owned by the PayMongo webhook.
  The `profiles` row is updated by `src/lib/paymongo.ts` using the
  service-role key, which bypasses RLS.
- **Inserting actions with a `lead_id` that doesn't belong to
  the user.** RLS on `leads` will reject the corresponding read,
  so the user can never see the action. The server-side insert
  via the service-role key (if you add one) should validate
  ownership explicitly.
- **Using `count: "exact"` with a select of large columns.** The
  `checkPlanLimit` query is `select("id", { count: "exact" })` to
  minimize data transfer. Don't add columns to that query.
- **Trusting `user_id` from a request body.** Always set it from
  `auth.getUser()`. The hooks do this; any new code that
  bypasses the hooks needs to replicate that pattern.

## What to read next

- [AUTHENTICATION.md](./AUTHENTICATION.md#where-auth-touches-the-database)
  — how the signup trigger creates the `profiles` row.
- [API-REFERENCE.md](./API-REFERENCE.md#plan-limits) — the
  `PLAN_LIMITS` constant and the API route that re-checks the cap.
- [DEPLOYMENT.md](./DEPLOYMENT.md#supabase) — Supabase
  configuration, secrets, and the staging workflow.
