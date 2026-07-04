import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import { CATEGORIA_GASTO_LABEL } from "@/features/gastos/constants";
import type {
  FiltrosReporte,
  ReporteFinanciero,
  OpcionReporte,
  SerieMensual,
  FilaRentabilidad,
  ComparativoAnual,
} from "./types";

/* ------------------------------------------------------------------ *
 * Capa de reportes financieros.
 * Se calcula sobre datos primarios (pagos, cargos, contratos, gastos,
 * propiedades). Las liquidaciones solo alimentan los reportes que son
 * literalmente sobre liquidaciones (emitidas/pagadas). Así se evita el
 * doble conteo y las series mensuales son consistentes aunque no se hayan
 * generado liquidaciones. Todo queda acotado al tenant por RLS.
 *
 * Convenciones de comisión (derivadas de la config del contrato):
 *  - Administración: mensual. % sobre arriendo, o monto fijo prorrateado al
 *    arriendo efectivamente cubierto.
 *  - Corretaje: única. % sobre canon o monto fijo; se realiza en el mes de
 *    inicio del contrato cuando queda liquidado.
 * ------------------------------------------------------------------ */

type ContratoRow = {
  id: string;
  propiedad_id: string;
  canon_monto: number;
  cobra_administracion: boolean;
  administracion_monto: number | null;
  administracion_porcentaje: number | null;
  tipo_comision: string | null;
  comision_monto: number | null;
  corretaje_liquidado: boolean;
  fecha_inicio: string;
  activo: boolean;
};

function serie(): SerieMensual {
  return Array(12).fill(0);
}
function anioDe(fecha: string): number {
  return parseInt(fecha.slice(0, 4), 10);
}
function mesDe(fecha: string): number {
  return parseInt(fecha.slice(5, 7), 10) - 1;
}
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function comisionAdmin(base: number, c: ContratoRow): number {
  if (!c.cobra_administracion) return 0;
  if (c.administracion_porcentaje != null)
    return (base * Number(c.administracion_porcentaje)) / 100;
  const canon = Number(c.canon_monto) || 0;
  const fijo = Number(c.administracion_monto ?? 0);
  if (canon <= 0) return fijo;
  return fijo * Math.min(1, base / canon);
}
function comisionCorretaje(c: ContratoRow): number {
  if (!c.tipo_comision) return 0;
  return c.tipo_comision === "porcentaje"
    ? (Number(c.canon_monto) * Number(c.comision_monto ?? 0)) / 100
    : Number(c.comision_monto ?? 0);
}

