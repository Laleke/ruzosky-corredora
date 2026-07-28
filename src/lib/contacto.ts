/** Utilidades de formato/validación para campos de contacto (email, teléfono, cuenta). */

/** Filtra la escritura a solo dígitos y un único "+" inicial (formato E.164 libre). */
export function formatearTelefono(valor: string): string {
  const tienePrefijo = valor.trimStart().startsWith("+");
  const digitos = valor.replace(/\D/g, "");
  return tienePrefijo ? `+${digitos}` : digitos;
}

/** Filtra la escritura a solo dígitos (N° de cuenta bancaria: sin puntos, guiones ni letras). */
export function formatearNumeroCuenta(valor: string): string {
  return valor.replace(/\D/g, "");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** true si el string tiene estructura de correo válida (o está vacío: el campo es opcional). */
export function esEmailValido(valor: string): boolean {
  const v = valor.trim();
  if (v === "") return true;
  return EMAIL_REGEX.test(v);
}
