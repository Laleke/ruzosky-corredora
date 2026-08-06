import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";
import { estadoCuentaDeArrendatario } from "./queries";
import type { EstadoCuenta } from "./types";

/**
 * Resuelve el estado de cuenta a partir de un token público (`/e/[token]`).
 *
 * Usa el cliente service_role a propósito: quien abre el link NO tiene sesión,
 * así que no hay nada que RLS pueda evaluar. El gate de autorización es el
 * token mismo — largo, aleatorio, revocable y con expiración opcional. Por eso
 * esta función es el ÚNICO punto de entrada público y nunca recibe un
 * `arrendatario_id` directo desde la URL: siempre se deriva del token.
 *
 * Devuelve null tanto si el token no existe como si está revocado o expirado
 * — el llamador no debe distinguir los casos (evita confirmar la existencia de
 * tokens por prueba y error).
 */
export async function estadoCuentaPorToken(token: string): Promise<EstadoCuenta | null> {
  if (!token || token.length < 16) return null;

  const admin = createAdminClient() as SupabaseClient<Database>;

  const { data: link } = await admin
    .from("estado_cuenta_links")
    .select("arrendatario_id, revocado, expira_en")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revocado) return null;
  if (link.expira_en && Date.parse(link.expira_en) < Date.now()) return null;

  return estadoCuentaDeArrendatario(link.arrendatario_id, admin);
}