function nombrePersona(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

export async function getReporteFinanciero(
  filtros: FiltrosReporte
): Promise<ReporteFinanciero> {
  const supabase = await createClient();
  const Y = filtros.anio;
  const desde = `${Y - 1}-01-01`; // incluye año previo para el comparativo
  const hasta = `${Y}-12-31`;
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    contratosRes,
    propiedadesRes,
    ppRes,
    propietariosRes,
    pagosRes,
    cargosRes,
    liquidacionesRes,
    gastosRes,
  ] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "id, propiedad_id, canon_monto, cobra_administracion, administracion_monto, administracion_porcentaje, tipo_comision, comision_monto, corretaje_liquidado, fecha_inicio, activo"
      ),
    supabase
      .from("propiedades")
      .select("id, estado, codigo_interno, direccion, numero, departamento")
      .eq("activo", true),
    supabase
      .from("propietarios_propiedades")
      .select("propiedad_id, propietario_id, porcentaje_participacion"),
    supabase
      .from("propietarios")
      .select("id, tipo_persona, nombre, apellido, razon_social"),
    supabase
      .from("pagos")
      .select("monto_pagado, fecha_pago, cargos(tipo_cargo, contrato_id)")
      .gte("fecha_pago", desde)
      .lte("fecha_pago", hasta),
    supabase
      .from("cargos")
      .select("contrato_id, tipo_cargo, saldo_pendiente, fecha_vencimiento")
      .gt("saldo_pendiente", 0),
    supabase
      .from("liquidaciones")
      .select("periodo, estado, total_liquidacion, propietario_id")
      .gte("periodo", desde)
      .lte("periodo", hasta)
      .neq("estado", "anulada"),
    supabase
      .from("gastos")
      .select(
        "monto, fecha, categoria, propiedad_id, responsable_pago, descontar_de_liquidacion"
      )
      .neq("estado", "anulado")
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  const contratos = (contratosRes.data ?? []) as unknown as ContratoRow[];
  const contratoPorId = new Map(contratos.map((c) => [c.id, c]));

  // ---- Conjunto de propiedades según filtros ----
  const pps = (ppRes.data ?? []) as {
    propiedad_id: string;
    propietario_id: string;
    porcentaje_participacion: number;
  }[];

  let propiedadSet: Set<string> | null = null;
  if (filtros.propiedadId) {
    propiedadSet = new Set([filtros.propiedadId]);
  } else if (filtros.propietarioId) {
    propiedadSet = new Set(
      pps
        .filter((p) => p.propietario_id === filtros.propietarioId)
        .map((p) => p.propiedad_id)
    );
  }
  const enPropiedad = (id: string | null | undefined) =>
    !propiedadSet || (id != null && propiedadSet.has(id));
  const enContrato = (contratoId: string | null | undefined) => {
    if (!propiedadSet) return true;
    if (!contratoId) return false;
    const c = contratoPorId.get(contratoId);
    return c ? propiedadSet.has(c.propiedad_id) : false;
  };

  // ---- Series mensuales (año Y) y comparativo (Y-1) ----
  const ingresosMensual = serie();
  const comisionesMensual = serie();
  const gastosMensual = serie();
  const liquidacionesMensual = serie();

  const comp: Record<number, ComparativoAnual> = {
    [Y - 1]: { anio: Y - 1, ingresos: 0, comisiones: 0, gastos: 0, liquidaciones: 0 },
    [Y]: { anio: Y, ingresos: 0, comisiones: 0, gastos: 0, liquidaciones: 0 },
  };

  // Mapas auxiliares para rentabilidad por propietario (año Y).
  const arriendoPagadoPropiedadY = new Map<string, number>();
  const arriendoPagadoContratoY = new Map<string, number>();

  // ---- Pagos (ingresos + comisión administración cobrada) ----
  type PagoRow = {
    monto_pagado: number;
    fecha_pago: string;
    cargos: { tipo_cargo: string; contrato_id: string } | null;
  };
  for (const p of (pagosRes.data ?? []) as unknown as PagoRow[]) {
    const cargo = p.cargos;
    if (!cargo || cargo.tipo_cargo !== "arriendo") continue;
    if (!enContrato(cargo.contrato_id)) continue;
    const monto = Number(p.monto_pagado);
    const y = anioDe(p.fecha_pago);
    const m = mesDe(p.fecha_pago);
    const contrato = contratoPorId.get(cargo.contrato_id);
    const admin = contrato ? comisionAdmin(monto, contrato) : 0;

    if (y === Y || y === Y - 1) {
      comp[y].ingresos += monto;
      comp[y].comisiones += admin;
    }
    if (y === Y) {
      ingresosMensual[m] += monto;
      comisionesMensual[m] += admin;
      if (contrato) {
        arriendoPagadoPropiedadY.set(
          contrato.propiedad_id,
          (arriendoPagadoPropiedadY.get(contrato.propiedad_id) ?? 0) + monto
        );
        arriendoPagadoContratoY.set(
          contrato.id,
          (arriendoPagadoContratoY.get(contrato.id) ?? 0) + monto
        );
      }
    }
  }

  // ---- Corretaje cobrado (mes de inicio del contrato, si liquidado) ----
  for (const c of contratos) {
    if (!enPropiedad(c.propiedad_id)) continue;
    if (!c.corretaje_liquidado || !c.tipo_comision) continue;
    const y = anioDe(c.fecha_inicio);
    if (y !== Y && y !== Y - 1) continue;
    const monto = comisionCorretaje(c);
    comp[y].comisiones += monto;
    if (y === Y) comisionesMensual[mesDe(c.fecha_inicio)] += monto;
  }

  // ---- Gastos (por mes, categoría, propiedad; comparativo) ----
  type GastoRow = {
    monto: number;
    fecha: string;
    categoria: string;
    propiedad_id: string;
    responsable_pago: string;
    descontar_de_liquidacion: boolean;
  };
  const gastosPorCategoriaMap = new Map<string, number>();
  const gastosPorPropiedadMap = new Map<string, number>();
  const gastosPropietarioPropiedadY = new Map<string, number>(); // solo gastos que asume el dueño

  for (const g of (gastosRes.data ?? []) as unknown as GastoRow[]) {
    if (!enPropiedad(g.propiedad_id)) continue;
    const monto = Number(g.monto);
    const y = anioDe(g.fecha);
    if (y === Y || y === Y - 1) comp[y].gastos += monto;
    if (y === Y) {
      gastosMensual[mesDe(g.fecha)] += monto;
      gastosPorCategoriaMap.set(
        g.categoria,
        (gastosPorCategoriaMap.get(g.categoria) ?? 0) + monto
      );
      gastosPorPropiedadMap.set(
        g.propiedad_id,
        (gastosPorPropiedadMap.get(g.propiedad_id) ?? 0) + monto
      );
      // Solo el gasto que asume el propietario afecta su rentabilidad.
      if (g.responsable_pago === "propietario" || g.descontar_de_liquidacion) {
        gastosPropietarioPropiedadY.set(
          g.propiedad_id,
          (gastosPropietarioPropiedadY.get(g.propiedad_id) ?? 0) + monto
        );
      }
    }
  }

  // ---- Liquidaciones (emitidas / pagadas / comparativo) ----
  type LiqRow = {
    periodo: string;
    estado: string;
    total_liquidacion: number;
    propietario_id: string;
  };
  let liqEmitidasMonto = 0;
  let liqEmitidasCount = 0;
  let liqPagadasMonto = 0;
  let liqPagadasCount = 0;
  for (const l of (liquidacionesRes.data ?? []) as unknown as LiqRow[]) {
    if (filtros.propietarioId && l.propietario_id !== filtros.propietarioId)
      continue;
    const y = anioDe(l.periodo);
    const total = Number(l.total_liquidacion);
    if (y === Y || y === Y - 1) comp[y].liquidaciones += total;
    if (y === Y) {
      liquidacionesMensual[mesDe(l.periodo)] += total;
      liqEmitidasMonto += total;
      liqEmitidasCount += 1;
      if (l.estado === "pagada") {
        liqPagadasMonto += total;
        liqPagadasCount += 1;
      }
    }
  }

  // ---- Cargos con saldo (cobros pendientes, mora, comisión pendiente) ----
  type CargoRow = {
    contrato_id: string;
    tipo_cargo: string;
    saldo_pendiente: number;
    fecha_vencimiento: string | null;
  };
  let cobrosPendientes = 0;
  let moraMonto = 0;
  let moraCount = 0;
  let comisionesPendientes = 0;
  for (const c of (cargosRes.data ?? []) as unknown as CargoRow[]) {
    if (!enContrato(c.contrato_id)) continue;
    const saldo = Number(c.saldo_pendiente);
    cobrosPendientes += saldo;
    if (c.fecha_vencimiento && c.fecha_vencimiento < hoy) {
      moraMonto += saldo;
      moraCount += 1;
    }
    if (c.tipo_cargo === "arriendo") {
      const contrato = contratoPorId.get(c.contrato_id);
      if (contrato) comisionesPendientes += comisionAdmin(saldo, contrato);
    }
  }
  // Corretaje aún no liquidado en contratos activos del conjunto.
  for (const c of contratos) {
    if (!c.activo || c.corretaje_liquidado || !c.tipo_comision) continue;
    if (!enPropiedad(c.propiedad_id)) continue;
    comisionesPendientes += comisionCorretaje(c);
  }

  // ---- Vacancia ----
  const propiedades = (propiedadesRes.data ?? []) as {
    id: string;
    estado: string;
    codigo_interno: string | null;
    direccion: string | null;
    numero: string | null;
    departamento: string | null;
  }[];
  const propiedadesFiltradas = propiedades.filter((p) => enPropiedad(p.id));
  const propiedadesActivas = propiedadesFiltradas.length;
  const propiedadesArrendadas = propiedadesFiltradas.filter(
    (p) => p.estado === "arrendada"
  ).length;
  const vacanciaPct =
    propiedadesActivas > 0
      ? r2(((propiedadesActivas - propiedadesArrendadas) / propiedadesActivas) * 100)
      : 0;

  // ---- Rentabilidad por propietario (año Y, ponderada por participación) ----
  const propietarios = (propietariosRes.data ?? []) as {
    id: string;
    tipo_persona: string;
    nombre: string | null;
    apellido: string | null;
    razon_social: string | null;
  }[];
  const nombrePorId = new Map(propietarios.map((p) => [p.id, nombrePersona(p)]));

  const rentaPorPropietario = new Map<string, FilaRentabilidad>();
  const asegura = (id: string): FilaRentabilidad => {
    let f = rentaPorPropietario.get(id);
    if (!f) {
      f = {
        propietario_id: id,
        propietario: nombrePorId.get(id) ?? "—",
        ingresos: 0,
        comisiones: 0,
        gastos: 0,
        rentabilidad: 0,
      };
      rentaPorPropietario.set(id, f);
    }
    return f;
  };
  // Contratos por propiedad para atribuir comisión de administración.
  const contratosPorPropiedad = new Map<string, ContratoRow[]>();
  for (const c of contratos) {
    const arr = contratosPorPropiedad.get(c.propiedad_id) ?? [];
    arr.push(c);
    contratosPorPropiedad.set(c.propiedad_id, arr);
  }
  for (const pp of pps) {
    if (filtros.propietarioId && pp.propietario_id !== filtros.propietarioId)
      continue;
    if (!enPropiedad(pp.propiedad_id)) continue;
    const pct = Number(pp.porcentaje_participacion) / 100;
    if (pct <= 0) continue;
    const fila = asegura(pp.propietario_id);

    const arriendoProp = arriendoPagadoPropiedadY.get(pp.propiedad_id) ?? 0;
    fila.ingresos += arriendoProp * pct;

    for (const c of contratosPorPropiedad.get(pp.propiedad_id) ?? []) {
      const arriendoContrato = arriendoPagadoContratoY.get(c.id) ?? 0;
      let comision = comisionAdmin(arriendoContrato, c);
      if (c.corretaje_liquidado && anioDe(c.fecha_inicio) === Y)
        comision += comisionCorretaje(c);
      fila.comisiones += comision * pct;
    }

    const gastoDueño = gastosPropietarioPropiedadY.get(pp.propiedad_id) ?? 0;
    fila.gastos += gastoDueño * pct;
  }
  const rentabilidadPropietario = [...rentaPorPropietario.values()]
    .map((f) => ({
      ...f,
      ingresos: r2(f.ingresos),
      comisiones: r2(f.comisiones),
      gastos: r2(f.gastos),
      rentabilidad: r2(f.ingresos - f.comisiones - f.gastos),
    }))
    .sort((a, b) => b.rentabilidad - a.rentabilidad);

  // ---- Distribuciones ----
  const propiedadLabel = new Map(
    propiedades.map((p) => [p.id, etiquetaPropiedad(p)])
  );
  const gastosPorCategoria = [...gastosPorCategoriaMap.entries()]
    .map(([cat, valor]) => ({
      label: CATEGORIA_GASTO_LABEL[cat as keyof typeof CATEGORIA_GASTO_LABEL] ?? cat,
      valor: r2(valor),
    }))
    .sort((a, b) => b.valor - a.valor);
  const gastosPorPropiedad = [...gastosPorPropiedadMap.entries()]
    .map(([id, monto]) => ({
      propiedad_id: id,
      propiedad: propiedadLabel.get(id) ?? "—",
      monto: r2(monto),
    }))
    .sort((a, b) => b.monto - a.monto);

  return {
    filtros,
    kpis: {
      ingresosArriendo: r2(comp[Y].ingresos),
      comisionesCobradas: r2(comp[Y].comisiones),
      comisionesPendientes: r2(comisionesPendientes),
      liquidacionesEmitidasMonto: r2(liqEmitidasMonto),
      liquidacionesEmitidasCount: liqEmitidasCount,
      liquidacionesPagadasMonto: r2(liqPagadasMonto),
      liquidacionesPagadasCount: liqPagadasCount,
      gastosTotal: r2(comp[Y].gastos),
      cobrosPendientes: r2(cobrosPendientes),
      moraMonto: r2(moraMonto),
      moraCount,
      vacanciaPct,
      propiedadesActivas,
      propiedadesArrendadas,
    },
    series: {
      ingresosMensual: ingresosMensual.map(r2),
      comisionesMensual: comisionesMensual.map(r2),
      gastosMensual: gastosMensual.map(r2),
      liquidacionesMensual: liquidacionesMensual.map(r2),
    },
    gastosPorCategoria,
    gastosPorPropiedad,
    rentabilidadPropietario,
    comparativoAnual: [comp[Y - 1], comp[Y]].map((c) => ({
      anio: c.anio,
      ingresos: r2(c.ingresos),
      comisiones: r2(c.comisiones),
      gastos: r2(c.gastos),
      liquidaciones: r2(c.liquidaciones),
    })),
  };
}

/** Opciones para los filtros (propiedades, propietarios, años). */
export async function getOpcionesReporte(): Promise<{
  propiedades: OpcionReporte[];
  propietarios: OpcionReporte[];
  anios: number[];
}> {
  const supabase = await createClient();
  const [propiedadesRes, propietariosRes] = await Promise.all([
    supabase
      .from("propiedades")
      .select("id, codigo_interno, direccion, numero, departamento")
      .eq("activo", true)
      .order("codigo_interno"),
    supabase
      .from("propietarios")
      .select("id, tipo_persona, nombre, apellido, razon_social")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const actual = new Date().getFullYear();
  const anios = [actual, actual - 1, actual - 2, actual - 3];

  return {
    propiedades: (propiedadesRes.data ?? []).map((p) => ({
      id: p.id,
      label: etiquetaPropiedad(p),
    })),
    propietarios: (propietariosRes.data ?? []).map((p) => ({
      id: p.id,
      label: nombrePersona(p),
    })),
    anios,
  };
}
