/**
 * Lógica pura de filtrado de documentos (testeable sin BD).
 */

/** Fecha efectiva del documento: la propia o, si falta, la fecha de subida. */
export function fechaEfectivaDocumento(d: {
  fecha_documento: string | null;
  created_at: string;
}): string {
  return d.fecha_documento ?? d.created_at.slice(0, 10);
}

/**
 * ¿La fecha (YYYY-MM-DD) cae dentro del rango [desde, hasta]?
 * Ambos límites son opcionales e inclusivos. Comparación lexicográfica válida
 * para fechas ISO.
 */
export function dentroDeRango(
  fecha: string,
  desde?: string,
  hasta?: string
): boolean {
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
}
