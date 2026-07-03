import { createClient } from "@/lib/supabase/server";
import type { Gasto, GastoListado, FiltrosGastos } from "./types";

type PersonaEmbed = {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
} | null;

function nombrePersona(p: PersonaEmbed): string | null {
  if (!p) return null;
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? null;
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || null;
}

function limpiarBusqueda(q: string): string {
  return q.replace(/[,()*]/g, " ").trim();
}

const SELECT_RELACIONES = `*,
  propiedades(codigo_interno, direccion),
  propietarios(tipo_persona, nombre, apellido, razon_social),
  arrendatarios(tipo_persona, nombre, apellido, razon_social),
  contratos(numero_contrato)`;

type Row = Gasto & {
  propiedades: { codigo_interno: string | null; direccion: string | null } | null;
  propietarios: PersonaEmbed;
  arrendatarios: PersonaEmbed;
  contratos: { numero_contrato: string | null } | null;
};

function mapear(d: Row): GastoListado {
  const prop = d.propiedades;
  return {
    ...d,
    propiedad_label: prop ? prop.codigo_interno ?? prop.direccion ?? null : null,
    propietario_nombre: nombrePersona(d.propietarios),
    arrendatario_nombre: nombrePersona(d.arrendatarios),
    contrato_numero: d.contratos?.numero_contrato ?? null,
  };
}

export async function listGastos(
  filtros: FiltrosGastos = {}
): Promise<GastoListado[]> {
  const supabase = await createClient();
  let q = supabase
    .from("gastos")
    .select(SELECT_RELACIONES)
    .order("fecha", { ascending: false });

  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.estado) q = q.eq("estado", filtros.estado);
  if (filtros.responsable) q = q.eq("responsable_pago", filtros.responsable);
  if (filtros.propiedadId) q = q.eq("propiedad_id", filtros.propiedadId);
  if (filtros.contratoId) q = q.eq("contrato_id", filtros.contratoId);
  if (filtros.propietarioId) q = q.eq("propietario_id", filtros.propietarioId);
  if (filtros.desde) q = q.gte("fecha", filtros.desde);
  if (filtros.hasta) q = q.lte("fecha", filtros.hasta);

  const busqueda = filtros.q ? limpiarBusqueda(filtros.q) : "";
  if (busqueda) q = q.ilike("descripcion", `%${busqueda}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(mapear);
}

export async function getGasto(id: string): Promise<GastoListado | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gastos")
    .select(SELECT_RELACIONES)
    .eq("id", id)
    .single();
  if (!data) return null;
  return mapear(data as unknown as Row);
}
