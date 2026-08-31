"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  validarReparto,
  resolverMontoObligacion,
  estadoComprometido,
  type FilaObligacion,
} from "./reparto";
import type {
  CategoriaGasto,
  Database,
  EstadoGasto,
  ResponsableGasto,
} from "@/types/database.types";

export type GastoFormState = { error: string | null };

type DB = SupabaseClient<Database>;

const CATEGORIAS: CategoriaGasto[] = [
  "mantencion",
  "reparacion",
  "servicios",
  "gastos_comunes",
  "contribuciones",
  "seguro",
  "comision",
  "legal",
  "administracion",
  "otro",
];

const RESPONSABLES: ResponsableGasto[] = ["propietario", "arrendatario", "corredora"];

function limpiar(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

type Parsed = {
  propiedad_id: string;
  contrato_id: string | null;
  propietario_id: string | null;
  arrendatario_id: string | null;
  documento_id: string | null;
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  fecha: string;
  observaciones: string | null;
};

/** Valida y normaliza la cabecera del gasto (frontera de entrada). */
function parseGasto(fd: FormData): { data?: Parsed; error?: string } {
  const propiedad_id = limpiar(fd.get("propiedad_id"));
  if (!propiedad_id) return { error: "La propiedad es obligatoria." };

  const categoria = String(fd.get("categoria") ?? "") as CategoriaGasto;
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoría inválida." };

  const descripcion = limpiar(fd.get("descripcion"));
  if (!descripcion) return { error: "La descripción es obligatoria." };

  const monto = Number(fd.get("monto"));
  if (!Number.isFinite(monto) || monto <= 0)
    return { error: "El monto debe ser mayor a 0." };

  const fecha = limpiar(fd.get("fecha"));
  if (!fecha) return { error: "La fecha es obligatoria." };

  return {
    data: {
      propiedad_id,
      contrato_id: limpiar(fd.get("contrato_id")),
      propietario_id: limpiar(fd.get("propietario_id")),
      arrendatario_id: limpiar(fd.get("arrendatario_id")),
      documento_id: limpiar(fd.get("documento_id")),
      categoria,
      descripcion,
      monto: Math.round(monto * 100) / 100,
      fecha,
      observaciones: limpiar(fd.get("observaciones")),
    },
  };
}

/** Valida y normaliza el reparto (obligaciones + cuotas) desde el FormData. */
function parseObligaciones(
  fd: FormData,
  montoTotalGasto: number
): { data?: FilaObligacion[]; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(fd.get("obligaciones") ?? "[]"));
  } catch {
    return { error: "Reparto inválido." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "Debe definir al menos un responsable del gasto." };
  }

  const filas: FilaObligacion[] = [];
  for (const raw of parsed) {
    const responsable = raw?.responsable;
    if (!RESPONSABLES.includes(responsable)) {
      return { error: "Responsable inválido en el reparto." };
    }
    const tipo_monto = raw?.tipo_monto === "monto_fijo" ? "monto_fijo" : "porcentaje";
    const valor = Number(raw?.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      return { error: "Valor de reparto inválido." };
    }
    const cuotasRaw = Array.isArray(raw?.cuotas) ? raw.cuotas : [];
    const cuotas = cuotasRaw.map((c: unknown, i: number) => {
      const co = c as Record<string, unknown>;
      return {
        numero_cuota: Number(co?.numero_cuota) || i + 1,
        monto: Number(co?.monto),
        fecha_vencimiento: limpiar(String(co?.fecha_vencimiento ?? "") as FormDataEntryValue),
      };
    });
    for (const c of cuotas) {
      if (!Number.isFinite(c.monto) || c.monto <= 0) {
        return { error: "Monto de cuota inválido." };
      }
    }
    filas.push({ responsable, tipo_monto, valor, cuotas });
  }

  const errorReparto = validarReparto(filas, montoTotalGasto);
  if (errorReparto) return { error: errorReparto };
  return { data: filas };
}

/**
 * Responsable a guardar en `gastos.responsable_pago` (columna deprecada,
 * ya no se lee en ninguna parte del sistema, pero sigue siendo NOT NULL en
 * el esquema — se conserva con el responsable "principal" del reparto).
 */
function responsableLegado(filas: FilaObligacion[]): ResponsableGasto {
  return filas.find((f) => f.responsable === "propietario")?.responsable ?? filas[0].responsable;
}

