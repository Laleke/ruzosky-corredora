/**
 * Días de atraso de un cargo respecto de una fecha de referencia.
 *
 * Ambas fechas se anclan a medianoche UTC antes de restar: comparar un
 * "YYYY-MM-DD" contra un Date local hace que el resultado cambie según la zona
 * horaria del servidor (mismo tipo de error que ya se corrigió en
 * `periodoArriendoVigente`, ver cobros/queries.ts).
 *
 * Devuelve 0 —nunca negativo— cuando el cargo aún no vence o no tiene fecha de
 * vencimiento: "días de mora" solo tiene sentido hacia el pasado.
 */
export function diasMora(fechaVencimiento: string | null, hoy: string): number {
  if (!fechaVencimiento) return 0;
  const vence = fechaVencimiento.slice(0, 10);
  const referencia = hoy.slice(0, 10);
  if (vence >= referencia) return 0;

  const ms = Date.parse(`${referencia}T00:00:00Z`) - Date.parse(`${vence}T00:00:00Z`);
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.round(ms / 86_400_000));
}
