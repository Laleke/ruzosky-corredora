"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type { Database } from "@/types/database.types";

export type ConfigNotificacionCobroFormState = { error: string | null };

type DB = SupabaseClient<Database>;

function entero(formData: FormData, campo: string): number | null {
  const v = String(formData.get(campo) ?? "").trim();
  if (v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parse(
  formData: FormData
): { dias_antes: number | null; dias_despues: number | null; hora_envio: string; activo: boolean } | { error: string } {
  const dias_antes = entero(formData, "dias_antes");
  const dias_despues = entero(formData, "dias_despues");
  if (dias_antes !== null && dias_antes <= 0) {
    return { error: "Los días antes del vencimiento deben ser mayor a 0." };
  }
  if (dias_despues !== null && dias_despues <= 0) {
    return { error: "Los días después del vencimiento deben ser mayor a 0." };
  }
  if (dias_antes === null && dias_despues === null) {
    return { error: "Configura al menos un aviso (antes o después del vencimiento)." };
  }

  const hora_envio = String(formData.get("hora_envio") ?? "09:00").trim() || "09:00";
  const activo = formData.get("activo") === "on";

  return { dias_antes, dias_despues, hora_envio, activo };
}

/** Inserta o actualiza la fila default (contrato_id null) o de override (contrato_id dado). */
async function guardar(
  supabase: DB,
  empresaId: string,
  contratoId: string | null,
  datos: { dias_antes: number | null; dias_despues: number | null; hora_envio: string; activo: boolean }
): Promise<{ id: string } | { error: string } > {
  let existente = supabase
    .from("config_notificaciones_cobro")
    .select("id")
    .eq("empresa_id", empresaId);
  existente = contratoId ? existente.eq("contrato_id", contratoId) : existente.is("contrato_id", null);
  const { data: fila } = await existente.maybeSingle();

  if (fila) {
    const { error } = await supabase
      .from("config_notificaciones_cobro")
      .update(datos)
      .eq("id", fila.id);
    if (error) return { error: "No se pudo guardar la configuración." };
    return { id: fila.id };
  }

  const { data: creada, error } = await supabase
    .from("config_notificaciones_cobro")
    .insert({ empresa_id: empresaId, contrato_id: contratoId, ...datos })
    .select("id")
    .single();
  if (error) return { error: "No se pudo guardar la configuración." };
  return { id: creada.id };
}

/** Configuración por defecto de la empresa — aplica a todo contrato sin override propio. */
export async function guardarConfigNotificacionCobroDefault(
  _prev: ConfigNotificacionCobroFormState,
  formData: FormData
): Promise<ConfigNotificacionCobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const resultado = await guardar(supabase, profile.empresa_id, null, parsed);
  if ("error" in resultado) return { error: resultado.error };

  await registrarAuditoria(
    supabase,
    profile,
    "config_notificacion_cobro_default_guardada",
    "config_notificaciones_cobro",
    resultado.id,
    { ...parsed }
  );

  revalidatePath("/configuracion");
  return { error: null };
}

/** Override puntual de un contrato — reemplaza el default de empresa solo para ese contrato. */
export async function guardarConfigNotificacionCobroContrato(
  contratoId: string,
  _prev: ConfigNotificacionCobroFormState,
  formData: FormData
): Promise<ConfigNotificacionCobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const resultado = await guardar(supabase, profile.empresa_id, contratoId, parsed);
  if ("error" in resultado) return { error: resultado.error };

  await registrarAuditoria(
    supabase,
    profile,
    "config_notificacion_cobro_contrato_guardada",
    "config_notificaciones_cobro",
    resultado.id,
    { contrato_id: contratoId, ...parsed }
  );

  revalidatePath(`/contratos/${contratoId}`);
  return { error: null };
}

/** Vuelve al default de empresa para este contrato (borra el override). */
export async function quitarOverrideNotificacionCobro(contratoId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase
    .from("config_notificaciones_cobro")
    .delete()
    .eq("contrato_id", contratoId);

  await registrarAuditoria(
    supabase,
    profile,
    "config_notificacion_cobro_override_eliminado",
    "config_notificaciones_cobro",
    contratoId,
    null
  );

  revalidatePath(`/contratos/${contratoId}`);
}
