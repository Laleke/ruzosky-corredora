import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type {
  Documento,
  DocumentoVersion,
  DocumentoListado,
  OpcionesRelacion,
  FiltrosDocumentos,
} from "./types";

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

/** Escapa caracteres que rompen el filtro `.or()` de PostgREST. */
function limpiarBusqueda(q: string): string {
  return q.replace(/[,()*]/g, " ").trim();
}

export async function listDocumentos(
  filtros: FiltrosDocumentos = {}
): Promise<DocumentoListado[]> {
  const supabase = await createClient();
  let q = supabase
    .from("documentos")
    .select(
      `*,
       propietarios(tipo_persona, nombre, apellido, razon_social),
       arrendatarios(tipo_persona, nombre, apellido, razon_social),
       propiedades(codigo_interno, direccion),
       contratos(numero_contrato),
       documento_versiones(id, version, nombre_archivo, tamano_bytes, mime_type)`
    )
    .order("created_at", { ascending: false });

  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.propiedadId) q = q.eq("propiedad_id", filtros.propiedadId);
  if (filtros.contratoId) q = q.eq("contrato_id", filtros.contratoId);
  if (filtros.propietarioId) q = q.eq("propietario_id", filtros.propietarioId);
  if (filtros.arrendatarioId)
    q = q.eq("arrendatario_id", filtros.arrendatarioId);
  if (filtros.desde) q = q.gte("fecha_documento", filtros.desde);
  if (filtros.hasta) q = q.lte("fecha_documento", filtros.hasta);

  const busqueda = filtros.q ? limpiarBusqueda(filtros.q) : "";
  if (busqueda) {
    q = q.or(`nombre.ilike.%${busqueda}%,observaciones.ilike.%${busqueda}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  type Row = Documento & {
    propietarios: PersonaEmbed;
    arrendatarios: PersonaEmbed;
    propiedades: { codigo_interno: string | null; direccion: string | null } | null;
    contratos: { numero_contrato: string | null } | null;
    documento_versiones: {
      id: string;
      version: number;
      nombre_archivo: string;
      tamano_bytes: number;
      mime_type: string | null;
    }[];
  };

  return ((data ?? []) as unknown as Row[]).map((d) => {
    const actual =
      d.documento_versiones?.find((v) => v.version === d.version_actual) ??
      null;
    const prop = d.propiedades;
    return {
      ...d,
      propietario_nombre: nombrePersona(d.propietarios),
      arrendatario_nombre: nombrePersona(d.arrendatarios),
      propiedad_label: prop
        ? prop.codigo_interno ?? prop.direccion ?? null
        : null,
      contrato_numero: d.contratos?.numero_contrato ?? null,
      version_actual_id: actual?.id ?? null,
      version_nombre_archivo: actual?.nombre_archivo ?? null,
      version_tamano_bytes: actual?.tamano_bytes ?? null,
      version_mime: actual?.mime_type ?? null,
    };
  });
}

export async function getDocumento(id: string): Promise<DocumentoListado | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documentos")
    .select(
      `*,
       propietarios(tipo_persona, nombre, apellido, razon_social),
       arrendatarios(tipo_persona, nombre, apellido, razon_social),
       propiedades(codigo_interno, direccion),
       contratos(numero_contrato)`
    )
    .eq("id", id)
    .single();
  if (!data) return null;

  type Row = Documento & {
    propietarios: PersonaEmbed;
    arrendatarios: PersonaEmbed;
    propiedades: { codigo_interno: string | null; direccion: string | null } | null;
    contratos: { numero_contrato: string | null } | null;
  };
  const d = data as unknown as Row;
  const prop = d.propiedades;
  return {
    ...d,
    propietario_nombre: nombrePersona(d.propietarios),
    arrendatario_nombre: nombrePersona(d.arrendatarios),
    propiedad_label: prop ? prop.codigo_interno ?? prop.direccion ?? null : null,
    contrato_numero: d.contratos?.numero_contrato ?? null,
    version_actual_id: null,
    version_nombre_archivo: null,
    version_tamano_bytes: null,
    version_mime: null,
  };
}

export async function getVersiones(
  documentoId: string
): Promise<DocumentoVersion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documento_versiones")
    .select("*")
    .eq("documento_id", documentoId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Opciones para poblar los selects de relación (filtros y formulario). */
export async function getOpcionesRelacion(): Promise<OpcionesRelacion> {
  const supabase = await createClient();

  const persona = (p: {
    id: string;
    tipo_persona: string;
    nombre: string | null;
    apellido: string | null;
    razon_social: string | null;
  }) => ({ id: p.id, label: nombrePersona(p) ?? "—" });

  const [props, arr, propiedades, contratos] = await Promise.all([
    supabase
      .from("propietarios")
      .select("id, tipo_persona, nombre, apellido, razon_social")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("arrendatarios")
      .select("id, tipo_persona, nombre, apellido, razon_social")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("propiedades")
      .select("id, codigo_interno, direccion")
      .eq("activo", true)
      .order("codigo_interno"),
    supabase
      .from("contratos")
      .select("id, numero_contrato")
      .eq("activo", true)
      .order("numero_contrato"),
  ]);

  return {
    propietarios: (props.data ?? []).map(persona),
    arrendatarios: (arr.data ?? []).map(persona),
    propiedades: (propiedades.data ?? []).map((p) => ({
      id: p.id,
      label: p.codigo_interno ?? p.direccion ?? "—",
    })),
    contratos: (contratos.data ?? []).map((c) => ({
      id: c.id,
      label: c.numero_contrato ?? "—",
    })),
  };
}

/** Devuelve una signed URL (60s) para ver/descargar una versión. */
export async function getSignedUrl(
  storagePath: string,
  opts?: { download?: string }
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 60, opts?.download ? { download: opts.download } : undefined);
  return data?.signedUrl ?? null;
}

export type { Database };
