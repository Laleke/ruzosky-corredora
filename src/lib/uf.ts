/**
 * Reajuste trimestral de canon en UF (verificado contra historial real de
 * pagos): se reconvierte cada 1° de marzo/junio/septiembre/diciembre usando
 * el valor de UF de esa fecha, no el 1° de enero/abril/julio/octubre.
 */
const MESES_CORTE = [3, 6, 9, 12];

/** Fecha (1° del mes) del corte trimestral vigente para una fecha dada. */
export function inicioTrimestreVigente(hoy: Date): Date {
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();
  const corte = [...MESES_CORTE].reverse().find((m) => m <= mes);
  return corte
    ? new Date(anio, corte - 1, 1)
    : new Date(anio - 1, 11, 1); // enero/febrero: el corte vigente es dic. del año anterior
}

function formatoDDMMYYYY(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${fecha.getFullYear()}`;
}

/** Valor de la UF a una fecha exacta, vía mindicador.cl (Banco Central). */
export async function obtenerValorUF(fecha: Date): Promise<number> {
  const res = await fetch(`https://mindicador.cl/api/uf/${formatoDDMMYYYY(fecha)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mindicador.cl respondió ${res.status}`);
  const json = await res.json();
  const valor = json?.serie?.[0]?.valor;
  if (!Number.isFinite(valor)) throw new Error("Respuesta de mindicador.cl sin valor de UF.");
  return valor as number;
}

/** Canon actual = canon fijo en UF × valor de UF del corte trimestral vigente. */
export async function calcularCanonActualUF(
  canonUfBase: number,
  hoy: Date
): Promise<number> {
  const valorUF = await obtenerValorUF(inicioTrimestreVigente(hoy));
  return Math.round(canonUfBase * valorUF);
}
