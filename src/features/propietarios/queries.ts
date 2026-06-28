import { createClient } from "@/lib/supabase/server";
import type { Propietario } from "./types";

/**
 * Lecturas de propietarios. RLS ya limita al tenant y al rol admin,
 * por eso no se filtra empresa_id manualmente.
 */
export async function listPropietarios(): Promise<Propietario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propietarios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
