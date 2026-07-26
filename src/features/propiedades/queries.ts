import { createClient } from "@/lib/supabase/server";
import type { Propiedad, PropietarioAsignado } from "./types";
import type { TipoPropiedad, EstadoPropiedad } from "@/types/database.types";

export type FiltrosPropiedades = {
  tipo?: string;
  comuna?: string;
  estado?: string;
  activo?: string; // "true" | "false" | undefined (todos)
};

export async function listPropiedades(
  filtros: FiltrosPropiedades = {}
): Promise<Propiedad[]> {
  const supabase = await createClient();
  let query = supabase.from("propiedades").select("*");

  if (filtros.tipo) query = query.eq("tipo", filtros.tipo as TipoPropiedad);
  if (filtros.comuna) query = query.eq("comuna", filtros.comuna);
  if (filtros.estado) query = query.eq("estado", filtros.estado as EstadoPropiedad);
  if (filtros.activo === "true") query = query.eq("activo", true);
  if (filtros.activo === "false") query = query.eq("activo", false);

  // Orden alfabético por dirección (el dato principal para reconocer la propiedad).
  const { data, error } = await query.order("direccion", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Comunas realmente presentes en propiedades, para poblar el filtro. */
export async function getComunasPropiedades(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("propiedades").select("comuna");
  const comunas = new Set<string>();
  for (const row of data ?? []) {
    if (row.comuna) comunas.add(row.comuna);
  }
  return [...comunas].sort((a, b) => a.localeCompare(b, "es"));
}

export async function getPropiedad(id: string): Promise<Propiedad | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("propiedades")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

/** Propietarios asignados a una propiedad vía tabla puente. */
export async function getPropietariosAsignados(
  propiedadId: string
): Promise<PropietarioAsignado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propietarios_propiedades")
    .select(
      "id, porcentaje_participacion, propietario_id, propietarios(rut, nombre, apellido, razon_social, tipo_persona)"
    )
    .eq("propiedad_id", propiedadId);

  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    porcentaje_participacion: number;
    propietario_id: string;
    propietarios: {
      rut: string;
      nombre: string | null;
      apellido: string | null;
      razon_social: string | null;
      tipo_persona: string;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => {
    const p = r.propietarios;
    const nombre =
      p?.tipo_persona === "persona_juridica"
        ? p?.razon_social ?? "—"
        : [p?.nombre, p?.apellido].filter(Boolean).join(" ") || "—";
    return {
      vinculo_id: r.id,
      propietario_id: r.propietario_id,
      porcentaje_participacion: r.porcentaje_participacion,
      nombre,
      rut: p?.rut ?? "—",
    };
  });
}
