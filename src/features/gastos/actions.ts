"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type {
  CategoriaGasto,
  EstadoGasto,
  ResponsableGasto,
} from "@/types/database.types";

export type GastoFormState = { error: string | null };

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
const RESPONSABLES: ResponsableGasto[] = [
  "propietario",
  "arrendatario",
  "corredora",
];

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
  estado: EstadoGasto;
  responsable_pago: ResponsableGasto;
  descontar_de_liquidacion: boolean;
  observaciones: string | null;
};

/** Valida y normaliza el FormData del gasto (frontera de entrada). */
function parseGasto(fd: FormData): { data?: Parsed; error?: string } {
  const propiedad_id = limpiar(fd.get("propiedad_id"));
  if (!propiedad_id) return { error: "La propiedad es obligatoria." };

  const categoria = String(fd.get("categoria") ?? "") as CategoriaGasto;
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoría inválida." };

  const responsable_pago = String(
    fd.get("responsable_pago") ?? ""
  ) as ResponsableGasto;
  if (!RESPONSABLES.includes(responsable_pago))
    return { error: "Responsable de pago inválido." };

  const descripcion = limpiar(fd.get("descripcion"));
  if (!descripcion) return { error: "La descripción es obligatoria." };

  const monto = Number(fd.get("monto"));
  if (!Number.isFinite(monto) || monto <= 0)
    return { error: "El monto debe ser mayor a 0." };

  const fecha = limpiar(fd.get("fecha"));
  if (!fecha) return { error: "La fecha es obligatoria." };

  const estadoRaw = String(fd.get("estado") ?? "pendiente");
  const estado: EstadoGasto =
    estadoRaw === "pagado" || estadoRaw === "anulado" ? estadoRaw : "pendiente";

  // Regla: solo un gasto del propietario puede descontarse de su liquidación.
  // Los gastos del arrendatario/corredora nunca afectan la rentabilidad del dueño.
  const descontar_de_liquidacion =
    responsable_pago === "propietario" &&
    fd.get("descontar_de_liquidacion") != null;

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
      estado,
      responsable_pago,
      descontar_de_liquidacion,
      observaciones: limpiar(fd.get("observaciones")),
    },
  };
}

export async function crearGasto(
  _prev: GastoFormState,
  fd: FormData
): Promise<GastoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const { data, error } = parseGasto(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  const supabase = await createClient();
  const { data: gasto, error: dbError } = await supabase
    .from("gastos")
    .insert({
      empresa_id: profile.empresa_id,
      ...data,
      creado_por: profile.id,
      creado_por_email: profile.email,
    })
    .select("id")
    .single();

  if (dbError || !gasto) return { error: "No se pudo registrar el gasto." };

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
    .select("estado, liquidacion_id")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Gasto no encontrado." };
  if (actual.liquidacion_id)
    return {
      error: "El gasto ya fue descontado en una liquidación; no se puede editar.",
    };

  const { data, error } = parseGasto(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  const { error: dbError } = await supabase
    .from("gastos")
    .update(data)
    .eq("id", id);
  if (dbError) return { error: "No se pudo actualizar el gasto." };

  await registrarAuditoria(supabase, profile, "gasto_actualizado", "gasto", id, {
    monto: data.monto,
  });

  revalidatePath("/gastos");
  revalidatePath(`/gastos/${id}`);
  redirect(`/gastos/${id}`);
}

export type AccionResultado = { error: string | null };

export async function cambiarEstadoGasto(
  id: string,
  estado: EstadoGasto
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("gastos")
    .select("liquidacion_id")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Gasto no encontrado." };
  if (actual.liquidacion_id)
    return { error: "El gasto está ligado a una liquidación; no se puede modificar." };

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
 * Marca un gasto como pagado, opcionalmente vinculando un comprobante (un
 * `documento` ya subido). El comprobante NO es obligatorio; se registra si
 * existe (documento_id != null).
 */
export async function marcarGastoPagado(
  id: string,
  documentoId: string | null
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("gastos")
    .select("liquidacion_id")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Gasto no encontrado." };
  if (actual.liquidacion_id)
    return { error: "El gasto está ligado a una liquidación; no se puede modificar." };

  const patch: { estado: "pagado"; documento_id?: string } = { estado: "pagado" };
  if (documentoId) patch.documento_id = documentoId;

  const { error } = await supabase.from("gastos").update(patch).eq("id", id);
  if (error) return { error: "No se pudo marcar como pagado." };

  await registrarAuditoria(supabase, profile, "gasto_pagado", "gasto", id, {
    comprobante: Boolean(documentoId),
  });

  revalidatePath("/gastos");
  revalidatePath(`/gastos/${id}`);
  return { error: null };
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
  const { data: actual } = await supabase
    .from("gastos")
    .select("liquidacion_id")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Gasto no encontrado." };
  if (actual.liquidacion_id)
    return {
      error: "El gasto ya fue descontado en una liquidación; anúlalo en vez de eliminar.",
    };

  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el gasto." };

  await registrarAuditoria(supabase, profile, "gasto_eliminado", "gasto", id, null);

  revalidatePath("/gastos");
  return { error: null };
}
