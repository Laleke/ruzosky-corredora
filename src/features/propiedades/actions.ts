"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { PropiedadInsert } from "./types";
import type {
  Database,
  TipoPropiedad,
  EstadoPropiedad,
  Moneda,
} from "@/types/database.types";

export type PropiedadFormState = { error: string | null };

type DB = SupabaseClient<Database>;

const TIPOS: TipoPropiedad[] = [
  "departamento", "casa", "oficina", "local_comercial",
  "bodega", "estacionamiento", "terreno", "otro",
];
const ESTADOS: EstadoPropiedad[] = [
  "disponible", "reservada", "arrendada", "mantencion", "inactiva",
];
const MONEDAS: Moneda[] = ["CLP", "UF"];

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

/** Iniciales de comuna: primeras letras de las 2 palabras significativas, o 2 letras. */
function inicialesComuna(comuna: string): string {
  const stop = ["de", "del", "la", "las", "los", "el", "y"];
  const palabras = comuna
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !stop.includes(w.toLowerCase()));

  if (palabras.length >= 2) {
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }
  const w = palabras[0] ?? "XX";
  return (w.slice(0, 2) || "XX").toUpperCase().padEnd(2, "X");
}

const INICIAL_TIPO: Record<TipoPropiedad, string> = {
  departamento: "D",
  casa: "C",
  oficina: "O",
  local_comercial: "L",
  bodega: "B",
  estacionamiento: "E",
  terreno: "T",
  otro: "X",
};

/**
 * Genera un código interno único: [2 iniciales comuna][inicial tipo][correlativo].
 * El correlativo es por prefijo dentro de la empresa.
 */
async function generarCodigoInterno(
  supabase: DB,
  empresaId: string,
  comuna: string,
  tipo: TipoPropiedad
): Promise<string> {
  const prefijo = inicialesComuna(comuna) + INICIAL_TIPO[tipo];

  const { data } = await supabase
    .from("propiedades")
    .select("codigo_interno")
    .eq("empresa_id", empresaId)
    .like("codigo_interno", `${prefijo}%`);

  const usados = new Set((data ?? []).map((r) => r.codigo_interno));
  let n = usados.size + 1;
  while (usados.has(`${prefijo}${String(n).padStart(4, "0")}`)) n++;
  return `${prefijo}${String(n).padStart(4, "0")}`;
}

function parse(
  formData: FormData
): { data: Omit<PropiedadInsert, "empresa_id" | "codigo_interno"> } | { error: string } {
  const region = texto(formData, "region");
  if (!region) return { error: "La región es obligatoria." };
  const comuna = texto(formData, "comuna");
  if (!comuna) return { error: "La comuna es obligatoria." };

  const tipoRaw = String(formData.get("tipo") ?? "");
  const tipo = (TIPOS as string[]).includes(tipoRaw)
    ? (tipoRaw as TipoPropiedad)
    : "departamento";

  const estadoRaw = String(formData.get("estado") ?? "");
  const estado = (ESTADOS as string[]).includes(estadoRaw)
    ? (estadoRaw as EstadoPropiedad)
    : "disponible";

  const monedaRaw = String(formData.get("moneda") ?? "");
  const moneda = (MONEDAS as string[]).includes(monedaRaw)
    ? (monedaRaw as Moneda)
    : "CLP";

  return {
    data: {
      tipo,
      direccion: texto(formData, "direccion"),
      numero: texto(formData, "numero"),
      departamento: texto(formData, "departamento"),
      comuna: texto(formData, "comuna"),
      region: texto(formData, "region"),
      rol_sii: texto(formData, "rol_sii"),
      dormitorios: entero(formData, "dormitorios"),
      banos: entero(formData, "banos"),
      superficie_util_m2: decimal(formData, "superficie_util_m2"),
      superficie_total_m2: decimal(formData, "superficie_total_m2"),
      estacionamientos: entero(formData, "estacionamientos"),
      bodegas: entero(formData, "bodegas"),
      estado,
      moneda,
      valor_referencial_arriendo: decimal(formData, "valor_referencial_arriendo"),
      gasto_comun_estimado: decimal(formData, "gasto_comun_estimado"),
      fecha_adquisicion: texto(formData, "fecha_adquisicion"),
      observaciones: texto(formData, "observaciones"),
      publicada: formData.get("publicada") === "on",
    },
  };
}