/** Inserta las obligaciones y sus cuotas para un gasto ya creado. */
export async function insertarObligaciones(
  supabase: DB,
  empresaId: string,
  gastoId: string,
  propiedadId: string,
  propietarioId: string | null,
  fechaGasto: string,
  montoTotalGasto: number,
  filas: FilaObligacion[]
): Promise<string | null> {
  for (const f of filas) {
    const monto_calculado = resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor);
    const { data: ob, error } = await supabase
      .from("gasto_obligaciones")
      .insert({
        empresa_id: empresaId,
        gasto_id: gastoId,
        responsable: f.responsable,
        tipo_monto: f.tipo_monto,
        valor: f.valor,
        monto_calculado,
        propiedad_id: propiedadId,
        propietario_id: propietarioId,
        fecha_gasto: fechaGasto,
      })
      .select("id")
      .single();
    if (error || !ob) return "No se pudo registrar el reparto del gasto.";

    const { error: errCuotas } = await supabase.from("gasto_obligaciones_cuotas").insert(
      f.cuotas.map((c) => ({
        empresa_id: empresaId,
        obligacion_id: ob.id,
        numero_cuota: c.numero_cuota,
        monto: c.monto,
        fecha_vencimiento: c.fecha_vencimiento,
      }))
    );
    if (errCuotas) return "No se pudieron registrar las cuotas del gasto.";
  }
  return null;
}

type CuotaCompromiso = { estado: EstadoGasto; liquidacion_id: string | null };
type ObligacionCompromiso = { gasto_obligaciones_cuotas: CuotaCompromiso[] | null };

/** Consulta el compromiso (libre/parcial/total) de un gasto por sus cuotas. */
async function compromisoDeGasto(
  supabase: DB,
  gastoId: string
): Promise<"libre" | "parcial" | "total"> {
  const { data } = await supabase
    .from("gasto_obligaciones")
    .select("gasto_obligaciones_cuotas(estado, liquidacion_id)")
    .eq("gasto_id", gastoId);
  const obligaciones = ((data ?? []) as unknown as ObligacionCompromiso[]).map((o) => ({
    cuotas: o.gasto_obligaciones_cuotas ?? [],
  }));
  return estadoComprometido(obligaciones);
}

/**
 * Mantiene `gastos.estado` reflejando el compromiso agregado de sus cuotas
 * ('pagado' si todas están comprometidas, 'pendiente' en el resto) — así el
 * badge/filtro del listado, pensados para un solo estado por gasto, siguen
 * siendo correctos aunque el detalle real ahora viva por cuota. 'anulado' es
 * un estado explícito aparte (ver cambiarEstadoGasto): este sync nunca lo
 * sobrescribe.
 */
export async function sincronizarEstadoGasto(supabase: DB, gastoId: string): Promise<void> {
  const { data: actual } = await supabase
    .from("gastos")
    .select("estado")
    .eq("id", gastoId)
    .single();
  if (!actual || actual.estado === "anulado") return;

  const compromiso = await compromisoDeGasto(supabase, gastoId);
  const nuevoEstado: EstadoGasto = compromiso === "total" ? "pagado" : "pendiente";
  if (nuevoEstado !== actual.estado) {
    await supabase.from("gastos").update({ estado: nuevoEstado }).eq("id", gastoId);
  }
}

export async function crearGasto(
  _prev: GastoFormState,
  fd: FormData
): Promise<GastoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const { data, error } = parseGasto(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  const { data: filas, error: errorReparto } = parseObligaciones(fd, data.monto);
  if (errorReparto || !filas) return { error: errorReparto ?? "Reparto inválido." };

  const supabase = await createClient();
  const { data: gasto, error: dbError } = await supabase
    .from("gastos")
    .insert({
      empresa_id: profile.empresa_id,
      ...data,
      responsable_pago: responsableLegado(filas),
      creado_por: profile.id,
      creado_por_email: profile.email,
    })
    .select("id")
    .single();

  if (dbError || !gasto) return { error: "No se pudo registrar el gasto." };

  const errorObligaciones = await insertarObligaciones(
    supabase,
    profile.empresa_id,
    gasto.id,
    data.propiedad_id,
    data.propietario_id,
    data.fecha,
    data.monto,
    filas
  );
  if (errorObligaciones) {
    // El gasto quedó sin reparto válido: no lo dejamos huérfano.
    await supabase.from("gastos").delete().eq("id", gasto.id);
    return { error: errorObligaciones };
  }

  await registrarAuditoria(supabase, profile, "gasto_creado", "gasto", gasto.id, {
    monto: data.monto,
    categoria: data.categoria,
  });

  revalidatePath("/gastos");
  redirect(`/gastos/${gasto.id}`);
}

