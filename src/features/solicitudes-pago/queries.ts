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
 * La solicitud pendiente del arrendatario para este cargo, si tiene una — se
 * usa para ofrecerle editarla en vez de crear una duplicada. RLS
 * (`solicitudes_pago_select_arrendatario`) ya filtra a sus propias filas.
 */
export async function miSolicitudPendiente(cargoId: string): Promise<SolicitudPago | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes_pago")
    .select("*")
    .eq("cargo_id", cargoId)
    .eq("estado", "pendiente")
    .maybeSingle();
  return data ?? null;
}

/**
 * La solicitud más reciente de este cargo (cualquier estado) — para mostrar
 * el detalle de "pago informado" del arrendatario aunque ya haya sido
 * aprobada o rechazada. RLS (`solicitudes_pago_select_arrendatario`) limita a
 * sus propias filas.
 */
export async function miSolicitudDeCargo(cargoId: string): Promise<SolicitudPago | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes_pago")
    .select("*")
    .eq("cargo_id", cargoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
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
