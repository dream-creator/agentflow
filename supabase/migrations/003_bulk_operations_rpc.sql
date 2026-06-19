-- Migration 003: RPC functions for bulk operations
-- Replaces sequential Supabase client calls with single Postgres operations.

-- Bulk update: change pipeline_stage for multiple leads in one call.
-- Accepts an array of lead IDs and the new stage.
-- Verifies ownership via auth.uid() to prevent RLS bypass.
CREATE OR REPLACE FUNCTION public.bulk_update_leads(
  lead_ids uuid[],
  new_stage text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leads
  SET pipeline_stage = new_stage,
      updated_at = now()
  WHERE id = ANY(lead_ids)
    AND user_id = auth.uid();
END;
$$;

-- Bulk soft-delete: set is_active=false for multiple leads in one call.
CREATE OR REPLACE FUNCTION public.bulk_delete_leads(
  lead_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leads
  SET is_active = false,
      updated_at = now()
  WHERE id = ANY(lead_ids)
    AND user_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users (Supabase anon + authenticated roles)
GRANT EXECUTE ON FUNCTION public.bulk_update_leads(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete_leads(uuid[]) TO authenticated;
