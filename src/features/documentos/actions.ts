"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type { Database, CategoriaDocumento } from "@/types/database.types";
import { MAX_TAMANO_BYTES } from "./constants";

type DB = SupabaseClient<Database>;

const CATEGORIAS_VALIDAS: CategoriaDocumento[] = [
  "contrato",
  "anexo",
  "inventario",
  "acta_entrega",
  "acta_recepcion",
  "liquidacion",
  "comprobante_pago",
  "factura",
  "boleta",
  "gasto",
  "mantencion",
  "otro",
];

/** Metadatos del archivo ya subido a Storage por el cliente. */
export type ArchivoSubido = {
  storage_path: string;
  nombre_archivo: string;
  tamano_bytes: number;
  mime_type: string | null;
};

export type NuevoDocumentoInput = {
  nombre: string;
  categoria: string;
  propietario_id?: string | null;
  arrendatario_id?: string | null;
  propiedad_id?: string | null;
  contrato_id?: string | null;
  observaciones?: string | null;
  fecha_documento?: string | null;
  archivo: ArchivoSubido;
};

export type ResultadoDocumento = { error: string | null; id?: string };

function limpiar(v: string | null | undefined): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function validarArchivo(a: ArchivoSubido): string | null {
  if (!a?.storage_path || !a?.nombre_archivo) return "Archivo inválido.";
  if (!Number.isFinite(a.tamano_bytes) || a.tamano_bytes <= 0)
    return "El archivo está vacío.";
  if (a.tamano_bytes > MAX_TAMANO_BYTES)
    return "El archivo supera el tamaño máximo (25 MB).";
  return null;
}

/** Registra un documento nuevo (versión 1) con el archivo ya subido a Storage. */
export async function registrarDocumento(
  input: NuevoDocumentoInput
): Promise<ResultadoDocumento> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const nombre = limpiar(input.nombre);
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!CATEGORIAS_VALIDAS.includes(input.categoria as CategoriaDocumento))
    return { error: "Categoría inválida." };
  const errArchivo = validarArchivo(input.archivo);
  if (errArchivo) return { error: errArchivo };

  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from("documentos")
    .insert({
      empresa_id: profile.empresa_id,
      nombre,
      categoria: input.categoria as CategoriaDocumento,
      propietario_id: limpiar(input.propietario_id),
      arrendatario_id: limpiar(input.arrendatario_id),
      propiedad_id: limpiar(input.propiedad_id),
      contrato_id: limpiar(input.contrato_id),
      observaciones: limpiar(input.observaciones),
      fecha_documento: limpiar(input.fecha_documento),
      version_actual: 1,
      subido_por: profile.id,
      subido_por_email: profile.email,
    })
    .select("id")
    .single();

  if (error || !doc) return { error: "No se pudo registrar el documento." };

  const { error: errVer } = await supabase.from("documento_versiones").insert({
    empresa_id: profile.empresa_id,
    documento_id: doc.id,
    version: 1,
    storage_path: input.archivo.storage_path,
    nombre_archivo: input.archivo.nombre_archivo,
    tamano_bytes: input.archivo.tamano_bytes,
    mime_type: input.archivo.mime_type,
    subido_por: profile.id,
    subido_por_email: profile.email,
  });

  if (errVer) {
    // Evita dejar un documento sin ninguna versión.
    await supabase.from("documentos").delete().eq("id", doc.id);
    return { error: "No se pudo guardar el archivo del documento." };
  }

  await registrarAuditoria(supabase, profile, "documento_creado", "documento", doc.id, {
    nombre,
    categoria: input.categoria,
  });

  revalidatePath("/documentos");
  return { error: null, id: doc.id };
}

