"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LinkState = { token: string | null; error: string | null };

/** Token URL-safe de 32 caracteres (~190 bits) — no adivinable por fuerza bruta. */
function generarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Crea (o reemplaza) el link público de estado de cuenta de un arrendatario.
 * Revoca los anteriores para que solo exista uno vigente a la vez: si un link
 * se compartió por error, generar uno nuevo invalida el viejo.
 */
export async function generarLinkEstadoCuenta(arrendatarioId: string): Promise<LinkState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { token: null, error: "No autorizado." };

  const supabase = await createClient();

  const { error: errRevocar } = await supabase
    .from("estado_cuenta_links")
    .update({ revocado: true })
    .eq("arrendatario_id", arrendatarioId)
    .eq("revocado", false);
  if (errRevocar) return { token: null, error: "No se pudo regenerar el link." };

  const token = generarToken();
  const { error } = await supabase.from("estado_cuenta_links").insert({
    empresa_id: profile.empresa_id,
    arrendatario_id: arrendatarioId,
    token,
    creado_por: profile.id,
  });
  if (error) return { token: null, error: "No se pudo generar el link." };

  revalidatePath(`/cobros/estados-cuenta/${arrendatarioId}`);
  return { token, error: null };
}

/** Deja sin efecto el link vigente — quien lo tenga deja de ver la deuda. */
export async function revocarLinkEstadoCuenta(
  arrendatarioId: string
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("estado_cuenta_links")
    .update({ revocado: true })
    .eq("arrendatario_id", arrendatarioId)
    .eq("revocado", false);
  if (error) return { error: "No se pudo revocar el link." };

  revalidatePath(`/cobros/estados-cuenta/${arrendatarioId}`);
  return { error: null };
}
