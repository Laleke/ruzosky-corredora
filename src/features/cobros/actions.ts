"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { calcularCanonActualUF } from "@/lib/uf";
import { sumarMeses } from "@/lib/fecha";
import type { Database, TipoCargo, MedioPago, ReajusteTipo } from "@/types/database.types";

export type ContratoPendienteReajuste = { id: string; propiedad_direccion: string };

export type CobroFormState = {
  error: string | null;
  mensaje?: string | null;
  contratosConReajustePendiente?: ContratoPendienteReajuste[];
};

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

  const { data } = await supabase
    .from("contratos")
    .select(
      "id, canon_monto, canon_actual, canon_uf_base, reajuste_tipo, periodicidad_reajuste_meses, fecha_proximo_reajuste, propiedades(direccion)"
    )
    .in("estado", ["vigente", "renovado"])
    .eq("activo", true);

  type ContratoRow = {
    id: string;
    canon_monto: number;
    canon_actual: number | null;
    canon_uf_base: number | null;
    reajuste_tipo: ReajusteTipo;
    periodicidad_reajuste_meses: number | null;
    fecha_proximo_reajuste: string | null;
    propiedades: { direccion: string | null } | null;
  };
  const contratos = (data ?? []) as unknown as ContratoRow[];

  if (contratos.length === 0) {
    return { error: null, mensaje: "No hay contratos activos para generar." };
  }

  // Un contrato con reajuste pendiente no genera el cargo con el monto
  // anterior sin revisión. Se compara contra el vencimiento del período que
  // se está generando (no contra la fecha real de hoy): si se genera el
  // arriendo de septiembre estando aún en agosto, un reajuste programado
  // para septiembre igual debe considerarse, porque para cuando venza ese
  // cargo el reajuste ya debería estar aplicado.
  const pendientesReajuste = contratos.filter(
    (c) => c.fecha_proximo_reajuste && c.fecha_proximo_reajuste <= vencimiento
  );

  // UF tiene fórmula objetiva (valor de UF del corte trimestral vía
  // mindicador.cl) y se autoaplica acá mismo. IPC no tiene cálculo automático
  // en este sistema (depende de un índice que no se está integrando) — sigue
  // bloqueando la generación hasta que el admin lo aplique a mano desde la
  // ficha del contrato.
  const autoAjustables = pendientesReajuste.filter(
    (c) => c.reajuste_tipo === "UF" && c.canon_uf_base !== null
  );
  const noAutoAjustables = pendientesReajuste.filter(
    (c) => !(c.reajuste_tipo === "UF" && c.canon_uf_base !== null)
  );

  const canonAutoajustado = new Map<string, number>();
  const fallidosReajuste: ContratoRow[] = [];

  for (const c of autoAjustables) {
    try {
      const canon_actual = await calcularCanonActualUF(
        c.canon_uf_base as number,
        new Date(vencimiento)
      );
      const fecha_proximo_reajuste = c.periodicidad_reajuste_meses
        ? sumarMeses(c.fecha_proximo_reajuste ?? vencimiento, c.periodicidad_reajuste_meses)
        : c.fecha_proximo_reajuste;

      const { data: actualizado, error } = await supabase
        .from("contratos")
        .update({ canon_actual, fecha_proximo_reajuste })
        .eq("id", c.id)
        .select("id")
        .maybeSingle();

      if (error || !actualizado) {
        fallidosReajuste.push(c);
        continue;
      }
      canonAutoajustado.set(c.id, canon_actual);
    } catch {
      // mindicador.cl no disponible: no bloquea el resto del lote, este
      // contrato queda pendiente de revisión manual como antes.
      fallidosReajuste.push(c);
    }
  }

  const bloqueados = [...noAutoAjustables, ...fallidosReajuste];
  const contratosConReajustePendiente = bloqueados.map((c) => ({
    id: c.id,
    propiedad_direccion: c.propiedades?.direccion ?? "—",
  }));
  const bloqueadosIds = new Set(bloqueados.map((c) => c.id));
  const contratosAGenerar = contratos.filter((c) => !bloqueadosIds.has(c.id));

  if (contratosAGenerar.length === 0) {
    return {
      error: null,
      mensaje: "Todos los contratos activos tienen reajuste pendiente de revisar.",
      contratosConReajustePendiente,
    };
  }

  const filas = contratosAGenerar.map((c) => {
    const monto = Number(canonAutoajustado.get(c.id) ?? c.canon_actual ?? c.canon_monto);
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
  revalidatePath("/contratos");
  const autoajustados = canonAutoajustado.size;
  const avisoAuto =
    autoajustados > 0
      ? ` Se autoajustó el canon UF de ${autoajustados} contrato(s) antes de generar.`
      : "";
  const avisoPendientes =
    contratosConReajustePendiente.length > 0
      ? ` ${contratosConReajustePendiente.length} propiedad(es) quedaron sin generar por tener reajuste pendiente de revisar.`
      : "";
  return {
    error: null,
    mensaje: `Cargos de arriendo generados para ${ym} (${contratosAGenerar.length} contrato(s)).${avisoAuto}${avisoPendientes}`,
    contratosConReajustePendiente:
      contratosConReajustePendiente.length > 0 ? contratosConReajustePendiente : undefined,
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

  // Solo los cargos de servicios ofrecen esta opción en el wizard; en el resto
  // el campo no viaja y el cargo queda como transferencia (ver migración 0038).
  const pago_directo_servicio = String(formData.get("destino_pago") ?? "") === "directo";

  const supabase = await createClient();
  const { error } = await supabase.from("cargos").insert({
    empresa_id: profile.empresa_id,
    contrato_id,
    periodo: `${ym}-01`,
    tipo_cargo,
    pago_directo_servicio,
    fecha_emision: hoy(),
    fecha_vencimiento: texto(formData, "fecha_vencimiento"),
    monto,
    nombre: texto(formData, "nombre"),
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

/** Actualiza un cargo existente (no cambia contrato/propiedad, esos son fijos). */
export async function actualizarCargo(
  cargoId: string,
  _prev: CobroFormState,
  formData: FormData
): Promise<CobroFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const ym = String(formData.get("periodo") ?? "");
  if (!/^\d{4}-\d{2}$/.test(ym)) return { error: "Selecciona un período válido." };

  const monto = decimal(formData, "monto");
  if (monto === null || monto <= 0) return { error: "El monto debe ser mayor a 0." };

  const tipoRaw = String(formData.get("tipo_cargo") ?? "").trim();
  if (!(TIPOS as string[]).includes(tipoRaw)) {
    return { error: "Selecciona el tipo de cargo." };
  }
  const tipo_cargo = tipoRaw as TipoCargo;
  const pago_directo_servicio = String(formData.get("destino_pago") ?? "") === "directo";

  const supabase = await createClient();

  const { data: cargo } = await supabase
    .from("cargos")
    .select("monto, saldo_pendiente")
    .eq("id", cargoId)
    .single();
  if (!cargo) return { error: "Cargo no encontrado." };

  const pagado = Number(cargo.monto) - Number(cargo.saldo_pendiente);
  if (monto < pagado) {
    return {
      error: `El monto no puede ser menor a lo ya pagado ($${pagado.toLocaleString("es-CL")}).`,
    };
  }

  const { error } = await supabase
    .from("cargos")
    .update({
      tipo_cargo,
      periodo: `${ym}-01`,
      pago_directo_servicio,
      fecha_vencimiento: texto(formData, "fecha_vencimiento"),
      monto,
      nombre: texto(formData, "nombre"),
      observaciones: texto(formData, "observaciones"),
      fecha_consumo_desde: texto(formData, "fecha_consumo_desde"),
      fecha_consumo_hasta: texto(formData, "fecha_consumo_hasta"),
    })
    .eq("id", cargoId);

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { error: "Ya existe otro cargo con ese contrato/período/tipo." };
    }
    return { error: "No se pudo actualizar el cargo." };
  }

  await recalcularCargo(supabase, cargoId);

  revalidatePath(`/cobros/${cargoId}`);
  revalidatePath("/cobros");
  return { error: null, mensaje: "Cargo actualizado." };
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

/** Edita un pago ya registrado. */
export async function editarPago(
  pagoId: string,
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

  const [{ data: cargo }, { data: pagoActual }] = await Promise.all([
    supabase.from("cargos").select("saldo_pendiente").eq("id", cargoId).single(),
    supabase.from("pagos").select("monto_pagado").eq("id", pagoId).single(),
  ]);
  if (!cargo || !pagoActual) return { error: "Pago o cargo no encontrado." };

  // Al editar, el saldo disponible incluye lo que este mismo pago ya cubría.
  const disponible = Number(cargo.saldo_pendiente) + Number(pagoActual.monto_pagado);
  if (monto_pagado > disponible + 0.01) {
    return {
      error: `El pago supera el saldo disponible ($${disponible.toLocaleString("es-CL")}).`,
    };
  }

  const { error } = await supabase
    .from("pagos")
    .update({
      fecha_pago,
      monto_pagado,
      medio_pago,
      referencia: texto(formData, "referencia"),
      observaciones: texto(formData, "observaciones"),
    })
    .eq("id", pagoId);

  if (error) return { error: "No se pudo actualizar el pago." };

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