/** Sube una nueva versión de un documento existente. */
export async function subirVersion(
  documentoId: string,
  archivo: ArchivoSubido
): Promise<ResultadoDocumento> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const errArchivo = validarArchivo(archivo);
  if (errArchivo) return { error: errArchivo };

  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documentos")
    .select("id, version_actual")
    .eq("id", documentoId)
    .single();
  if (!doc) return { error: "Documento no encontrado." };

  const siguiente = (doc.version_actual ?? 0) + 1;

  const { error: errVer } = await supabase.from("documento_versiones").insert({
    empresa_id: profile.empresa_id,
    documento_id: documentoId,
    version: siguiente,
    storage_path: archivo.storage_path,
    nombre_archivo: archivo.nombre_archivo,
    tamano_bytes: archivo.tamano_bytes,
    mime_type: archivo.mime_type,
    subido_por: profile.id,
    subido_por_email: profile.email,
  });
  if (errVer) {
    const msg = errVer.message ?? "";
    if (msg.includes("duplicate") || msg.includes("unique"))
      return { error: "Conflicto de versión. Reintenta." };
    return { error: "No se pudo subir la nueva versión." };
  }

  await supabase
    .from("documentos")
    .update({ version_actual: siguiente })
    .eq("id", documentoId);

  await registrarAuditoria(
    supabase,
    profile,
    "documento_version_subida",
    "documento",
    documentoId,
    { version: siguiente }
  );

  revalidatePath("/documentos");
  revalidatePath(`/documentos/${documentoId}`);
  return { error: null, id: documentoId };
}

async function borrarObjetos(supabase: DB, paths: string[]): Promise<void> {
  if (paths.length) {
    await supabase.storage.from("documentos").remove(paths);
  }
}

/** Elimina una versión concreta (y su archivo). No permite dejar el documento sin versiones. */
export async function eliminarVersion(
  versionId: string
): Promise<ResultadoDocumento> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: ver } = await supabase
    .from("documento_versiones")
    .select("id, documento_id, version, storage_path")
    .eq("id", versionId)
    .single();
  if (!ver) return { error: "Versión no encontrada." };

  const { data: hermanas } = await supabase
    .from("documento_versiones")
    .select("id, version")
    .eq("documento_id", ver.documento_id)
    .order("version", { ascending: false });

  if ((hermanas?.length ?? 0) <= 1)
    return {
      error: "Es la única versión: elimina el documento completo.",
    };

  await supabase.from("documento_versiones").delete().eq("id", versionId);
  await borrarObjetos(supabase, [ver.storage_path]);

  // Reapunta la versión vigente a la mayor restante.
  const restante = (hermanas ?? []).find((h) => h.id !== versionId);
  if (restante) {
    await supabase
      .from("documentos")
      .update({ version_actual: restante.version })
      .eq("id", ver.documento_id);
  }

  await registrarAuditoria(
    supabase,
    profile,
    "documento_version_eliminada",
    "documento",
    ver.documento_id,
    { version: ver.version }
  );

  revalidatePath(`/documentos/${ver.documento_id}`);
  return { error: null, id: ver.documento_id };
}

/** Elimina el documento completo: todas sus versiones y archivos. */
export async function eliminarDocumento(
  id: string
): Promise<ResultadoDocumento> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: versiones } = await supabase
    .from("documento_versiones")
    .select("storage_path")
    .eq("documento_id", id);

  // Borra la fila (cascade elimina versiones) y luego los objetos de Storage.
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el documento." };

  await borrarObjetos(
    supabase,
    (versiones ?? []).map((v) => v.storage_path)
  );

  await registrarAuditoria(supabase, profile, "documento_eliminado", "documento", id, null);

  revalidatePath("/documentos");
  return { error: null };
}

/** Genera una signed URL para ver (inline) o descargar una versión. */
export async function urlVersion(
  versionId: string,
  modo: "ver" | "descargar"
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin")
    return { url: null, error: "No autorizado." };

  const supabase = await createClient();
  const { data: ver } = await supabase
    .from("documento_versiones")
    .select("storage_path, nombre_archivo")
    .eq("id", versionId)
    .single();
  if (!ver) return { url: null, error: "Versión no encontrada." };

  const { data } = await supabase.storage
    .from("documentos")
    .createSignedUrl(
      ver.storage_path,
      60,
      modo === "descargar" ? { download: ver.nombre_archivo } : undefined
    );

  if (!data?.signedUrl) return { url: null, error: "No se pudo generar el enlace." };
  return { url: data.signedUrl, error: null };
}
