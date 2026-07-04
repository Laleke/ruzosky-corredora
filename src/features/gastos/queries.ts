import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
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
  propiedades(codigo_interno, direccion, numero, departamento),
  propietarios(tipo_persona, nombre, apellido, razon_social),
  arrendatarios(tipo_persona, nombre, apellido, razon_social),
  contratos(numero_contrato)`;

type Row = Gasto & {
  propiedades: {
    codigo_interno: string | null;
    direccion: string | null;
    numero: string | null;
    departamento: string | null;
  } | null;
  propietarios: PersonaEmbed;
  arrendatarios: PersonaEmbed;
  contratos: { numero_contrato: string | null } | null;
};

function mapear(d: Row): GastoListado {
  const prop = d.propiedades;
  return {
    ...d,
    propiedad_label: prop ? etiquetaPropiedad(prop) : null,
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

/**
 * Mapa propiedad_id → arrendatarios vinculados (vía contratos activos).
 * Permite filtrar el selector de arrendatario según la propiedad elegida.
 */
export async function getArrendatariosPorPropiedad(): Promise<
  Record<string, { id: string; label: string }[]>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contratos")
    .select(
      "propiedad_id, contratos_arrendatarios(arrendatarios(id, tipo_persona, nombre, apellido, razon_social))"
    )
    .eq("activo", true);

  type Row = {
    propiedad_id: string;
    contratos_arrendatarios: {
      arrendatarios: PersonaEmbed & { id: string } | null;
    }[];
  };

  const mapa: Record<string, { id: string; label: string }[]> = {};
  const vistos: Record<string, Set<string>> = {};
  for (const c of (data ?? []) as unknown as Row[]) {
    for (const ca of c.contratos_arrendatarios ?? []) {
      const a = ca.arrendatarios;
      if (!a) continue;
      mapa[c.propiedad_id] ??= [];
      vistos[c.propiedad_id] ??= new Set();
      if (vistos[c.propiedad_id].has(a.id)) continue;
      vistos[c.propiedad_id].add(a.id);
      mapa[c.propiedad_id].push({ id: a.id, label: nombrePersona(a) ?? "—" });
    }
  }
  return mapa;
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
