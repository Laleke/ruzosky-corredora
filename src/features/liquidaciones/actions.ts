"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { calcularLiquidacion } from "./queries";

export type LiquidacionFormState = { error: string | null };

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Genera la liquidación para un propietario y período (ym = YYYY-MM). */
export async function generarLiquidacion(
  propietarioId: string,
  ym: string,
  _prev: LiquidacionFormState,
  formData: FormData
): Promise<LiquidacionFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  if (!/^\d{4}-\d{2}$/.test(ym)) return { error: "Período inválido." };
  if (!propietarioId) return { error: "Selecciona un propietario." };
  const periodo = `${ym}-01`;

  const supabase = await createClient();

  // No duplicar (propietario + período) salvo anuladas.
  const { data: existente } = await supabase
    .from("liquidaciones")
    .select("id")
    .eq("propietario_id", propietarioId)
    .eq("periodo", periodo)
    .neq("estado", "anulada")
    .limit(1);
  if (existente && existente.length > 0) {
    return { error: "Ya existe una liquidación para ese propietario y período." };
  }

  const calc = await calcularLiquidacion(supabase, propietarioId, periodo);
  if (calc.ingresos.length === 0 && calc.descuentos.length === 0) {
    return { error: "No hay movimientos en el período para liquidar." };
  }

  const { data: liq, error } = await supabase
    .from("liquidaciones")
    .insert({
      empresa_id: profile.empresa_id,
      propietario_id: propietarioId,
      periodo,
      fecha_generacion: hoy(),
      subtotal_ingresos: calc.subtotal_ingresos,
      subtotal_descuentos: calc.subtotal_descuentos,
      total_liquidacion: calc.total_liquidacion,
      estado: "pendiente",
      observaciones: String(formData.get("observaciones") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !liq) {
    if (error?.message.includes("duplicate") || error?.message.includes("unique")) {
      return { error: "Ya existe una liquidación para ese propietario y período." };
    }
    return { error: "No se pudo generar la liquidación." };
  }

  const detalles = [...calc.ingresos, ...calc.descuentos].map((l) => ({
    empresa_id: profile.empresa_id,
    liquidacion_id: liq.id,
    tipo: l.tipo,
    concepto: l.concepto,
    referencia_tipo: l.referencia_tipo,
    referencia_id: l.referencia_id,
    monto: l.monto,
  }));
  if (detalles.length) {
    await supabase.from("liquidacion_detalles").insert(detalles);
  }

  await registrarAuditoria(supabase, profile, "liquidacion_creada", "liquidacion", liq.id, {
    periodo,
    total: calc.total_liquidacion,
  });

  revalidatePath("/liquidaciones");
  redirect(`/liquidaciones/${liq.id}`);
}

export async function marcarPagada(
  id: string,
  _prev: LiquidacionFormState,
  formData: FormData
): Promise<LiquidacionFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const fecha_pago = String(formData.get("fecha_pago") ?? "").trim() || hoy();
  const pago_observacion =
    String(formData.get("pago_observacion") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("liquidaciones")
    .update({ estado: "pagada", fecha_pago, pago_observacion })
    .eq("id", id)
    .eq("estado", "pendiente");

  if (error) return { error: "No se pudo marcar como pagada." };

  await registrarAuditoria(supabase, profile, "liquidacion_pagada", "liquidacion", id, {
    fecha_pago,
  });

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
  return { error: null };
}

export async function anularLiquidacion(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase
    .from("liquidaciones")
    .update({ estado: "anulada" })
    .eq("id", id)
    .neq("estado", "anulada");

  await registrarAuditoria(supabase, profile, "liquidacion_anulada", "liquidacion", id, null);

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
  redirect("/liquidaciones");
}
