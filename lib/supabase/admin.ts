import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase administratif pour les opérations serveur (API routes, admin dashboard).
 * Utilise la clé SERVICE_ROLE_KEY si disponible pour contourner le RLS, ou la clé ANON_KEY en repli.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
