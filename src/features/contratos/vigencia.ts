import { formatearFecha } from "@/lib/fecha";

/**
 * Cómo se muestra el término de un contrato.
 *
 * Un contrato de arriendo sin fecha de término, o cuya fecha ya pasó pero sigue
 * vigente/renovado, opera como indefinido: en Chile la renovación tácita lo
 * prolonga mes a mes mientras nadie lo desahucie. Mostrar la fecha vieja a
 * secas daría a entender que el contrato ya no rige.
 *
 * - Sin fecha                       → "Indefinido"
 * - Fecha futura                    → la fecha
 * - Fecha pasada y aún vigente      → "Indefinido (renovado desde dd/mm/aaaa)"
 * - Fecha pasada y ya terminado     → la fecha
 */
export function terminoMostrar(
  fechaTermino: string | null,
  estado: string,
  hoy: string = new Date().toISOString().slice(0, 10)
): string {
  if (!fechaTermino) return "Indefinido";

  const vencio = fechaTermino.slice(0, 10) < hoy;
  const sigueVigente = estado === "vigente" || estado === "renovado";

  if (vencio && sigueVigente) {
    return `Indefinido (renovado desde ${formatearFecha(fechaTermino)})`;
  }
  return formatearFecha(fechaTermino);
}

/**
 * Identificador visible del contrato. `numero_contrato` es opcional y en la
 * práctica viene vacío, así que se cae a un identificador corto derivado del
 * id — preferible a mostrar "—" en un documento o listado.
 */
export function numeroContratoMostrar(
  numeroContrato: string | null,
  id: string
): string {
  if (numeroContrato && numeroContrato.trim() !== "") return numeroContrato;
  return `N° ${id.slice(0, 8).toUpperCase()}`;
}
