"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { calcularLiquidacion } from "./queries";
import type { Database } from "@/types/database.types";

export type LiquidacionFormState = { error: string | null };

type DB = SupabaseClient<Database>;

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Número correlativo por empresa y año: LIQ-AAAA-000001. */
async function generarNumeroLiquidacion(
  supabase: DB,
  empresaId: string,
  year: string
): Promise<string> {
  const prefijo = `LIQ-${year}-`;
  const { data } = await supabase
    .from("liquidaciones")
    .select("numero")
    .eq("empresa_id", empresaId)
    .like("numero", `${prefijo}%`);
  let max = 0;
  for (const r of data ?? []) {
    const n = parseInt(String(r.numero ?? "").slice(prefijo.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefijo}${String(max + 1).padStart(6, "0")}`;
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

  // Ajustes manuales (entregable 1).
  type AjusteIn = {
    tipo: "ingreso" | "descuento";
    concepto: string;
    monto: number;
    observacion: string | null;
  };
  let ajustes: AjusteIn[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("ajustes") ?? "[]"));
    if (Array.isArray(parsed)) {
      ajustes = parsed
        .map((a): AjusteIn => ({
          tipo: a?.tipo === "ingreso" ? "ingreso" : "descuento",
          concepto: String(a?.concepto ?? "").trim(),
          monto: Number(a?.monto),
          observacion: String(a?.observacion ?? "").trim() || null,
        }))
        .filter((a) => a.concepto && Number.isFinite(a.monto) && a.monto > 0);
    }
  } catch {
    ajustes = [];
  }

  const calc = await calcularLiquidacion(supabase, propietarioId, periodo);
  if (
    calc.ingresos.length === 0 &&
    calc.descuentos.length === 0 &&
    ajustes.length === 0
  ) {
    return { error: "No hay movimientos en el período para liquidar." };
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const manualIng = r2(
    ajustes.filter((a) => a.tipo === "ingreso").reduce((s, a) => s + a.monto, 0)
  );
  const manualDesc = r2(
    ajustes.filter((a) => a.tipo === "descuento").reduce((s, a) => s + a.monto, 0)
  );
  const subtotal_ingresos = r2(calc.subtotal_ingresos + manualIng);
  const subtotal_descuentos = r2(calc.subtotal_descuentos + manualDesc);
  const total_liquidacion = r2(subtotal_ingresos - subtotal_descuentos);

  const year = ym.slice(0, 4);
  const observaciones =
    String(formData.get("observaciones") ?? "").trim() || null;

  // Inserta con número correlativo; reintenta si el número colisiona.
  let liqId: string | null = null;
  for (let intento = 0; intento < 4; intento++) {
    const numero = await generarNumeroLiquidacion(supabase, profile.empresa_id, year);
    const { data: liq, error } = await supabase
      .from("liquidaciones")
      .insert({
        empresa_id: profile.empresa_id,
        propietario_id: propietarioId,
        periodo,
        numero,
        fecha_generacion: hoy(),
        subtotal_ingresos,
        subtotal_descuentos,
        total_liquidacion,
        estado: "pendiente",
        observaciones,
      })
      .select("id")
      .single();

    if (!error && liq) {
      liqId = liq.id;
      break;
    }
    const msg = error?.message ?? "";
    if (msg.includes("uq_liquidacion_vigente")) {
      return { error: "Ya existe una liquidación para ese propietario y período." };
    }
    if (!msg.includes("duplicate") && !msg.includes("unique")) {
      return { error: "No se pudo generar la liquidación." };
    }
    // Colisión de número: reintenta con el siguiente correlativo.
  }
  if (!liqId) {
    return { error: "No se pudo asignar número de liquidación. Reintenta." };
  }

  const lineas = [
    ...calc.ingresos.map((l) => ({ ...l, observacion: null as string | null })),
    ...calc.descuentos.map((l) => ({ ...l, observacion: null as string | null })),
    ...ajustes.map((a) => ({
      tipo: a.tipo,
      concepto: a.concepto,
      referencia_tipo: "manual",
      referencia_id: null as string | null,
      observacion: a.observacion,
      monto: r2(a.monto),
    })),
  ];
  await supabase.from("liquidacion_detalles").insert(
    lineas.map((l) => ({
      empresa_id: profile.empresa_id,
      liquidacion_id: liqId as string,
      tipo: l.tipo,
      concepto: l.concepto,
      referencia_tipo: l.referencia_tipo,
      referencia_id: l.referencia_id,
      observacion: l.observacion,
      monto: l.monto,
    }))
  );

  // Marca corretaje liquidado en los contratos que lo aportaron (una sola vez).
  const contratosCorretaje = calc.descuentos
    .filter((l) => l.concepto === "Comisión corretaje" && l.referencia_id)
    .map((l) => l.referencia_id as string);
  if (contratosCorretaje.length) {
    await supabase
      .from("contratos")
      .update({ corretaje_liquidado: true })
      .in("id", contratosCorretaje);
  }

  await registrarAuditoria(supabase, profile, "liquidacion_creada", "liquidacion", liqId, {
    periodo,
    total: total_liquidacion,
  });

  revalidatePath("/liquidaciones");
  redirect(`/liquidaciones/${liqId}`);
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

  // Solo se puede anular una liquidación pendiente (pagada = solo lectura).
  const { data: liq } = await supabase
    .from("liquidaciones")
    .select("estado")
    .eq("id", id)
    .single();
  if (!liq || liq.estado !== "pendiente") {
    revalidatePath(`/liquidaciones/${id}`);
    redirect("/liquidaciones");
  }

  // Revierte el corretaje liquidado por esta liquidación (queda disponible de nuevo).
  const { data: dets } = await supabase
    .from("liquidacion_detalles")
    .select("referencia_id, concepto")
    .eq("liquidacion_id", id)
    .eq("referencia_tipo", "contrato");
  const contratosCorretaje = (dets ?? [])
    .filter((d) => d.concepto === "Comisión corretaje" && d.referencia_id)
    .map((d) => d.referencia_id as string);

  await supabase
    .from("liquidaciones")
    .update({ estado: "anulada" })
    .eq("id", id)
    .eq("estado", "pendiente");

  if (contratosCorretaje.length) {
    await supabase
      .from("contratos")
      .update({ corretaje_liquidado: false })
      .in("id", contratosCorretaje);
  }

  await registrarAuditoria(supabase, profile, "liquidacion_anulada", "liquidacion", id, null);

  revalidatePath("/liquidaciones");
  revalidatePath(`/liquidaciones/${id}`);
  redirect("/liquidaciones");
}
