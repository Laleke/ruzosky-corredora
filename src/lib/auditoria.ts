import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { Profile } from "@/lib/auth";

type DB = SupabaseClient<Database>;

/** Registra un evento de auditoría. No interrumpe el flujo si falla. */
export async function registrarAuditoria(
  supabase: DB,
  profile: Profile,
  accion: string,
  entidadTipo: string,
  entidadId: string | null,
  datos?: Json
): Promise<void> {
  try {
    await supabase.from("auditoria").insert({
      empresa_id: profile.empresa_id,
      usuario_id: profile.id,
      usuario_email: profile.email,
      accion,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      datos: datos ?? null,
    });
  } catch {
    /* la auditoría no debe bloquear la operación principal */
  }
}
