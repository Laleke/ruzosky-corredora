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

/** Gasto candidato/descontado en una liquidación. */
export type LineaGasto = {
  gasto_id: string;
  categoria: string;
  descripcion: string;
  fecha: string;
  monto: number;
};

export type PreviewLiquidacion = {
  ingresos: LineaLiquidacion[];
  descuentos: LineaLiquidacion[];
  gastos: LineaGasto[];
  subtotal_ingresos: number;
  /** Solo comisiones/descuentos de negocio (NO incluye gastos). */
  subtotal_descuentos: number;
  /** Suma de los gastos descontables del propietario. */
  subtotal_gastos: number;
  total_liquidacion: number;
};

/** Liquidación con nombre del propietario (para listado). */
export type LiquidacionConPropietario = Liquidacion & {
  propietario_nombre: string;
};
