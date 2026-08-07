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
  "arriendo", "gasto_comun", "administracion", "multa", "ajuste", "luz", "agua", "internet", "otro",
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

/**
 * Recalcula saldo_pendiente y estado de un cargo según la suma de pagos.
 * Exportada: la reutiliza `aprobarSolicitudPago` (src/features/solicitudes-pago/actions.ts)
 * al crear el pago real desde una solicitud aprobada.
 */
export async function recalcularCargo(supabase: DB, cargoId: string): Promise<void> {
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
    .select("id, canon_monto, canon_actual")
    .in("estado", ["vigente", "renovado"])
    .eq("activo", true);

  if (!contratos || contratos.length === 0) {
    return { error: null, mensaje: "No hay contratos activos para generar." };
  }

  const filas = contratos.map((c) => {
    const monto = Number(c.canon_actual ?? c.canon_monto);
    return {
      empresa_id: profile.empresa_id,
      contrato_id: c.id,
      periodo,
      tipo_cargo: "arriendo" as TipoCargo,
      fecha_emision: hoy(),
      fecha_vencimiento: vencimiento,
      monto,
      saldo_pendiente: monto,
      estado: "pendiente" as const,
    };
  });

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

  // Antes, un tipo vacío o desconocido se guardaba silenciosamente como "otro"
  // — así fue como cargos de luz/agua/internet quedaron mal etiquetados en
  // producción. Ahora el tipo es obligatorio y un valor fuera de la lista se
  // rechaza en vez de corregirse por cuenta propia.
  const tipoRaw = String(formData.get("tipo_cargo") ?? "").trim();
  if (!(TIPOS as string[]).includes(tipoRaw)) {
    return { error: "Selecciona el tipo de cargo." };
  }
  const tipo_cargo = tipoRaw as TipoCargo;

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
    fecha_consumo_desde: texto(formData, "fecha_consumo_desde"),
    fecha_consumo_hasta: texto(formData, "fecha_consumo_hasta"),
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
    documento_id: texto(formData, "documento_id"),
  });

  if (error) return { error: "No se pudo registrar el pago." };

  await recalcularCargo(supabase, cargoId);

  revalidatePath(`/cobros/${cargoId}`);
  revalidatePath("/cobros");
  return { error: null };
}

/** Adjunta (o reemplaza) el comprobante de un pago ya registrado (documento subido aparte). */
export async function adjuntarComprobantePago(
  pagoId: string,
  cargoId: string,
  documentoId: string
): Promise<CobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pagos")
    .update({ documento_id: documentoId })
    .eq("id", pagoId);

  if (error) return { error: "No se pudo adjuntar el comprobante." };

  revalidatePath(`/cobros/${cargoId}`);
  return { error: null };
}

/** Signed URL (60s) del comprobante de un pago, si tiene. */
export async function getComprobanteUrlPago(
  pagoId: string
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { url: null, error: "No autorizado." };

  const supabase = await createClient();
  const { data: pago } = await supabase
    .from("pagos")
    .select("documento_id")
    .eq("id", pagoId)
    .single();
  if (!pago?.documento_id) return { url: null, error: "Sin comprobante." };

  const { data: ver } = await supabase
    .from("documento_versiones")
    .select("storage_path, nombre_archivo")
    .eq("documento_id", pago.documento_id)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (!ver) return { url: null, error: "Comprobante no encontrado." };

  const { data } = await supabase.storage
    .from("documentos")
    .createSignedUrl(ver.storage_path, 60);
  return { url: data?.signedUrl ?? null, error: data?.signedUrl ? null : "No se pudo abrir." };
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
