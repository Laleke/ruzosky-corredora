import { createClient } from "@/lib/supabase/server";
import type { Arrendatario } from "./types";

export async function listArrendatarios(): Promise<Arrendatario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("arrendatarios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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
