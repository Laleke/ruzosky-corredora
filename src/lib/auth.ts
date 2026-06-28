import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Devuelve el profile del usuario autenticado (capa de permisos del sistema),
 * o null si no hay sesión. Nunca exponer auth.users a la lógica de negocio:
 * usar siempre este profile.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
