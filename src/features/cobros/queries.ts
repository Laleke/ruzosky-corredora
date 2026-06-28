import { createClient } from "@/lib/supabase/server";
import type { Cargo, CargoConContexto, Pago } from "./types";

export async function listCargos(): Promise<CargoConContexto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cargos")
    .select("*, contratos(numero_contrato, propiedades(direccion))")
    .order("periodo", { ascending: false });

  if (error) throw new Error(error.message);

  type Row = Cargo & {
    contratos: {
      numero_contrato: string | null;
      propiedades: { direccion: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    numero_contrato: c.contratos?.numero_contrato ?? null,
    propiedad_direccion: c.contratos?.propiedades?.direccion ?? "—",
  }));
}

export async function getCargo(id: string): Promise<CargoConContexto | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cargos")
    .select("*, contratos(numero_contrato, propiedades(direccion))")
    .eq("id", id)
    .single();

  if (!data) return null;

  type Row = Cargo & {
    contratos: {
      numero_contrato: string | null;
      propiedades: { direccion: string } | null;
    } | null;
  };
  const c = data as unknown as Row;
  return {
    ...c,
    numero_contrato: c.contratos?.numero_contrato ?? null,
    propiedad_direccion: c.contratos?.propiedades?.direccion ?? "—",
  };
}

export async function getPagosDeCargo(cargoId: string): Promise<Pago[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("cargo_id", cargoId)
    .order("fecha_pago", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
