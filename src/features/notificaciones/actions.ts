"use server";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SuscripcionEntrada = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

/**
 * Guarda (o renueva) la suscripción push del usuario actual. El upsert por
 * `endpoint` es lo que evita duplicados: el navegador puede volver a entregar
 * la misma suscripción, y cada fila repetida sería una notificación repetida.
 */
export async function guardarSuscripcionPush(
  sub: SuscripcionEntrada
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autorizado." };
  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { error: "Suscripción incompleta." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_suscripciones").upsert(
    {
      empresa_id: profile.empresa_id,
      profile_id: profile.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: "No se pudo activar las notificaciones." };
  return { error: null };
}

/** Da de baja este dispositivo. */
export async function eliminarSuscripcionPush(
  endpoint: string
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_suscripciones")
    .delete()
    .eq("endpoint", endpoint);

  if (error) return { error: "No se pudo desactivar las notificaciones." };
  return { error: null };
}
