import { createClient } from "@/lib/supabase/server";

export type ConfigNotificacionCobro = {
  id: string;
  contrato_id: string | null;
  dias_antes: number | null;
  dias_despues: number | null;
  hora_envio: string;
  activo: boolean;
};

/** Configuración por defecto de la empresa (contrato_id = null), si existe. */
export async function getConfigNotificacionCobroDefault(
  empresaId: string
): Promise<ConfigNotificacionCobro | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config_notificaciones_cobro")
    .select("id, contrato_id, dias_antes, dias_despues, hora_envio, activo")
    .eq("empresa_id", empresaId)
    .is("contrato_id", null)
    .maybeSingle();
  return data;
}

/** Override específico de un contrato, si existe (si no, rige el default de empresa). */
export async function getConfigNotificacionCobroContrato(
  contratoId: string
): Promise<ConfigNotificacionCobro | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("config_notificaciones_cobro")
    .select("id, contrato_id, dias_antes, dias_despues, hora_envio, activo")
    .eq("contrato_id", contratoId)
    .maybeSingle();
  return data;
}