export async function actualizarGasto(
  id: string,
  _prev: GastoFormState,
  fd: FormData
): Promise<GastoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("gastos")
    .select("estado")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Gasto no encontrado." };
  if (actual.estado === "anulado")
    return { error: "El gasto está anulado; reactívalo para editarlo." };

  const compromiso = await compromisoDeGasto(supabase, id);

  const { data, error } = parseGasto(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  if (compromiso === "libre") {
    const { data: filas, error: errorReparto } = parseObligaciones(fd, data.monto);
    if (errorReparto || !filas) return { error: errorReparto ?? "Reparto inválido." };

    const { error: dbError } = await supabase
      .from("gastos")
      .update({ ...data, responsable_pago: responsableLegado(filas) })
      .eq("id", id);
    if (dbError) return { error: "No se pudo actualizar el gasto." };

    // Gasto libre: se reescribe el reparto completo (cascade borra cuotas).
    await supabase.from("gasto_obligaciones").delete().eq("gasto_id", id);
    const errorObligaciones = await insertarObligaciones(
      supabase,
      profile.empresa_id,
      id,
      data.propiedad_id,
      data.propietario_id,
      data.fecha,
      data.monto,
      filas
    );
    if (errorObligaciones) return { error: errorObligaciones };
  } else {
    // Parcial/total comprometido: solo cabecera no monetaria; el reparto ya
    // liquidado no se toca (se edita/anula cuota por cuota).
    const { error: dbError } = await supabase
      .from("gastos")
      .update({
        descripcion: data.descripcion,
        observaciones: data.observaciones,
        documento_id: data.documento_id,
      })
      .eq("id", id);
    if (dbError) return { error: "No se pudo actualizar el gasto." };
  }

  await registrarAuditoria(supabase, profile, "gasto_actualizado", "gasto", id, {
    monto: data.monto,
  });

  revalidatePath("/gastos");
  revalidatePath(`/gastos/${id}`);
  redirect(`/gastos/${id}`);
}

export type AccionResultado = { error: string | null };

/**
 * Anula/reactiva el gasto completo (nivel cabecera). El estado 'pagado' ya
 * no aplica aquí — vive por cuota, ver `cambiarEstadoCuota`/`marcarCuotaPagada`.
 */
export async function cambiarEstadoGasto(
  id: string,
  estado: EstadoGasto
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };
  if (estado === "pagado")
    return { error: "El estado 'pagado' se maneja por cuota, no a nivel de gasto." };

  const supabase = await createClient();
  const compromiso = await compromisoDeGasto(supabase, id);
  if (compromiso !== "libre") {
    return { error: "El gasto tiene cuotas comprometidas; no se puede anular/reactivar completo." };
  }

  const { error } = await supabase.from("gastos").update({ estado }).eq("id", id);
  if (error) return { error: "No se pudo cambiar el estado." };

  await registrarAuditoria(supabase, profile, "gasto_estado", "gasto", id, {
    estado,
  });

  revalidatePath("/gastos");
  revalidatePath(`/gastos/${id}`);
  return { error: null };
}

/**
 * Marca como pagada la cuota puntual de una obligación, opcionalmente
 * vinculando un comprobante (un `documento` ya subido).
 */
export async function marcarCuotaPagada(
  cuotaId: string,
  documentoId: string | null
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: cuota } = await supabase
    .from("gasto_obligaciones_cuotas")
    .select("liquidacion_id, obligacion_id")
    .eq("id", cuotaId)
    .single();
  if (!cuota) return { error: "Cuota no encontrada." };
  if (cuota.liquidacion_id)
    return { error: "La cuota está ligada a una liquidación; no se puede modificar." };

  const patch: { estado: "pagado"; documento_id?: string } = { estado: "pagado" };
  if (documentoId) patch.documento_id = documentoId;

  const { error } = await supabase
    .from("gasto_obligaciones_cuotas")
    .update(patch)
    .eq("id", cuotaId);
  if (error) return { error: "No se pudo marcar la cuota como pagada." };

  const { data: ob } = await supabase
    .from("gasto_obligaciones")
    .select("gasto_id")
    .eq("id", cuota.obligacion_id)
    .single();
  if (ob?.gasto_id) await sincronizarEstadoGasto(supabase, ob.gasto_id);

  await registrarAuditoria(supabase, profile, "cuota_pagada", "gasto_cuota", cuotaId, {
    gasto_id: ob?.gasto_id ?? null,
    comprobante: Boolean(documentoId),
  });

  revalidatePath("/gastos");
  if (ob?.gasto_id) revalidatePath(`/gastos/${ob.gasto_id}`);
  return { error: null };
}

