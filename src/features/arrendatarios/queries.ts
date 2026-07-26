import { createClient } from "@/lib/supabase/server";
import type { Arrendatario } from "./types";

export type FiltrosArrendatarios = {
  tipoPersona?: string;
  comuna?: string;
  region?: string;
  activo?: string; // "true" | "false" | undefined (todos)
};

export async function listArrendatarios(
  filtros: FiltrosArrendatarios = {}
): Promise<Arrendatario[]> {
  const supabase = await createClient();
  let query = supabase.from("arrendatarios").select("*");

  if (filtros.tipoPersona) {
    query = query.eq(
      "tipo_persona",
      filtros.tipoPersona as Arrendatario["tipo_persona"]
    );
  }
  if (filtros.comuna) query = query.eq("comuna", filtros.comuna);
  if (filtros.region) query = query.eq("region", filtros.region);
  if (filtros.activo === "true") query = query.eq("activo", true);
  if (filtros.activo === "false") query = query.eq("activo", false);

  // Orden alfabético (aproximado: prioriza nombre; persona jurídica sin
  // nombre queda al final del bloque de naturales, orden estable por razón social).
  const { data, error } = await query
    .order("nombre", { ascending: true, nullsFirst: false })
    .order("razon_social", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Comunas y regiones realmente presentes, para poblar los filtros. */
export async function getOpcionesFiltroArrendatarios(): Promise<{
  comunas: string[];
  regiones: string[];
}> {
  const supabase = await createClient();
  const { data } = await supabase.from("arrendatarios").select("comuna, region");
  const comunas = new Set<string>();
  const regiones = new Set<string>();
  for (const row of data ?? []) {
    if (row.comuna) comunas.add(row.comuna);
    if (row.region) regiones.add(row.region);
  }
  return {
    comunas: [...comunas].sort((a, b) => a.localeCompare(b, "es")),
    regiones: [...regiones].sort((a, b) => a.localeCompare(b, "es")),
  };
}

export async function getArrendatario(
  id: string
): Promise<Arrendatario | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("arrendatarios")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

/** Indica si el arrendatario tiene contratos vinculados (bloquea la eliminación). */
export async function tieneContratosVinculados(
  arrendatarioId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("contratos_arrendatarios")
    .select("id", { count: "exact", head: true })
    .eq("arrendatario_id", arrendatarioId);
  return (count ?? 0) > 0;
}
