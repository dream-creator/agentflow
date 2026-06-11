import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key for server-side
 * operations that bypass RLS (e.g., cron jobs, webhooks, background tasks).
 *
 * ⚠️ Never use this in client-facing code — it bypasses all row-level security.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service role env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured"
    );
  }

  return createSupabaseClient(url, serviceKey);
}
