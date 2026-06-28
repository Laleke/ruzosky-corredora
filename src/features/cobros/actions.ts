"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Database, TipoCargo, MedioPago } from "@/types/database.types";

export type CobroFormState = { error: string | null; mensaje?: string | null };

type DB = SupabaseClient<Database>;

const TIPOS: TipoCargo[] = [
  "arriendo", "gasto_comun", "administracion", "multa", "ajuste", "otro",
];
const MEDIOS: MedioPago[] = [
  "transferencia", "efectivo", "cheque", "tarjeta", "otro",
];

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function decimal(formData: FormData, campo: string): number | null {
  const v = String(formData.get(campo) ?? "").trim();
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/** Recalcula saldo_pendiente y estado de un cargo según la suma de pagos. */
async function recalcularCargo(supabase: DB, cargoId: string): Promise<void> {
  const { data: cargo } = await supabase
    .from("cargos")
    .select("monto")
    .eq("id", cargoId)
    .single();
  if (!cargo) return;

  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto_pagado")
    .eq("cargo_id", cargoId);

  const pagado = (pagos ?? []).reduce(
    (acc, p) => acc + Number(p.monto_pagado),
    0
  );
  const saldo = Math.round((Number(cargo.monto) - pagado) * 100) / 100;
  const estado =
    saldo <= 0 ? "pagado" : pagado > 0 ? "parcial" : "pendiente";

  await supabase
    .from("cargos")
    .update({ saldo_pendiente: saldo < 0 ? 0 : saldo, estado })
    .eq("id", cargoId);
}

/** Genera el cargo de arriendo del mes para todos los contratos activos. */
export async function generarArriendosDelMes(
  _prev: CobroFormState,
  formData: FormData
): Promise<CobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const ym = String(formData.get("periodo") ?? ""); // formato YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    return { error: "Selecciona un período válido." };
  }
  const periodo = `${ym}-01`;
  const vencimiento = `${ym}-05`;

  const supabase = await createClient();

  const { data: contratos } = await supabase
    .from("contratos")
    .select("id, canon_monto")
    .in("estado", ["vigente", "renovado"])
    .eq("activo", true);

  if (!contratos || contratos.length === 0) {
    return { error: null, mensaje: "No hay contratos activos para generar." };
  }

  const filas = contratos.map((c) => ({
    empresa_id: profile.empresa_id,
    contrato_id: c.id,
    periodo,
    tipo_cargo: "arriendo" as TipoCargo,
    fecha_emision: hoy(),
    fecha_vencimiento: vencimiento,
    monto: Number(c.canon_monto),
    saldo_pendiente: Number(c.canon_monto),
    estado: "pendiente" as const,
  }));

  // ignoreDuplicates: no recrea cargos ya generados para ese contrato/mes.
  const { error } = await supabase
    .from("cargos")
    .upsert(filas, {
      onConflict: "contrato_id,periodo,tipo_cargo",
      ignoreDuplicates: true,
    });

  if (error) return { error: "No se pudieron generar los cargos." };

  revalidatePath("/cobros");
  return {
    error: null,
    mensaje: `Cargos de arriendo generados para ${ym} (${contratos.length} contrato(s)).`,
  };
}

/** Crea un cargo manual (gasto común, administración, multa, etc.). */
export async function crearCargo(
  _prev: CobroFormState,
  formData: FormData
): Promise<CobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const contrato_id = texto(formData, "contrato_id");
  if (!contrato_id) return { error: "Selecciona un contrato." };

  const ym = String(formData.get("periodo") ?? "");
  if (!/^\d{4}-\d{2}$/.test(ym)) return { error: "Selecciona un período válido." };

  const monto = decimal(formData, "monto");
  if (monto === null || monto <= 0) return { error: "El monto debe ser mayor a 0." };

  const tipoRaw = String(formData.get("tipo_cargo") ?? "arriendo");
  const tipo_cargo = (TIPOS as string[]).includes(tipoRaw)
    ? (tipoRaw as TipoCargo)
    : "otro";

  const supabase = await createClient();
  const { error } = await supabase.from("cargos").insert({
    empresa_id: profile.empresa_id,
    contrato_id,
    periodo: `${ym}-01`,
    tipo_cargo,
    fecha_emision: hoy(),
    fecha_vencimiento: texto(formData, "fecha_vencimiento"),
    monto,
    saldo_pendiente: monto,
    estado: "pendiente",
    observaciones: texto(formData, "observaciones"),
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { error: "Ya existe ese cargo (contrato/período/tipo)." };
    }
    return { error: "No se pudo crear el cargo." };
  }

  revalidatePath("/cobros");
  redirect("/cobros");
}

export async function registrarPago(
  cargoId: string,
  _prev: CobroFormState,
  formData: FormData
): Promise<CobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const monto_pagado = decimal(formData, "monto_pagado");
  if (monto_pagado === null || monto_pagado <= 0) {
    return { error: "El monto del pago debe ser mayor a 0." };
  }

  const fecha_pago = texto(formData, "fecha_pago") ?? hoy();

  const medioRaw = texto(formData, "medio_pago");
  const medio_pago =
    medioRaw && (MEDIOS as string[]).includes(medioRaw)
      ? (medioRaw as MedioPago)
      : null;

  const supabase = await createClient();

  const { data: cargo } = await supabase
    .from("cargos")
    .select("saldo_pendiente")
    .eq("id", cargoId)
    .single();
  if (!cargo) return { error: "Cargo no encontrado." };

  if (monto_pagado > Number(cargo.saldo_pendiente) + 0.01) {
    return {
      error: `El pago supera el saldo pendiente ($${Number(
        cargo.saldo_pendiente
      ).toLocaleString("es-CL")}).`,
    };
  }

  const { error } = await supabase.from("pagos").insert({
    empresa_id: profile.empresa_id,
    cargo_id: cargoId,
    fecha_pago,
    monto_pagado,
    medio_pago,
    referencia: texto(formData, "referencia"),
    observaciones: texto(formData, "observaciones"),
  });

  if (error) return { error: "No se pudo registrar el pago." };

  await recalcularCargo(supabase, cargoId);

  revalidatePath(`/cobros/${cargoId}`);
  revalidatePath("/cobros");
  return { error: null };
}

export async function eliminarPago(pagoId: string, cargoId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("pagos").delete().eq("id", pagoId);
  await recalcularCargo(supabase, cargoId);

  revalidatePath(`/cobros/${cargoId}`);
  revalidatePath("/cobros");
}

export async function eliminarCargo(cargoId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("cargos").delete().eq("id", cargoId);

  revalidatePath("/cobros");
  redirect("/cobros");
}
