import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";
import { estadoCuentaDeArrendatario } from "./queries";
import type { EstadoCuenta } from "./types";

/** Token URL-safe de 32 caracteres (~190 bits) — no adivinable por fuerza bruta. */
export function generarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Link público de estado de cuenta para un arrendatario, reutilizando el
 * vigente si ya existe (no revocado ni expirado) en vez de generar uno nuevo
 * cada vez — pensado para el cron de notificaciones de cobro, que no tiene
 * sesión de admin y por eso corre con service_role.
 */
export async function tokenEstadoCuentaVigente(
  admin: SupabaseClient<Database>,
  arrendatarioId: string,
  empresaId: string
): Promise<string> {
  const { data: existente } = await admin
    .from("estado_cuenta_links")
    .select("token, expira_en")
    .eq("arrendatario_id", arrendatarioId)
    .eq("revocado", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vigente =
    existente && (!existente.expira_en || Date.parse(existente.expira_en) > Date.now());
  if (vigente) return existente.token;

  const token = generarToken();
  await admin.from("estado_cuenta_links").insert({
    empresa_id: empresaId,
    arrendatario_id: arrendatarioId,
    token,
  });
  return token;
}

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
