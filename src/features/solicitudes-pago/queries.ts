import { createClient } from "@/lib/supabase/server";
import type { SolicitudPago, SolicitudConContexto } from "./types";

type PersonaEmbed = {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
} | null;

function nombrePersona(p: PersonaEmbed): string {
  if (!p) return "—";
  return p.tipo_persona === "persona_juridica"
    ? p.razon_social ?? "—"
    : [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

const SELECT_CONTEXTO = `*,
   cargos(periodo, contratos(numero_contrato, propiedades(direccion))),
   arrendatarios(tipo_persona, nombre, apellido, razon_social)`;

type Row = SolicitudPago & {
  cargos: {
    periodo: string;
    contratos: { numero_contrato: string | null; propiedades: { direccion: string | null } | null } | null;
  } | null;
  arrendatarios: PersonaEmbed;
};

function mapear(r: Row): SolicitudConContexto {
  return {
    ...r,
    numero_contrato: r.cargos?.contratos?.numero_contrato ?? null,
    propiedad_direccion: r.cargos?.contratos?.propiedades?.direccion ?? "—",
    periodo: r.cargos?.periodo ?? "",
    arrendatario_nombre: nombrePersona(r.arrendatarios),
  };
}

/** Mis solicitudes (arrendatario) — todos los estados, ordenadas por fecha. */
export async function misSolicitudes(): Promise<SolicitudConContexto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_pago")
    .select(SELECT_CONTEXTO)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(mapear);
}

/**
 * Solicitudes pendientes de revisar. RLS filtra automáticamente el alcance:
 * admin ve todas las de la empresa; propietario solo las de sus propiedades.
 */
export async function solicitudesPendientes(): Promise<SolicitudConContexto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_pago")
    .select(SELECT_CONTEXTO)
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(mapear);
}
