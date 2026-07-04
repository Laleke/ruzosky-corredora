import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad, etiquetaContrato } from "@/lib/propiedad";
import { fechaEfectivaDocumento, dentroDeRango } from "./filtros";
import type { Database } from "@/types/database.types";

type DB = SupabaseClient<Database>;

/**
 * Traduce los filtros por propietario/arrendatario al conjunto de propiedades
 * relacionadas. Devuelve:
 *  - null  → no hay filtro por propietario/arrendatario (no acotar por propiedad),
 *  - []    → el criterio no tiene propiedades (resultado vacío),
 *  - [ids] → propiedades que cumplen el/los criterios (intersección).
 */
async function resolverPropiedadScope(
  supabase: DB,
  filtros: FiltrosDocumentos
): Promise<string[] | null> {
  const conjuntos: string[][] = [];

  if (filtros.propietarioId) {
    const { data } = await supabase
      .from("propietarios_propiedades")
      .select("propiedad_id")
      .eq("propietario_id", filtros.propietarioId);
    conjuntos.push((data ?? []).map((r) => r.propiedad_id));
  }

  if (filtros.arrendatarioId) {
    const { data: ca } = await supabase
      .from("contratos_arrendatarios")
      .select("contrato_id")
      .eq("arrendatario_id", filtros.arrendatarioId);
    const contratoIds = (ca ?? []).map((r) => r.contrato_id);
    let props: string[] = [];
    if (contratoIds.length) {
      const { data: cs } = await supabase
        .from("contratos")
        .select("propiedad_id")
        .in("id", contratoIds);
      props = [...new Set((cs ?? []).map((r) => r.propiedad_id))];
    }
    conjuntos.push(props);
  }

  if (conjuntos.length === 0) return null;
  // Intersección de todos los criterios aplicados.
  return conjuntos.reduce((acc, set) => acc.filter((id) => set.includes(id)));
}
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

  // Propietario y arrendatario NO se filtran por el FK directo del documento
  // (casi siempre null): se resuelven al conjunto de propiedades relacionadas.
  const scope = await resolverPropiedadScope(supabase, filtros);
  if (scope && scope.length === 0) return []; // criterio sin propiedades → vacío

  let q = supabase
    .from("documentos")
    .select(
      `*,
       propietarios(tipo_persona, nombre, apellido, razon_social),
       arrendatarios(tipo_persona, nombre, apellido, razon_social),
       propiedades(codigo_interno, direccion, numero, departamento),
       contratos(numero_contrato),
       documento_versiones(id, version, nombre_archivo, tamano_bytes, mime_type)`
    )
    .order("created_at", { ascending: false });

  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.propiedadId) q = q.eq("propiedad_id", filtros.propiedadId);
  if (scope) q = q.in("propiedad_id", scope);

  const busqueda = filtros.q ? limpiarBusqueda(filtros.q) : "";
  if (busqueda) {
    q = q.or(`nombre.ilike.%${busqueda}%,observaciones.ilike.%${busqueda}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  type Row = Documento & {
    propietarios: PersonaEmbed;
    arrendatarios: PersonaEmbed;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
    contratos: { numero_contrato: string | null } | null;
    documento_versiones: {
      id: string;
      version: number;
      nombre_archivo: string;
      tamano_bytes: number;
      mime_type: string | null;
    }[];
  };

  // Filtro por fecha en memoria sobre la fecha efectiva (documento o subida),
  // para no excluir documentos sin `fecha_documento` que sí caen en el rango.
  const filas = ((data ?? []) as unknown as Row[]).filter((d) =>
    filtros.desde || filtros.hasta
      ? dentroDeRango(fechaEfectivaDocumento(d), filtros.desde, filtros.hasta)
      : true
  );

  return filas.map((d) => {
    const actual =
      d.documento_versiones?.find((v) => v.version === d.version_actual) ??
      null;
    const prop = d.propiedades;
    return {
      ...d,
      propietario_nombre: nombrePersona(d.propietarios),
      arrendatario_nombre: nombrePersona(d.arrendatarios),
      propiedad_label: prop ? etiquetaPropiedad(prop) : null,
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
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
    contratos: { numero_contrato: string | null } | null;
  };
  const d = data as unknown as Row;
  const prop = d.propiedades;
  return {
    ...d,
    propietario_nombre: nombrePersona(d.propietarios),
    arrendatario_nombre: nombrePersona(d.arrendatarios),
    propiedad_label: prop ? etiquetaPropiedad(prop) : null,
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
      .select("id, codigo_interno, direccion, numero, departamento")
      .eq("activo", true)
      .order("codigo_interno"),
    supabase
      .from("contratos")
      .select(
        "id, numero_contrato, propiedades(codigo_interno, direccion, numero, departamento)"
      )
      .eq("activo", true)
      .order("numero_contrato"),
  ]);

  type ContratoOpc = {
    id: string;
    numero_contrato: string | null;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  };

  return {
    propietarios: (props.data ?? []).map(persona),
    arrendatarios: (arr.data ?? []).map(persona),
    propiedades: (propiedades.data ?? []).map((p) => ({
      id: p.id,
      label: etiquetaPropiedad(p),
    })),
    contratos: ((contratos.data ?? []) as unknown as ContratoOpc[]).map((c) => ({
      id: c.id,
      label: etiquetaContrato(c.numero_contrato, c.propiedades),
    })),
  };
}

/**
 * Mapa propiedad_id → ids de contratos vigentes (vigente/renovado).
 * Permite autoseleccionar el contrato cuando la propiedad tiene uno solo.
 */
export async function getContratosVigentesPorPropiedad(): Promise<
  Record<string, string[]>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contratos")
    .select("id, propiedad_id")
    .eq("activo", true)
    .in("estado", ["vigente", "renovado"]);
  const mapa: Record<string, string[]> = {};
  for (const c of data ?? []) {
    (mapa[c.propiedad_id] ??= []).push(c.id);
  }
  return mapa;
}

export type ContextoContrato = {
  contratoId: string;
  contratoLabel: string;
  arrendatarioId: string | null;
  arrendatario: string | null;
};
export type ContextoPropiedad = Record<string, ContextoContrato[]>;

/**
 * Contexto por propiedad: sus contratos vigentes, cada uno con su arrendatario
 * principal. Base del flujo Propiedad → Contrato (auto) → Arrendatario (auto).
 */
export async function getContextoVigentePorPropiedad(): Promise<ContextoPropiedad> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contratos")
    .select(
      "id, propiedad_id, numero_contrato, contratos_arrendatarios(arrendatarios(id, tipo_persona, nombre, apellido, razon_social))"
    )
    .eq("activo", true)
    .in("estado", ["vigente", "renovado"]);

  type Row = {
    id: string;
    propiedad_id: string;
    numero_contrato: string | null;
    contratos_arrendatarios: {
      arrendatarios:
        | (PersonaEmbed & { id: string })
        | null;
    }[];
  };

  const mapa: ContextoPropiedad = {};
  for (const c of (data ?? []) as unknown as Row[]) {
    const primero = c.contratos_arrendatarios?.[0]?.arrendatarios ?? null;
    (mapa[c.propiedad_id] ??= []).push({
      contratoId: c.id,
      contratoLabel: c.numero_contrato ?? "Contrato",
      arrendatarioId: primero?.id ?? null,
      arrendatario: nombrePersona(primero),
    });
  }
  return mapa;
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
