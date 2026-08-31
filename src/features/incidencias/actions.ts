"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { insertarObligaciones } from "@/features/gastos/actions";
import type { EstadoIncidencia } from "@/types/database.types";

export type IncidenciaFormState = { error: string | null };
export type AccionResultado = { error: string | null };

const ESTADOS: EstadoIncidencia[] = [
  "reportada",
  "agendada",
  "en_proceso",
  "resuelta",
  "cancelada",
];

function limpiar(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

type Parsed = {
  propiedad_id: string;
  contrato_id: string | null;
  titulo: string;
  descripcion: string | null;
  proveedor_nombre: string | null;
  proveedor_contacto: string | null;
  fecha_reportada: string;
  costo: number;
  observaciones: string | null;
};

/** Valida y normaliza el FormData de la incidencia (frontera de entrada). */
function parseIncidencia(fd: FormData): { data?: Parsed; error?: string } {
  const propiedad_id = limpiar(fd.get("propiedad_id"));
  if (!propiedad_id) return { error: "La propiedad es obligatoria." };

  const titulo = limpiar(fd.get("titulo"));
  if (!titulo) return { error: "El título es obligatorio." };

  const fecha_reportada = limpiar(fd.get("fecha_reportada"));
  if (!fecha_reportada) return { error: "La fecha reportada es obligatoria." };

  const costoRaw = limpiar(fd.get("costo"));
  if (!costoRaw) return { error: "El costo estimado es obligatorio." };
  const costoNum = Number(costoRaw);
  if (!Number.isFinite(costoNum) || costoNum <= 0) {
    return { error: "El costo debe ser mayor a 0." };
  }
  const costo = Math.round(costoNum * 100) / 100;

  return {
    data: {
      propiedad_id,
      contrato_id: limpiar(fd.get("contrato_id")),
      titulo,
      descripcion: limpiar(fd.get("descripcion")),
      proveedor_nombre: limpiar(fd.get("proveedor_nombre")),
      proveedor_contacto: limpiar(fd.get("proveedor_contacto")),
      fecha_reportada,
      costo,
      observaciones: limpiar(fd.get("observaciones")),
    },
  };
}

export async function crearIncidencia(
  _prev: IncidenciaFormState,
  fd: FormData
): Promise<IncidenciaFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const { data, error } = parseIncidencia(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  const supabase = await createClient();
  const { data: incidencia, error: dbError } = await supabase
    .from("incidencias")
    .insert({
      empresa_id: profile.empresa_id,
      ...data,
      creado_por: profile.id,
      creado_por_email: profile.email,
    })
    .select("id")
    .single();

  if (dbError || !incidencia) return { error: "No se pudo registrar la incidencia." };

  await registrarAuditoria(
    supabase,
    profile,
    "incidencia_creada",
    "incidencia",
    incidencia.id,
    { titulo: data.titulo }
  );

  revalidatePath("/incidencias");
  redirect(`/incidencias/${incidencia.id}`);
}

export async function actualizarIncidencia(
  id: string,
  _prev: IncidenciaFormState,
  fd: FormData
): Promise<IncidenciaFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const { data, error } = parseIncidencia(fd);
  if (error || !data) return { error: error ?? "Datos inválidos." };

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("incidencias").update(data).eq("id", id);
  if (dbError) return { error: "No se pudo actualizar la incidencia." };

  await registrarAuditoria(supabase, profile, "incidencia_actualizada", "incidencia", id, null);

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { error: null };
}

export async function cambiarEstadoIncidencia(
  id: string,
  estado: EstadoIncidencia
): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };
  if (!ESTADOS.includes(estado)) return { error: "Estado inválido." };

  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const patch: { estado: EstadoIncidencia; fecha_agendada?: string; fecha_resuelta?: string } = {
    estado,
  };
  if (estado === "agendada") patch.fecha_agendada = hoy;
  if (estado === "resuelta") patch.fecha_resuelta = hoy;

  const { error } = await supabase.from("incidencias").update(patch).eq("id", id);
  if (error) return { error: "No se pudo cambiar el estado." };

  await registrarAuditoria(supabase, profile, "incidencia_estado", "incidencia", id, { estado });

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { error: null };
}

/**
 * Genera un Gasto (categoría "reparación") a partir de una incidencia ya
 * resuelta con costo conocido. Vínculo 1:1 explícito: una vez creado el
 * gasto, el botón que dispara esta acción deja de mostrarse (gasto_id ya no
 * es null), evitando duplicarlo.
 */
export async function generarGastoDeIncidencia(id: string): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: incidencia } = await supabase
    .from("incidencias")
    .select("estado, costo, gasto_id, propiedad_id, contrato_id, titulo")
    .eq("id", id)
    .single();
  if (!incidencia) return { error: "Incidencia no encontrada." };
  if (incidencia.estado !== "resuelta")
    return { error: "Solo se puede generar el gasto si la incidencia está resuelta." };
  if (!incidencia.costo) return { error: "La incidencia no tiene costo registrado." };
  if (incidencia.gasto_id) return { error: "Ya se generó un gasto para esta incidencia." };

  const fecha = new Date().toISOString().slice(0, 10);
  const monto = Number(incidencia.costo);
  const { data: gasto, error: gastoError } = await supabase
    .from("gastos")
    .insert({
      empresa_id: profile.empresa_id,
      propiedad_id: incidencia.propiedad_id,
      contrato_id: incidencia.contrato_id,
      categoria: "reparacion",
      descripcion: incidencia.titulo,
      monto,
      fecha,
      responsable_pago: "propietario",
      creado_por: profile.id,
      creado_por_email: profile.email,
    })
    .select("id")
    .single();
  if (gastoError || !gasto) return { error: "No se pudo generar el gasto." };

  // 100% propietario, pago único: mismo caso simple que usa el wizard de
  // Gastos. Sin esto el gasto quedaría sin obligación/cuota y nunca
  // aparecería como descontable en una liquidación (ver Gastos Fase 2).
  const errorObligaciones = await insertarObligaciones(
    supabase,
    profile.empresa_id,
    gasto.id,
    incidencia.propiedad_id,
    null,
    fecha,
    monto,
    [
      {
        responsable: "propietario",
        tipo_monto: "porcentaje",
        valor: 100,
        cuotas: [{ numero_cuota: 1, monto, fecha_vencimiento: fecha }],
      },
    ]
  );
  if (errorObligaciones) {
    await supabase.from("gastos").delete().eq("id", gasto.id);
    return { error: errorObligaciones };
  }

  const { error: updError } = await supabase
    .from("incidencias")
    .update({ gasto_id: gasto.id })
    .eq("id", id);
  if (updError) return { error: "El gasto se creó, pero no se pudo vincular a la incidencia." };

  await registrarAuditoria(
    supabase,
    profile,
    "incidencia_gasto_generado",
    "incidencia",
    id,
    { gasto_id: gasto.id }
  );

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { error: null };
}

export async function eliminarIncidencia(id: string): Promise<AccionResultado> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("incidencias")
    .select("gasto_id")
    .eq("id", id)
    .single();
  if (!actual) return { error: "Incidencia no encontrada." };
  if (actual.gasto_id)
    return { error: "Esta incidencia ya generó un gasto; no se puede eliminar." };

  const { error } = await supabase.from("incidencias").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la incidencia." };

  await registrarAuditoria(supabase, profile, "incidencia_eliminada", "incidencia", id, null);

  revalidatePath("/incidencias");
  return { error: null };
}
