import { createClient } from "@/lib/supabase/server";
import type { Propiedad, PropietarioAsignado } from "./types";

export async function listPropiedades(): Promise<Propiedad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
