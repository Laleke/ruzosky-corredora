/**
 * Utilidades de RUT chileno. La validación es la frontera de entrada:
 * la BD almacena siempre el formato normalizado "cuerpo-dv" sin puntos.
 */

/** Quita puntos, guión y espacios; deja dígitos + K en mayúscula. */
function limpiar(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

/** Calcula el dígito verificador (módulo 11) para el cuerpo numérico. */
function calcularDv(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/** true si el RUT (en cualquier formato) es válido. */
export function esRutValido(rut: string): boolean {
  const limpio = limpiar(rut);
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return calcularDv(cuerpo) === dv;
}

/** Devuelve el formato canónico "12345678-9", o null si es inválido. */
export function normalizarRut(rut: string): string | null {
  const limpio = limpiar(rut);
  if (!esRutValido(limpio)) return null;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}
