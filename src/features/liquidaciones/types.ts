import type { Database } from "@/types/database.types";

export type Liquidacion =
  Database["public"]["Tables"]["liquidaciones"]["Row"];
export type LiquidacionDetalle =
  Database["public"]["Tables"]["liquidacion_detalles"]["Row"];

export type LineaLiquidacion = {
  tipo: "ingreso" | "descuento";
  concepto: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  monto: number;
};

export type PreviewLiquidacion = {
  ingresos: LineaLiquidacion[];
  descuentos: LineaLiquidacion[];
  subtotal_ingresos: number;
  subtotal_descuentos: number;
  total_liquidacion: number;
};

/** Liquidación con nombre del propietario (para listado). */
export type LiquidacionConPropietario = Liquidacion & {
  propietario_nombre: string;
};
