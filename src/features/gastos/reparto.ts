import type { ResponsableGasto } from "@/types/database.types";
import { sumarMeses } from "@/lib/fecha";

export { sumarMeses };

export type TipoMontoObligacion = "porcentaje" | "monto_fijo";

export type CuotaInput = {
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string | null;
};

export type FilaObligacion = {
  responsable: ResponsableGasto;
  tipo_monto: TipoMontoObligacion;
  valor: number;
  cuotas: CuotaInput[];
};

export type CuotaEstado = {
  estado: "pendiente" | "pagado" | "anulado";
  liquidacion_id: string | null;
};

export type ObligacionConCuotasEstado = { cuotas: CuotaEstado[] };

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Monto en CLP de una obligación, según sea porcentaje del gasto o monto fijo. */
export function resolverMontoObligacion(
  montoTotalGasto: number,
  tipoMonto: TipoMontoObligacion,
  valor: number
): number {
  if (tipoMonto === "porcentaje") return r2((montoTotalGasto * valor) / 100);
  return r2(valor);
}

/**
 * Genera N cuotas mensuales a partir de un monto y fecha de inicio. El resto
 * de la división entera cae en la última cuota para que la suma sea siempre
 * exacta al monto original.
 */
export function generarCuotas(
  montoObligacion: number,
  numeroCuotas: number,
  fechaInicio: string
): CuotaInput[] {
  const n = Math.max(1, Math.floor(numeroCuotas));
  if (n === 1) {
    return [
      { numero_cuota: 1, monto: r2(montoObligacion), fecha_vencimiento: fechaInicio },
    ];
  }
  const base = Math.floor((montoObligacion / n) * 100) / 100;
  const cuotas: CuotaInput[] = [];
  let acumulado = 0;
  for (let i = 0; i < n; i++) {
    const esUltima = i === n - 1;
    const monto = esUltima ? r2(montoObligacion - acumulado) : base;
    acumulado = r2(acumulado + monto);
    cuotas.push({
      numero_cuota: i + 1,
      monto,
      fecha_vencimiento: sumarMeses(fechaInicio, i),
    });
  }
  return cuotas;
}

/**
 * Valida el reparto completo de un gasto antes de guardarlo: responsables
 * sin repetir, un solo tipo de monto por gasto, la suma correcta (100% o el
 * total del gasto), y que las cuotas de cada obligación sumen su monto.
 */
export function validarReparto(
  filas: FilaObligacion[],
  montoTotalGasto: number
): string | null {
  if (filas.length === 0) return "Debe existir al menos un responsable.";

  const responsables = new Set(filas.map((f) => f.responsable));
  if (responsables.size !== filas.length)
    return "No puede repetirse el mismo responsable.";

  const tipos = new Set(filas.map((f) => f.tipo_monto));
  if (tipos.size > 1)
    return "No se puede mezclar porcentaje y monto fijo en el mismo gasto.";

  const tipo = filas[0].tipo_monto;
  const suma = r2(filas.reduce((s, f) => s + f.valor, 0));
  if (tipo === "porcentaje") {
    if (Math.abs(suma - 100) > 0.01)
      return `Los porcentajes deben sumar 100% (suma actual: ${suma}%).`;
  } else if (Math.abs(suma - montoTotalGasto) > 0.01) {
    return `Los montos deben sumar el total del gasto ($${montoTotalGasto}).`;
  }

  for (const f of filas) {
    if (f.cuotas.length === 0)
      return `${f.responsable} debe tener al menos una cuota.`;
    const montoObligacion = resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor);
    const sumaCuotas = r2(f.cuotas.reduce((s, c) => s + c.monto, 0));
    if (Math.abs(sumaCuotas - montoObligacion) > 0.01)
      return `Las cuotas de ${f.responsable} deben sumar $${montoObligacion}.`;
  }
  return null;
}

/**
 * Estado agregado de un gasto según el compromiso de sus cuotas: "libre" si
 * ninguna está pagada/liquidada (se puede editar todo), "total" si todas lo
 * están, "parcial" en el resto (solo cabecera no monetaria y cuotas sueltas
 * editables).
 */
export function estadoComprometido(
  obligaciones: ObligacionConCuotasEstado[]
): "libre" | "parcial" | "total" {
  const cuotas = obligaciones.flatMap((o) => o.cuotas);
  if (cuotas.length === 0) return "libre";
  const comprometidas = cuotas.filter(
    (c) => c.liquidacion_id != null || c.estado === "pagado"
  );
  if (comprometidas.length === 0) return "libre";
  if (comprometidas.length === cuotas.length) return "total";
  return "parcial";
}
