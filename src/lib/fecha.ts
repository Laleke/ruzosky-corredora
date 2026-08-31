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

/**
 * Suma días a una fecha ISO (YYYY-MM-DD) en UTC puro (Date.UTC +
 * getUTCDate/setUTCDate) — a diferencia de sumarMeses no hay forma de hacer
 * aritmética de días con solo substrings, pero usar únicamente métodos UTC
 * (nunca los locales) evita el mismo bug de zona horaria de Chile que afecta
 * a `new Date(...).setMonth()`/`.toISOString()` mezclados.
 */
export function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/**
 * Suma meses a una fecha ISO (YYYY-MM-DD) con aritmética entera de meses,
 * sin pasar por Date/toISOString — ese camino puede retroceder un día/mes
 * server-side por el offset UTC negativo de Chile (bug real ya resuelto en
 * `periodoArriendoVigente`, ver PROYECTO.md).
 */
export function sumarMeses(fechaISO: string, meses: number): string {
  const y = parseInt(fechaISO.slice(0, 4), 10);
  const m = parseInt(fechaISO.slice(5, 7), 10); // 1-12
  const d = fechaISO.slice(8, 10);
  const total = y * 12 + (m - 1) + meses;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-${d}`;
}
