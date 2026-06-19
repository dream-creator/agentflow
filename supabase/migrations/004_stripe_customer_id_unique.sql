-- Migration 004: Unique partial index on profiles.stripe_customer_id
--
-- SEC-017: Previously, getOrCreateStripeCustomer did a read-then-write
-- (SELECT stripe_customer_id; if null, CREATE customer + UPDATE profile).
-- Under a race (user double-clicks "Upgrade", or two browser tabs),
-- both requests observed a null customer id, both created Stripe
-- customers, and one was orphaned in Stripe — last-write-wins on the
-- profile row. The unique constraint below makes the second UPDATE
-- fail at the DB, which the application code uses as a signal to
-- re-read the winning customer id and reuse it.
--
-- The index is PARTIAL (WHERE IS NOT NULL) because the column is
-- nullable and Postgres allows multiple NULLs under a normal UNIQUE
-- constraint only since v15 — Supabase is on v15 but the partial index
-- is still the correct shape since we only ever want to enforce
-- uniqueness over actually-set customer ids.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
