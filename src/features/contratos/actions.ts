"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { ContratoInsert } from "./types";
import type {
  Database,
  Moneda,
  ReajusteTipo,
  TipoComision,
  EstadoContrato,
} from "@/types/database.types";

export type ContratoFormState = { error: string | null };

type DB = SupabaseClient<Database>;

const REAJUSTES: ReajusteTipo[] = ["sin_reajuste", "IPC", "UF"];
const ESTADOS: EstadoContrato[] = [
  "borrador", "vigente", "vencido", "terminado", "renovado",
];

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function entero(formData: FormData, campo: string): number | null {
  const v = texto(formData, campo);
  if (v === null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function decimal(formData: FormData, campo: string): number | null {
  const v = texto(formData, campo);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** ¿Existe otro contrato activo (vigente/renovado) en la propiedad? */
async function existeContratoActivo(
  supabase: DB,
  propiedadId: string,
  exceptId: string | null
): Promise<boolean> {
  let q = supabase
    .from("contratos")
    .select("id")
    .eq("propiedad_id", propiedadId)
    .in("estado", ["vigente", "renovado"]);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Sincroniza propiedades.estado según el estado del contrato.
 * El contrato es la fuente de verdad. No atómico (dos escrituras).
 */
async function sincronizarPropiedad(
  supabase: DB,
  propiedadId: string,
  estadoContrato: EstadoContrato,
  contratoId: string | null
): Promise<void> {
  if (estadoContrato === "vigente" || estadoContrato === "renovado") {
    await supabase
      .from("propiedades")
      .update({ estado: "arrendada" })
      .eq("id", propiedadId);
  } else if (estadoContrato === "terminado") {
    // Solo liberar si no queda otro contrato activo en la propiedad.
    const otro = await existeContratoActivo(supabase, propiedadId, contratoId);
    if (!otro) {
      await supabase
        .from("propiedades")
        .update({ estado: "disponible" })
        .eq("id", propiedadId);
    }
  }
  // 'vencido' y 'borrador': no tocan la propiedad.
}

/** Número de contrato correlativo por empresa (4 dígitos), con reintento. */
async function generarNumeroContrato(
  supabase: DB,
  empresaId: string
): Promise<string> {
  const { count } = await supabase
    .from("contratos")
    .select("*", { count: "exact", head: true })
    .eq("empresa_id", empresaId);

  const { data } = await supabase
    .from("contratos")
    .select("numero_contrato")
    .eq("empresa_id", empresaId);
  const usados = new Set((data ?? []).map((r) => r.numero_contrato));

  let n = (count ?? 0) + 1;
  while (usados.has(String(n).padStart(4, "0"))) n++;
  return String(n).padStart(4, "0");
}

function parse(
  formData: FormData
):
  | {
      data: Omit<ContratoInsert, "empresa_id" | "numero_contrato">;
      estado: EstadoContrato;
    }
  | { error: string } {
  const propiedad_id = texto(formData, "propiedad_id");
  if (!propiedad_id) return { error: "Selecciona una propiedad." };

  const fecha_inicio = texto(formData, "fecha_inicio");
  if (!fecha_inicio) return { error: "La fecha de inicio es obligatoria." };

  const canon_monto = decimal(formData, "canon_monto");
  if (canon_monto === null || canon_monto <= 0) {
    return { error: "El canon debe ser mayor a 0." };
  }

  const canon_moneda =
    String(formData.get("canon_moneda") ?? "CLP") === "UF" ? "UF" : "CLP";

  const reajusteRaw = String(formData.get("reajuste_tipo") ?? "sin_reajuste");
  const reajuste_tipo = (REAJUSTES as string[]).includes(reajusteRaw)
    ? (reajusteRaw as ReajusteTipo)
    : "sin_reajuste";

  const periodicidad_reajuste_meses = entero(
    formData,
    "periodicidad_reajuste_meses"
  );
  if (
    reajuste_tipo !== "sin_reajuste" &&
    (periodicidad_reajuste_meses === null || periodicidad_reajuste_meses <= 0)
  ) {
    return {
      error: "Indica la periodicidad de reajuste (en meses) mayor a 0.",
    };
  }

  const tipoComisionRaw = texto(formData, "tipo_comision");
  const tipo_comision =
    tipoComisionRaw === "porcentaje" || tipoComisionRaw === "monto_fijo"
      ? (tipoComisionRaw as TipoComision)
      : null;
  const comision_monto = decimal(formData, "comision_monto");
  if (tipo_comision && comision_monto === null) {
    return { error: "Indica el valor de la comisión." };
  }

  const cobra_administracion = formData.get("cobra_administracion") === "on";
  const administracion_monto = decimal(formData, "administracion_monto");
  const administracion_porcentaje = decimal(
    formData,
    "administracion_porcentaje"
  );
  if (
    cobra_administracion &&
    administracion_monto === null &&
    administracion_porcentaje === null
  ) {
    return {
      error: "Si cobra administración, indica monto o porcentaje.",
    };
  }

  const estadoRaw = String(formData.get("estado") ?? "borrador");
  const estado = (ESTADOS as string[]).includes(estadoRaw)
    ? (estadoRaw as EstadoContrato)
    : "borrador";

  return {
    data: {
      propiedad_id,
      fecha_firma: texto(formData, "fecha_firma"),
      fecha_inicio,
      fecha_termino: texto(formData, "fecha_termino"),
      canon_monto,
      canon_moneda: canon_moneda as Moneda,
      reajuste_tipo,
      periodicidad_reajuste_meses,
      tipo_comision,
      comision_monto,
      cobra_administracion,
      administracion_monto,
      administracion_porcentaje,
      estado,
      observaciones: texto(formData, "observaciones"),
    },
    estado,
  };
}

function traducirError(message: string): string {
  if (message.includes("duplicate") || message.includes("unique")) {
    return "Ya existe un contrato con ese número en la empresa.";
  }
  return "No se pudo guardar el contrato.";
}

export async function crearContrato(
  _prev: ContratoFormState,
  formData: FormData
): Promise<ContratoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();

  // Restricción: no dejar vigente una propiedad que ya tiene contrato activo.
  if (parsed.estado === "vigente") {
    if (await existeContratoActivo(supabase, parsed.data.propiedad_id, null)) {
      return { error: "La propiedad ya tiene un contrato activo." };
    }
  }

  const numero_contrato = await generarNumeroContrato(
    supabase,
    profile.empresa_id
  );

  const { data, error } = await supabase
    .from("contratos")
    .insert({ ...parsed.data, empresa_id: profile.empresa_id, numero_contrato })
    .select("id")
    .single();

  if (error || !data) return { error: traducirError(error?.message ?? "") };

  await sincronizarPropiedad(
    supabase,
    parsed.data.propiedad_id,
    parsed.estado,
    data.id
  );

  revalidatePath("/contratos");
  revalidatePath("/propiedades");
  redirect(`/contratos/${data.id}`);
}

export async function actualizarContrato(
  id: string,
  _prev: ContratoFormState,
  formData: FormData
): Promise<ContratoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();

  if (parsed.estado === "vigente") {
    if (await existeContratoActivo(supabase, parsed.data.propiedad_id, id)) {
      return { error: "La propiedad ya tiene otro contrato activo." };
    }
  }

  const { error } = await supabase
    .from("contratos")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: traducirError(error.message) };

  await sincronizarPropiedad(
    supabase,
    parsed.data.propiedad_id,
    parsed.estado,
    id
  );

  revalidatePath("/contratos");
  revalidatePath("/propiedades");
  redirect("/contratos");
}

export async function cambiarActivoContrato(id: string, activo: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("contratos").update({ activo }).eq("id", id);
  revalidatePath("/contratos");
}

export async function asignarArrendatario(
  contratoId: string,
  _prev: ContratoFormState,
  formData: FormData
): Promise<ContratoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const arrendatarioId = String(formData.get("arrendatario_id") ?? "");
  if (!arrendatarioId) return { error: "Selecciona un arrendatario." };

  const supabase = await createClient();
  const { error } = await supabase.from("contratos_arrendatarios").insert({
    empresa_id: profile.empresa_id,
    contrato_id: contratoId,
    arrendatario_id: arrendatarioId,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { error: "Ese arrendatario ya está en el contrato." };
    }
    return { error: "No se pudo asignar el arrendatario." };
  }

  revalidatePath(`/contratos/${contratoId}`);
  return { error: null };
}

export async function quitarArrendatario(vinculoId: string, contratoId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("contratos_arrendatarios").delete().eq("id", vinculoId);
  revalidatePath(`/contratos/${contratoId}`);
}
