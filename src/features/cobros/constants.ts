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
