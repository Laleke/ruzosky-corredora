import type { Database, CategoriaDocumento } from "@/types/database.types";

export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type DocumentoVersion =
  Database["public"]["Tables"]["documento_versiones"]["Row"];

/** Documento con datos derivados para el listado. */
export type DocumentoListado = Documento & {
  propietario_nombre: string | null;
  arrendatario_nombre: string | null;
  propiedad_label: string | null;
  contrato_numero: string | null;
  /** Datos de la versión vigente (último archivo). */
  version_actual_id: string | null;
  version_nombre_archivo: string | null;
  version_tamano_bytes: number | null;
  version_mime: string | null;
};

/** Opción genérica para selects de relación. */
export type Opcion = { id: string; label: string };

export type OpcionesRelacion = {
  propietarios: Opcion[];
  arrendatarios: Opcion[];
  propiedades: Opcion[];
  contratos: Opcion[];
};

export type FiltrosDocumentos = {
  q?: string;
  categoria?: CategoriaDocumento;
  propiedadId?: string;
  propietarioId?: string;
  arrendatarioId?: string;
  desde?: string;
  hasta?: string;
};
