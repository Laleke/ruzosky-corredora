export type FiltrosReporte = {
  anio: number;
  propiedadId?: string;
  propietarioId?: string;
};

export type OpcionReporte = { id: string; label: string };

/** Punto de una serie mensual (12 meses). */
export type SerieMensual = number[]; // longitud 12, índice 0 = enero

export type FilaRentabilidad = {
  propietario_id: string;
  propietario: string;
  ingresos: number;
  comisiones: number;
  gastos: number;
  rentabilidad: number;
};

export type FilaGastoPropiedad = {
  propiedad_id: string;
  propiedad: string;
  monto: number;
};

export type Distribucion = { label: string; valor: number };

export type ComparativoAnual = {
  anio: number;
  ingresos: number;
  comisiones: number;
  gastos: number;
  liquidaciones: number;
};

export type ReporteFinanciero = {
  filtros: FiltrosReporte;
  kpis: {
    ingresosArriendo: number;
    comisionesCobradas: number;
    comisionesPendientes: number;
    liquidacionesEmitidasMonto: number;
    liquidacionesEmitidasCount: number;
    liquidacionesPagadasMonto: number;
    liquidacionesPagadasCount: number;
    gastosTotal: number;
    cobrosPendientes: number;
    moraMonto: number;
    moraCount: number;
    vacanciaPct: number;
    propiedadesActivas: number;
    propiedadesArrendadas: number;
  };
  series: {
    ingresosMensual: SerieMensual;
    comisionesMensual: SerieMensual;
    gastosMensual: SerieMensual;
    liquidacionesMensual: SerieMensual;
  };
  gastosPorCategoria: Distribucion[];
  gastosPorPropiedad: FilaGastoPropiedad[];
  rentabilidadPropietario: FilaRentabilidad[];
  comparativoAnual: ComparativoAnual[];
};

export const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
