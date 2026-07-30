/** "YYYY-MM-DD" → "dd/mm/yyyy". Formato chileno para mostrar fechas en texto. */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

/** "YYYY-MM" → "mm/yyyy". Para períodos (arriendos, liquidaciones). */
export function formatearPeriodo(periodo: string | null | undefined): string {
  if (!periodo) return "—";
  const [anio, mes] = periodo.slice(0, 7).split("-");
  if (!anio || !mes) return periodo;
  return `${mes}/${anio}`;
}
