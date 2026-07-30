import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente con service_role — bypassa RLS. Solo debe importarse desde server
 * actions ya gateadas por getCurrentProfile()/rol==='admin'
 * (ver src/features/portal/actions.ts). Nunca desde código de cliente ni
 * desde un route handler sin ese gate previo.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
