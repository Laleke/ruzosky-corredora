import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import type { Incidencia, IncidenciaListado, FiltrosIncidencias } from "./types";

const SELECT_RELACIONES = `*,
  propiedades(codigo_interno, direccion, numero, departamento)`;

type Row = Incidencia & {
  propiedades: {
    codigo_interno: string | null;
    direccion: string | null;
    numero: string | null;
    departamento: string | null;
  } | null;
};

function mapear(d: Row): IncidenciaListado {
  return {
    ...d,
    propiedad_label: d.propiedades ? etiquetaPropiedad(d.propiedades) : null,
  };
}

export async function listIncidencias(
  filtros: FiltrosIncidencias = {}
): Promise<IncidenciaListado[]> {
  const supabase = await createClient();
  let q = supabase
    .from("incidencias")
    .select(SELECT_RELACIONES)
    .order("fecha_reportada", { ascending: false });

  if (filtros.propiedadId) q = q.eq("propiedad_id", filtros.propiedadId);
  if (filtros.estado) q = q.eq("estado", filtros.estado);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(mapear);
}

export async function getIncidencia(id: string): Promise<IncidenciaListado | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidencias")
    .select(SELECT_RELACIONES)
    .eq("id", id)
    .single();
  if (!data) return null;
  return mapear(data as unknown as Row);
}
