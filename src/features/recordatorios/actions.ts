"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { TIPOS_DESFAZADOS } from "@/features/cobros/constants";
import type { TipoCargo } from "@/types/database.types";
import type { RecordatorioFormState } from "./types";

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function parse(formData: FormData): { tipo_cargo: TipoCargo; nombre: string | null; dia_mes_aviso: number } | { error: string } {
  const tipoRaw = String(formData.get("tipo_cargo") ?? "").trim();
  if (!(TIPOS_DESFAZADOS as string[]).includes(tipoRaw)) {
    return { error: "Selecciona el tipo de cargo a recordar." };
  }

  const dia = Number(formData.get("dia_mes_aviso"));
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) {
    return { error: "El día del mes debe ser un número entre 1 y 28." };
  }

  return {
    tipo_cargo: tipoRaw as TipoCargo,
    nombre: texto(formData, "nombre"),
    dia_mes_aviso: dia,
  };
}

export async function crearRecordatorio(
  _prev: RecordatorioFormState,
  formData: FormData
): Promise<RecordatorioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recordatorios")
    .insert({ empresa_id: profile.empresa_id, ...parsed })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el recordatorio." };

  await registrarAuditoria(supabase, profile, "recordatorio_creado", "recordatorio", data.id, {
    ...parsed,
  });

  revalidatePath("/recordatorios");
  return { error: null };
}

export async function actualizarRecordatorio(
  id: string,
  _prev: RecordatorioFormState,
  formData: FormData
): Promise<RecordatorioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("recordatorios").update(parsed).eq("id", id);
  if (error) return { error: "No se pudo actualizar el recordatorio." };

  await registrarAuditoria(supabase, profile, "recordatorio_actualizado", "recordatorio", id, {
    ...parsed,
  });

  revalidatePath("/recordatorios");
  return { error: null };
}

export async function eliminarRecordatorio(id: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("recordatorios").delete().eq("id", id);

  await registrarAuditoria(supabase, profile, "recordatorio_eliminado", "recordatorio", id, null);

  revalidatePath("/recordatorios");
}

export async function alternarActivoRecordatorio(id: string, activo: boolean): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("recordatorios").update({ activo }).eq("id", id);

  await registrarAuditoria(supabase, profile, "recordatorio_estado", "recordatorio", id, { activo });

  revalidatePath("/recordatorios");
}