/** Cambia el estado de una cuota puntual (pendiente/anulado; 'pagado' vía marcarCuotaPagada). */
export async function cambiarEstadoCuota(
  cuotaId: string,
  estado: EstadoGasto
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: cuota } = await supabase
    .from("gasto_obligaciones_cuotas")
    .select("liquidacion_id, obligacion_id")
    .eq("id", cuotaId)
    .single();
  if (!cuota) return { error: "Cuota no encontrada." };
  if (cuota.liquidacion_id)
    return { error: "La cuota está ligada a una liquidación; no se puede modificar." };

  const { error } = await supabase
    .from("gasto_obligaciones_cuotas")
    .update({ estado })
    .eq("id", cuotaId);
  if (error) return { error: "No se pudo cambiar el estado de la cuota." };

  const { data: ob } = await supabase
    .from("gasto_obligaciones")
    .select("gasto_id")
    .eq("id", cuota.obligacion_id)
    .single();
  if (ob?.gasto_id) await sincronizarEstadoGasto(supabase, ob.gasto_id);

  await registrarAuditoria(supabase, profile, "cuota_estado", "gasto_cuota", cuotaId, {
    gasto_id: ob?.gasto_id ?? null,
    estado,
  });

  revalidatePath("/gastos");
  if (ob?.gasto_id) revalidatePath(`/gastos/${ob.gasto_id}`);
  return { error: null };
}

/**
 * Marca pagado el caso trivial (1 responsable, 1 cuota — la mayoría de los
 * gastos reales). Si el gasto tiene reparto/cuotas múltiples, redirige a
 * manejarlo cuota por cuota desde el detalle.
 */
export async function marcarGastoPagado(
  id: string,
  documentoId: string | null
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: obligaciones } = await supabase
    .from("gasto_obligaciones")
    .select("gasto_obligaciones_cuotas(id, liquidacion_id)")
    .eq("gasto_id", id);

  type Row = { gasto_obligaciones_cuotas: { id: string; liquidacion_id: string | null }[] | null };
  const todasCuotas = ((obligaciones ?? []) as unknown as Row[]).flatMap(
    (o) => o.gasto_obligaciones_cuotas ?? []
  );
  if (todasCuotas.length !== 1) {
    return {
      error:
        "Este gasto tiene varias cuotas o responsables; marca el pago desde el detalle de cada cuota.",
    };
  }

  return marcarCuotaPagada(todasCuotas[0].id, documentoId);
}

/** Signed URL (60s) del comprobante de un gasto, si lo tiene. */
export async function getComprobanteUrlGasto(
  id: string
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin")
    return { url: null, error: "No autorizado." };

  const supabase = await createClient();
  const { data: gasto } = await supabase
    .from("gastos")
    .select("documento_id")
    .eq("id", id)
    .single();
  if (!gasto?.documento_id) return { url: null, error: "Sin comprobante." };

  const { data: ver } = await supabase
    .from("documento_versiones")
    .select("storage_path, nombre_archivo")
    .eq("documento_id", gasto.documento_id)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  if (!ver) return { url: null, error: "Comprobante no encontrado." };

  const { data } = await supabase.storage
    .from("documentos")
    .createSignedUrl(ver.storage_path, 60, { download: ver.nombre_archivo });
  return { url: data?.signedUrl ?? null, error: data?.signedUrl ? null : "No se pudo abrir." };
}

export async function eliminarGasto(id: string): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const compromiso = await compromisoDeGasto(supabase, id);
  if (compromiso !== "libre") {
    return {
      error: "El gasto tiene cuotas descontadas en una liquidación; anúlalas en vez de eliminar.",
    };
  }

  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el gasto." };

  await registrarAuditoria(supabase, profile, "gasto_eliminado", "gasto", id, null);

  revalidatePath("/gastos");
  return { error: null };
}
