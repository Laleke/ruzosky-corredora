"use client";

import {
  Wallet,
  Percent,
  Clock,
  FileText,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  Home,
  FileSpreadsheet,
  FileDown,
  Printer,
} from "lucide-react";
import { ui } from "@/components/ui";
import { BarChart, LineChart, PieChart, GroupedBars, PALETA } from "@/components/charts";
import { exportarCSV, exportarExcel, exportarPDF, type TablaExport } from "./export";
import { MESES, type ReporteFinanciero } from "./types";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function Kpi({
  icon: Icon,
  label,
  valor,
  sub,
  alerta,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  valor: string;
  sub?: string;
  alerta?: boolean;
}) {
  return (
    <div className={`${ui.card} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            alerta ? "bg-amber-50 text-amber-600" : "bg-burgundy-50 text-burgundy"
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{valor}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Panel({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${ui.card} p-5`}>
      <h3 className="mb-4 text-sm font-semibold text-ink">{titulo}</h3>
      {children}
    </div>
  );
}

export function ReportesDashboard({
  reporte,
  etiquetaFiltro,
}: {
  reporte: ReporteFinanciero;
  etiquetaFiltro: string;
}) {
  const { kpis, series, gastosPorCategoria, gastosPorPropiedad, rentabilidadPropietario, comparativoAnual, filtros } =
    reporte;
  const [prev, actual] = comparativoAnual;

  function tablasExport(): TablaExport[] {
    return [
      {
        titulo: `Resumen ${filtros.anio} — ${etiquetaFiltro}`,
        headers: ["Indicador", "Valor"],
        filas: [
          ["Ingresos por arriendo", kpis.ingresosArriendo],
          ["Comisiones cobradas", kpis.comisionesCobradas],
          ["Comisiones pendientes", kpis.comisionesPendientes],
          ["Gastos", kpis.gastosTotal],
          ["Liquidaciones emitidas (monto)", kpis.liquidacionesEmitidasMonto],
          ["Liquidaciones emitidas (N°)", kpis.liquidacionesEmitidasCount],
          ["Liquidaciones pagadas (monto)", kpis.liquidacionesPagadasMonto],
          ["Liquidaciones pagadas (N°)", kpis.liquidacionesPagadasCount],
          ["Cobros pendientes", kpis.cobrosPendientes],
          ["Mora (monto)", kpis.moraMonto],
          ["Mora (N° cargos)", kpis.moraCount],
          ["Vacancia (%)", kpis.vacanciaPct],
        ],
      },
      {
        titulo: "Serie mensual",
        headers: ["Mes", "Ingresos", "Comisiones", "Gastos", "Liquidaciones"],
        filas: MESES.map((m, i) => [
          m,
          series.ingresosMensual[i],
          series.comisionesMensual[i],
          series.gastosMensual[i],
          series.liquidacionesMensual[i],
        ]),
      },
      {
        titulo: "Comparativo anual",
        headers: ["Año", "Ingresos", "Comisiones", "Gastos", "Liquidaciones"],
        filas: comparativoAnual.map((c) => [
          c.anio,
          c.ingresos,
          c.comisiones,
          c.gastos,
          c.liquidaciones,
        ]),
      },
      {
        titulo: "Rentabilidad por propietario",
        headers: ["Propietario", "Ingresos", "Comisiones", "Gastos", "Rentabilidad"],
        filas: rentabilidadPropietario.map((r) => [
          r.propietario,
          r.ingresos,
          r.comisiones,
          r.gastos,
          r.rentabilidad,
        ]),
      },
      {
        titulo: "Gastos por propiedad",
        headers: ["Propiedad", "Monto"],
        filas: gastosPorPropiedad.map((g) => [g.propiedad, g.monto]),
      },
      {
        titulo: "Gastos por categoría",
        headers: ["Categoría", "Monto"],
        filas: gastosPorCategoria.map((g) => [g.label, g.valor]),
      },
    ];
  }

  const nombreArchivo = `reporte-financiero-${filtros.anio}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Exportación */}
      <div className="no-print flex flex-wrap justify-end gap-2">
        <button
          onClick={() => exportarExcel(tablasExport(), nombreArchivo)}
          className={ui.btnSecondary}
        >
          <FileSpreadsheet size={16} /> Excel
        </button>
        <button
          onClick={() => exportarCSV(tablasExport(), nombreArchivo)}
          className={ui.btnSecondary}
        >
          <FileDown size={16} /> CSV
        </button>
        <button onClick={exportarPDF} className={ui.btnSecondary}>
          <Printer size={16} /> PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Ingresos por arriendo" valor={clp(kpis.ingresosArriendo)} />
        <Kpi icon={Percent} label="Comisiones cobradas" valor={clp(kpis.comisionesCobradas)} />
        <Kpi icon={Clock} label="Comisiones pendientes" valor={clp(kpis.comisionesPendientes)} />
        <Kpi icon={TrendingDown} label="Gastos" valor={clp(kpis.gastosTotal)} />
        <Kpi
          icon={FileText}
          label="Liquidaciones emitidas"
          valor={clp(kpis.liquidacionesEmitidasMonto)}
          sub={`${kpis.liquidacionesEmitidasCount} liquidación(es)`}
        />
        <Kpi
          icon={CheckCircle2}
          label="Liquidaciones pagadas"
          valor={clp(kpis.liquidacionesPagadasMonto)}
          sub={`${kpis.liquidacionesPagadasCount} pagada(s)`}
        />
        <Kpi icon={Wallet} label="Cobros pendientes" valor={clp(kpis.cobrosPendientes)} />
        <Kpi
          icon={AlertTriangle}
          label="Mora"
          valor={clp(kpis.moraMonto)}
          sub={`${kpis.moraCount} cargo(s) vencido(s)`}
          alerta={kpis.moraCount > 0}
        />
        <Kpi
          icon={Home}
          label="Vacancia"
          valor={`${kpis.vacanciaPct}%`}
          sub={`${kpis.propiedadesArrendadas}/${kpis.propiedadesActivas} arrendadas`}
          alerta={kpis.vacanciaPct >= 30}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel titulo={`Ingresos por arriendo — ${filtros.anio}`}>
          <BarChart labels={MESES} valores={series.ingresosMensual} />
        </Panel>
        <Panel titulo="Comparativo mensual">
          <LineChart
            labels={MESES}
            series={[
              { nombre: "Ingresos", valores: series.ingresosMensual, color: PALETA[0] },
              { nombre: "Gastos", valores: series.gastosMensual, color: PALETA[1] },
              { nombre: "Comisiones", valores: series.comisionesMensual, color: PALETA[2] },
            ]}
          />
        </Panel>
        <Panel titulo={`Comparativo anual — ${prev.anio} vs ${actual.anio}`}>
          <GroupedBars
            grupos={["Ingresos", "Comisiones", "Gastos", "Liquidaciones"]}
            series={[
              {
                nombre: String(prev.anio),
                valores: [prev.ingresos, prev.comisiones, prev.gastos, prev.liquidaciones],
                color: PALETA[7],
              },
              {
                nombre: String(actual.anio),
                valores: [actual.ingresos, actual.comisiones, actual.gastos, actual.liquidaciones],
                color: PALETA[0],
              },
            ]}
          />
        </Panel>
        <Panel titulo="Gastos por categoría">
          <PieChart data={gastosPorCategoria} />
        </Panel>
      </div>

      {/* Tablas */}
      <Panel titulo="Rentabilidad por propietario">
        {rentabilidadPropietario.length === 0 ? (
          <p className="text-sm text-muted">Sin datos en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr>
                  <th className={ui.th}>Propietario</th>
                  <th className={`${ui.th} text-right`}>Ingresos</th>
                  <th className={`${ui.th} text-right`}>Comisiones</th>
                  <th className={`${ui.th} text-right`}>Gastos</th>
                  <th className={`${ui.th} text-right`}>Rentabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rentabilidadPropietario.map((r) => (
                  <tr key={r.propietario_id}>
                    <td className={`${ui.td} font-medium`}>{r.propietario}</td>
                    <td className={`${ui.td} text-right`}>{clp(r.ingresos)}</td>
                    <td className={`${ui.td} text-right text-muted`}>− {clp(r.comisiones)}</td>
                    <td className={`${ui.td} text-right text-muted`}>− {clp(r.gastos)}</td>
                    <td
                      className={`${ui.td} text-right font-semibold ${
                        r.rentabilidad < 0 ? "text-red-600" : "text-ink"
                      }`}
                    >
                      {clp(r.rentabilidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel titulo="Gastos por propiedad">
        {gastosPorPropiedad.length === 0 ? (
          <p className="text-sm text-muted">Sin gastos en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr>
                  <th className={ui.th}>Propiedad</th>
                  <th className={`${ui.th} text-right`}>Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gastosPorPropiedad.map((g) => (
                  <tr key={g.propiedad_id}>
                    <td className={`${ui.td} font-medium`}>{g.propiedad}</td>
                    <td className={`${ui.td} text-right`}>{clp(g.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
