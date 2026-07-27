import { createClient } from "@/lib/supabase/server";
import type { Propietario } from "./types";

export type FiltrosPropietarios = {
  comuna?: string;
  region?: string;
  activo?: string; // "true" | "false" | undefined (todos)
};

/**
 * Lecturas de propietarios. RLS ya limita al tenant y al rol admin,
 * por eso no se filtra empresa_id manualmente.
 */
export async function listPropietarios(
  filtros: FiltrosPropietarios = {}
): Promise<Propietario[]> {
  const supabase = await createClient();
  let query = supabase.from("propietarios").select("*");

  if (filtros.comuna) query = query.eq("comuna", filtros.comuna);
  if (filtros.region) query = query.eq("region", filtros.region);
  if (filtros.activo === "true") query = query.eq("activo", true);
  if (filtros.activo === "false") query = query.eq("activo", false);

  // Orden alfabético (aproximado: prioriza nombre; persona jurídica sin
  // nombre queda ordenada por razón social).
  const { data, error } = await query
    .order("nombre", { ascending: true, nullsFirst: false })
    .order("razon_social", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Comunas y regiones actualmente presentes en propietarios, para poblar los filtros. */
export async function getOpcionesFiltroPropietarios(): Promise<{
  comunas: string[];
  regiones: string[];
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("propietarios")
    .select("comuna, region");

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

export async function getPropietario(id: string): Promise<Propietario | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("propietarios")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

/** Indica si el propietario tiene liquidaciones (bloquea la eliminación: FK restrict). */
export async function tieneLiquidacionesVinculadas(
  propietarioId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("liquidaciones")
    .select("id", { count: "exact", head: true })
    .eq("propietario_id", propietarioId);
  return (count ?? 0) > 0;
}
