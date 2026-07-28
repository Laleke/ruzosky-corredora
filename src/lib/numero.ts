/** Convierte texto ingresado por el usuario a número, aceptando coma como separador decimal (estándar en Chile). */
export function parseDecimal(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const v = valor.trim();
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
