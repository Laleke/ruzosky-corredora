"use client";

import { createClient } from "@/lib/supabase/client";
import type { ArchivoSubido } from "./actions";

const BUCKET = "documentos";

function extension(nombre: string): string {
  const i = nombre.lastIndexOf(".");
  return i > 0 ? nombre.slice(i + 1).toLowerCase() : "";
}

/**
 * Sube el archivo directo a Supabase Storage (evita el límite de body de las
 * funciones serverless de Vercel). El path es `<empresaId>/<uuid>.<ext>`, que
 * las políticas RLS de storage.objects usan para aislar por tenant.
 */
export async function subirArchivo(
  file: File,
  empresaId: string
): Promise<{ archivo: ArchivoSubido | null; error: string | null }> {
  const supabase = createClient();
  const ext = extension(file.name);
  const path = `${empresaId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) return { archivo: null, error: "No se pudo subir el archivo." };

  return {
    archivo: {
      storage_path: path,
      nombre_archivo: file.name,
      tamano_bytes: file.size,
      mime_type: file.type || null,
    },
    error: null,
  };
}

/** Elimina un archivo huérfano si el registro de metadatos falló. */
export async function limpiarArchivo(storagePath: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch {
    /* limpieza best-effort */
  }
}
