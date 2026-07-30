"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { parseDecimal } from "@/lib/numero";
import { calcularCanonActualUF } from "@/lib/uf";
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
  return parseDecimal(texto(formData, campo));
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
  // Monto vigente hoy (tras reajustes); si no se edita, sigue al canon original.
  const canon_actual = decimal(formData, "canon_actual") ?? canon_monto;
  // Canon fijo en UF (opcional): habilita el recálculo automático trimestral.
  const canon_uf_base = decimal(formData, "canon_uf_base");

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
      canon_actual,
      canon_uf_base,
      canon_moneda: canon_moneda as Moneda,
      reajuste_tipo,
      periodicidad_reajuste_meses,
      fecha_proximo_reajuste: texto(formData, "fecha_proximo_reajuste"),
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
  redirect("/contratos");
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

function sumarMeses(fecha: Date, meses: number): Date {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + meses);
  return d;
}

function aFechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Aplica el reajuste pendiente: calcula canon_actual = canon_uf_base × UF del
 * corte trimestral vigente (consultando mindicador.cl) y avanza
 * fecha_proximo_reajuste según la periodicidad del contrato. Nunca se aplica
 * solo — siempre a decisión explícita del admin (puede haber un arreglo
 * informal con el arrendatario que difiera del cálculo).
 */
export async function aplicarReajusteUF(
  id: string,
  _prev: ContratoFormState
): Promise<ContratoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: contrato } = await supabase
    .from("contratos")
    .select("reajuste_tipo, canon_uf_base, periodicidad_reajuste_meses, fecha_proximo_reajuste")
    .eq("id", id)
    .single();

  if (!contrato) return { error: "Contrato no encontrado." };
  if (contrato.reajuste_tipo !== "UF" || !contrato.canon_uf_base) {
    return { error: "Este contrato no tiene un canon base en UF configurado." };
  }

  let canon_actual: number;
  try {
    canon_actual = await calcularCanonActualUF(contrato.canon_uf_base, new Date());
  } catch {
    return {
      error: "No se pudo obtener el valor de la UF (mindicador.cl no disponible). Intenta más tarde.",
    };
  }

  // Si "aplicar" se usa para corregir el canon a mitad de trimestre (aún no
  // llega la fecha de revisión), no corresponde adelantar fecha_proximo_reajuste
  // — si no, se saltaría la próxima revisión real. Solo avanza si hoy ya
  // alcanzó o pasó esa fecha.
  const hoyISO = aFechaISO(new Date());
  const yaCorrespondia =
    !contrato.fecha_proximo_reajuste || contrato.fecha_proximo_reajuste <= hoyISO;
  const fecha_proximo_reajuste =
    yaCorrespondia && contrato.periodicidad_reajuste_meses
      ? aFechaISO(
          sumarMeses(
            contrato.fecha_proximo_reajuste ? new Date(contrato.fecha_proximo_reajuste) : new Date(),
            contrato.periodicidad_reajuste_meses
          )
        )
      : contrato.fecha_proximo_reajuste;

  const { error } = await supabase
    .from("contratos")
    .update({ canon_actual, fecha_proximo_reajuste })
    .eq("id", id);

  if (error) return { error: "No se pudo guardar el canon recalculado." };

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/cobros");
  return { error: null };
}

/**
 * Posterga el reajuste N meses sin tocar el canon — para cuando hay un
 * arreglo informal con el arrendatario que difiere lo calculado.
 */
export async function postergarReajuste(
  id: string,
  meses: number,
  _prev: ContratoFormState
): Promise<ContratoFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  if (!Number.isFinite(meses) || meses <= 0) {
    return { error: "Indica cuántos meses postergar (mayor a 0)." };
  }

  const supabase = await createClient();
  const { data: contrato } = await supabase
    .from("contratos")
    .select("fecha_proximo_reajuste")
    .eq("id", id)
    .single();

  if (!contrato) return { error: "Contrato no encontrado." };

  const base = contrato.fecha_proximo_reajuste
    ? new Date(contrato.fecha_proximo_reajuste)
    : new Date();
  const fecha_proximo_reajuste = aFechaISO(sumarMeses(base, meses));

  const { error } = await supabase
    .from("contratos")
    .update({ fecha_proximo_reajuste })
    .eq("id", id);

  if (error) return { error: "No se pudo postergar el reajuste." };

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/cobros");
  return { error: null };
}

export async function cambiarActivoContrato(id: string, activo: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("contratos").update({ activo }).eq("id", id);
  revalidatePath("/contratos");
}

/**
 * Elimina el contrato. `cargos.contrato_id` es `on delete restrict`, así
 * que la base de datos ya bloquea el borrado si tiene cargos — aquí se
 * traduce ese rechazo a un mensaje legible. `contratos_arrendatarios` es
 * `cascade` (no bloquea); `documentos`/`gastos` son `set null` (no bloquean).
 */
export async function eliminarContrato(id: string): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.message.includes("foreign key") || error.message.includes("violates")) {
      return {
        error: "No se puede eliminar: el contrato tiene cargos (cobros) asociados.",
      };
    }
    return { error: "No se pudo eliminar el contrato." };
  }
  if (!data || data.length === 0) {
    return { error: "No se pudo eliminar el contrato (sin permisos o ya no existe)." };
  }

  revalidatePath("/contratos");
  return { error: null };
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
