import { createClient } from "@/lib/supabase/server";
import type {
  Contrato,
  ContratoConPropiedad,
  ArrendatarioVinculado,
} from "./types";

export async function listContratos(): Promise<ContratoConPropiedad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos")
    .select("*, propiedades(codigo_interno, direccion)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  type Row = Contrato & {
    propiedades: { codigo_interno: string | null; direccion: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    propiedad_direccion: c.propiedades?.direccion ?? "—",
    propiedad_codigo: c.propiedades?.codigo_interno ?? null,
  }));
}

export async function getContrato(id: string): Promise<Contrato | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contratos")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function getArrendatariosDeContrato(
  contratoId: string
): Promise<ArrendatarioVinculado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos_arrendatarios")
    .select(
      "id, arrendatario_id, arrendatarios(rut, nombre, apellido, razon_social, tipo_persona)"
    )
    .eq("contrato_id", contratoId);

  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    arrendatario_id: string;
    arrendatarios: {
      rut: string;
      nombre: string | null;
      apellido: string | null;
      razon_social: string | null;
      tipo_persona: string;
    } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => {
    const a = r.arrendatarios;
    const nombre =
      a?.tipo_persona === "persona_juridica"
        ? a?.razon_social ?? "—"
        : [a?.nombre, a?.apellido].filter(Boolean).join(" ") || "—";
    return {
      vinculo_id: r.id,
      arrendatario_id: r.arrendatario_id,
      nombre,
      rut: a?.rut ?? "—",
    };
  });
}
