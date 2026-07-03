import type { CategoriaDocumento } from "@/types/database.types";
import type { badge } from "@/components/ui";

type Tone = Parameters<typeof badge>[0];

/** Catálogo de categorías de documento (orden de despliegue + etiqueta + tono). */
export const CATEGORIAS: {
  value: CategoriaDocumento;
  label: string;
  tone: Tone;
}[] = [
  { value: "contrato", label: "Contrato", tone: "info" },
  { value: "anexo", label: "Anexo", tone: "info" },
  { value: "inventario", label: "Inventario", tone: "neutral" },
  { value: "acta_entrega", label: "Acta de entrega", tone: "neutral" },
  { value: "acta_recepcion", label: "Acta de recepción", tone: "neutral" },
  { value: "liquidacion", label: "Liquidación", tone: "success" },
  { value: "comprobante_pago", label: "Comprobante de pago", tone: "success" },
  { value: "factura", label: "Factura", tone: "warning" },
  { value: "boleta", label: "Boleta", tone: "warning" },
  { value: "gasto", label: "Gasto", tone: "danger" },
  { value: "mantencion", label: "Mantención", tone: "danger" },
  { value: "otro", label: "Otro", tone: "neutral" },
];

export const CATEGORIA_LABEL: Record<CategoriaDocumento, string> =
  Object.fromEntries(CATEGORIAS.map((c) => [c.value, c.label])) as Record<
    CategoriaDocumento,
    string
  >;

export const CATEGORIA_TONE: Record<CategoriaDocumento, Tone> =
  Object.fromEntries(CATEGORIAS.map((c) => [c.value, c.tone])) as Record<
    CategoriaDocumento,
    Tone
  >;

export const BUCKET_DOCUMENTOS = "documentos";

/** 25 MB — límite razonable para escaneos/PDF/fotos de la corredora. */
export const MAX_TAMANO_BYTES = 25 * 1024 * 1024;

export function formatearTamano(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