function traducirError(message: string): string {
  if (message.includes("duplicate") || message.includes("unique")) {
    return "Ya existe una propiedad con ese código interno en la empresa.";
  }
  return "No se pudo guardar la propiedad.";
}

export async function crearPropiedad(
  _prev: PropiedadFormState,
  formData: FormData
): Promise<PropiedadFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const comuna = parsed.data.comuna;
  if (!comuna) {
    return { error: "La comuna es obligatoria (se usa para generar el código interno)." };
  }

  const supabase = await createClient();

  // Genera código e inserta, reintentando ante colisión de unicidad.
  for (let intento = 0; intento < 5; intento++) {
    const codigo_interno = await generarCodigoInterno(
      supabase,
      profile.empresa_id,
      comuna,
      parsed.data.tipo ?? "departamento"
    );
    const { error } = await supabase
      .from("propiedades")
      .insert({ ...parsed.data, empresa_id: profile.empresa_id, codigo_interno });

    if (!error) {
      revalidatePath("/propiedades");
      redirect("/propiedades");
    }
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
      return { error: traducirError(error.message) };
    }
  }
  return { error: "No se pudo generar un código interno único. Reintenta." };
}

export async function actualizarPropiedad(
  id: string,
  _prev: PropiedadFormState,
  formData: FormData
): Promise<PropiedadFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("propiedades")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/propiedades");
  redirect("/propiedades");
}

export async function cambiarActivoPropiedad(id: string, activo: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("propiedades").update({ activo }).eq("id", id);
  revalidatePath("/propiedades");
}

/** Asigna un propietario a la propiedad validando que la suma de % no exceda 100. */
export async function asignarPropietario(
  propiedadId: string,
  _prev: PropiedadFormState,
  formData: FormData
): Promise<PropiedadFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const propietarioId = String(formData.get("propietario_id") ?? "");
  if (!propietarioId) return { error: "Selecciona un propietario." };

  const porcentaje = Number(
    String(formData.get("porcentaje_participacion") ?? "100").replace(",", ".")
  );
  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    return { error: "El porcentaje debe estar entre 0 y 100." };
  }

  const supabase = await createClient();

  // Validar que la suma total no supere 100%.
  const { data: existentes } = await supabase
    .from("propietarios_propiedades")
    .select("porcentaje_participacion")
    .eq("propiedad_id", propiedadId);

  const sumaActual = (existentes ?? []).reduce(
    (acc, r) => acc + Number(r.porcentaje_participacion),
    0
  );
  if (sumaActual + porcentaje > 100) {
    return {
      error: `La suma de participaciones superaría 100% (actual: ${sumaActual}%).`,
    };
  }

  const { error } = await supabase.from("propietarios_propiedades").insert({
    empresa_id: profile.empresa_id,
    propiedad_id: propiedadId,
    propietario_id: propietarioId,
    porcentaje_participacion: porcentaje,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      return { error: "Ese propietario ya está asignado a la propiedad." };
    }
    return { error: "No se pudo asignar el propietario." };
  }

  revalidatePath(`/propiedades/${propiedadId}`);
  return { error: null };
}

export async function actualizarParticipacion(
  vinculoId: string,
  propiedadId: string,
  porcentaje: number
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    return { error: "El porcentaje debe estar entre 0 y 100." };
  }

  const supabase = await createClient();

  // La suma de las OTRAS participaciones + la nueva no puede superar 100%.
  const { data: otras } = await supabase
    .from("propietarios_propiedades")
    .select("porcentaje_participacion")
    .eq("propiedad_id", propiedadId)
    .neq("id", vinculoId);

  const suma = (otras ?? []).reduce(
    (acc, r) => acc + Number(r.porcentaje_participacion),
    0
  );
  if (suma + porcentaje > 100) {
    return {
      error: `La suma de participaciones superaría 100% (otras: ${suma}%).`,
    };
  }

  const { error } = await supabase
    .from("propietarios_propiedades")
    .update({ porcentaje_participacion: porcentaje })
    .eq("id", vinculoId);

  if (error) return { error: "No se pudo actualizar la participación." };

  revalidatePath(`/propiedades/${propiedadId}`);
  return { error: null };
}

export async function quitarPropietario(vinculoId: string, propiedadId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase
    .from("propietarios_propiedades")
    .delete()
    .eq("id", vinculoId);

  revalidatePath(`/propiedades/${propiedadId}`);
}
