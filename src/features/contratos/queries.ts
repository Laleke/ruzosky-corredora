import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import type {
  Contrato,
  ContratoConPropiedad,
  ArrendatarioVinculado,
} from "./types";
import type { EstadoContrato } from "@/types/database.types";

export type FiltrosContratos = {
  estado?: string;
  activo?: string; // "true" | "false" | undefined (todos)
};

type ArrendatarioResumen = {
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
  tipo_persona: string;
};

function nombreArrendatario(a: ArrendatarioResumen | null): string {
  if (!a) return "—";
  return a.tipo_persona === "persona_juridica"
    ? a.razon_social ?? "—"
    : [a.nombre, a.apellido].filter(Boolean).join(" ") || "—";
}

export async function listContratos(
  filtros: FiltrosContratos = {}
): Promise<ContratoConPropiedad[]> {
  const supabase = await createClient();
  let query = supabase
    .from("contratos")
    .select(
      "*, propiedades(codigo_interno, direccion, numero, departamento), contratos_arrendatarios(arrendatarios(nombre, apellido, razon_social, tipo_persona))"
    );

  if (filtros.estado) query = query.eq("estado", filtros.estado as EstadoContrato);
  if (filtros.activo === "true") query = query.eq("activo", true);
  if (filtros.activo === "false") query = query.eq("activo", false);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  type Row = Contrato & {
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
    contratos_arrendatarios: { arrendatarios: ArrendatarioResumen | null }[];
  };

  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    propiedad_direccion: c.propiedades?.direccion ?? "—",
    propiedad_label: etiquetaPropiedad(c.propiedades),
    arrendatarios_nombres: c.contratos_arrendatarios.map((v) =>
      nombreArrendatario(v.arrendatarios)
    ),
  }));
}

/**
 * Indica si el contrato tiene cargos asociados — en ese caso no se puede
 * eliminar (la base de datos lo impediría igual vía `on delete restrict`
 * en `cargos.contrato_id`, pero esto permite avisarlo ANTES de que el
 * usuario intente borrar). `contratos_arrendatarios` es `cascade` y
 * `documentos`/`gastos` son `set null` — ninguno de esos bloquea.
 */
export async function tieneRelacionesBloqueantes(
  contratoId: string
): Promise<{ bloqueada: boolean; motivo: string | null }> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cargos")
    .select("id", { count: "exact", head: true })
    .eq("contrato_id", contratoId);

  if ((count ?? 0) > 0) {
    return { bloqueada: true, motivo: "tiene cargos (cobros) asociados." };
  }
  return { bloqueada: false, motivo: null };
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
    arrendatarios: (ArrendatarioResumen & { rut: string }) | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    vinculo_id: r.id,
    arrendatario_id: r.arrendatario_id,
    nombre: nombreArrendatario(r.arrendatarios),
    rut: r.arrendatarios?.rut ?? "—",
  }));
}
