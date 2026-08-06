import type { TipoCargo } from "@/types/database.types";

/**
 * Cargos "desfazados": el período de consumo real (ej. boleta de luz
 * 06/06–06/07) no coincide con el mes en que se cobra/vence. `periodo` sigue
 * siendo el mes de cobro (no cambia) — estos tipos además admiten guardar el
 * rango de consumo real (`fecha_consumo_desde`/`fecha_consumo_hasta`).
 */
export const TIPOS_DESFAZADOS: TipoCargo[] = ["gasto_comun", "luz", "agua", "internet"];

export function esTipoDesfazado(tipo: string): boolean {
  return (TIPOS_DESFAZADOS as string[]).includes(tipo);
}

/** Nombre visible del concepto cobrado. Única fuente: se muestra igual en el
 *  dashboard, el portal del arrendatario y el estado de cuenta enviable. */
export const TIPO_CARGO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
  luz: "Luz",
  agua: "Agua",
  internet: "Internet",
  multa: "Multa",
  ajuste: "Ajuste",
  otro: "Otro",
};

export function etiquetaTipoCargo(tipo: string): string {
  return TIPO_CARGO_LABEL[tipo] ?? tipo;
}
