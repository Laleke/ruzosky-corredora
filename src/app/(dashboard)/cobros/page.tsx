import Link from "next/link";
import { AlertTriangle, Eye, FileText, Info } from "lucide-react";
import {
  listCargos,
  listContratosSinArriendo,
  periodoArriendoVigente,
  debeAvisarGeneracionAsistida,
  listContratosConDesfazadoPendiente,
} from "@/features/cobros/queries";
import { listContratosConReajustePendiente } from "@/features/contratos/queries";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { solicitudesPendientes } from "@/features/solicitudes-pago/queries";
import { GenerarArriendos } from "@/features/cobros/generar-arriendos";
import { FiltroCobros } from "@/features/cobros/filtro-cobros";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import type { FiltrosCargos, CargoConContexto } from "@/features/cobros/types";

type SP = {
  propiedad?: string;
  arrendatario?: string;
  estado?: string;
  periodo?: string;
  venceDesde?: string;
  venceHasta?: string;
};

function monto(n: number): string {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

function estadoMostrar(
  estado: string,
  saldo: number,
  fechaVencimiento: string | null,
  hoy: string
): { label: string; tone: Parameters<typeof badge>[0] } {
  if (estado === "pagado") return { label: "Pagado", tone: "success" };
  if (saldo > 0 && fechaVencimiento && fechaVencimiento < hoy) {
    return { label: "Vencido", tone: "danger" };
  }
  if (estado === "parcial") return { label: "Parcial", tone: "neutral" };
  return { label: "Pendiente", tone: "neutral" };
}

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filtros: FiltrosCargos = {
    propiedadId: sp.propiedad,
    arrendatarioId: sp.arrendatario,
    estado: sp.estado as FiltrosCargos["estado"],
    periodo: sp.periodo,
    venceDesde: sp.venceDesde,
    venceHasta: sp.venceHasta,
  };

  // El arriendo se paga por adelantado: el período a generar es el próximo, no el actual.
  const periodoActual = periodoArriendoVigente();
  // Antes del día 21 todavía hay tiempo de sobra para generar el arriendo
  // del mes siguiente — no se avisa ni se ofrece la generación asistida.
  const avisarGeneracion = debeAvisarGeneracionAsistida();
  const [cargos, opciones, sinArriendo, reajustesPendientes, solicitudes, desfazadosPendientes] =
    await Promise.all([
      listCargos(filtros),
      getOpcionesRelacion(),
      avisarGeneracion ? listContratosSinArriendo(`${periodoActual}-01`) : Promise.resolve([]),
      listContratosConReajustePendiente(),
      solicitudesPendientes(),
      listContratosConDesfazadoPendiente(),
    ]);
  const hoy = new Date().toISOString().slice(0, 10);
  const deudaTotal = cargos.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);
  const hayFiltros = Boolean(
    sp.propiedad || sp.arrendatario || sp.estado || sp.periodo || sp.venceDesde || sp.venceHasta
  );

  return (
    <div>
      <PageHeader
        titulo="Cobros y pagos"
        descripcion="Cargos generados, saldos y morosidad."
        accion={{ href: "/cobros/nuevo", label: "Nuevo cargo" }}
      />

      {solicitudes.length > 0 && (
        <Link
          href="/cobros/solicitudes"
          className="mb-5 flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
        >
          <AlertTriangle size={16} />
          {solicitudes.length} solicitud{solicitudes.length === 1 ? "" : "es"} de pago pendiente
          {solicitudes.length === 1 ? "" : "s"} de revisar
        </Link>
      )}

      {deudaTotal > 0 && (
        <Link
          href="/cobros/estados-cuenta"
          className="mb-5 flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-canvas-fg transition-colors hover:bg-white/20"
        >
          <FileText size={16} />
          Estados de cuenta — enviar informe de cobranza por WhatsApp
        </Link>
      )}

      <FiltroCobros
        valores={sp}
        propiedades={opciones.propiedades}
        arrendatarios={opciones.arrendatarios}
        hayFiltros={hayFiltros}
      />

      {!hayFiltros && (
        <p className="mb-5 text-xs text-canvas-muted">
          Mostrando los últimos 12 meses más toda la deuda pendiente, sin importar su antigüedad.
          Para cargos anteriores a eso, usa el filtro de Período.
        </p>
      )}

      {reajustesPendientes.length > 0 && (
        <div className="mb-5 rounded-xl bg-burgundy p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {reajustesPendientes.length} contrato{reajustesPendientes.length === 1 ? "" : "s"} con
              reajuste pendiente de revisar — antes de generar, confirma si corresponde aplicarlo o
              postergarlo
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-white/15 text-sm text-white">
            {reajustesPendientes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {c.propiedad_direccion} · corresponde desde {formatearFecha(c.fecha_proximo_reajuste)}
                </span>
                <Link href={`/contratos/${c.id}`} className="font-medium text-white/80 hover:text-white">
                  Revisar
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {desfazadosPendientes.length > 0 && (
        <div className="mb-5 rounded-xl bg-burgundy p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {desfazadosPendientes.length} contrato{desfazadosPendientes.length === 1 ? "" : "s"}{" "}
              terminado{desfazadosPendientes.length === 1 ? "" : "s"} con cargo desfazado (luz/GGCC/
              etc.) sin generar — revisar antes de devolver la garantía
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-white/15 text-sm text-white">
            {desfazadosPendientes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {c.propiedad_direccion} · terminó el {formatearFecha(c.fecha_termino)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sinArriendo.length > 0 && (
        <div className="mb-5 rounded-xl bg-burgundy p-5">
          <div className="mb-3 flex items-center gap-2 text-amber-300">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {sinArriendo.length} contrato{sinArriendo.length === 1 ? "" : "s"} sin arriendo
              generado · {formatearPeriodo(periodoActual)}
            </h2>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/60">Propiedades</p>
              <p className="font-semibold text-white">{sinArriendo.length} Activas</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Deuda Pendiente</p>
              <p className="font-semibold text-white">
                {monto(sinArriendo.reduce((acc, c) => acc + c.monto, 0))}
              </p>
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-white/15 text-sm text-white">
            {sinArriendo.map((c) => (
              <li key={c.contratoId} className="flex items-center justify-between gap-3 py-2">
                <span>{c.label}</span>
                <span className="text-white/70">{monto(c.monto)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sinArriendo.length > 0 && (
        <div className="mb-6 rounded-xl bg-burgundy p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Generación asistida</h2>
          <GenerarArriendos periodoDefault={periodoActual} />
        </div>
      )}

      {cargos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {Object.values(sp).some(Boolean)
            ? "No hay cargos con esos filtros."
            : "Aún no hay cargos. Genera los del mes o crea uno."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {agruparPorPeriodo(cargos).map(([periodo, items]) => {
            const deudaVencidaPeriodo = items.reduce(
              (acc, c) =>
                Number(c.saldo_pendiente) > 0 && c.fecha_vencimiento && c.fecha_vencimiento < hoy
                  ? acc + Number(c.saldo_pendiente)
                  : acc,
              0
            );
            const pagadoPeriodo = items.reduce(
              (acc, c) => acc + (Number(c.monto) - Number(c.saldo_pendiente)),
              0
            );
            return (
              <details key={periodo} className="rounded-xl bg-burgundy overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-white">{formatearPeriodo(periodo)}</span>
                  <span
                    className={`flex items-center gap-2 ${
                      deudaVencidaPeriodo === 0 ? "text-emerald-400" : "text-white/70"
                    }`}
                  >
                    {deudaVencidaPeriodo === 0
                      ? `Deuda pagada: ${monto(pagadoPeriodo)}`
                      : `Deuda vencida: ${monto(deudaVencidaPeriodo)}`}
                  </span>
                </summary>
                <div className="flex flex-col divide-y-2 divide-white/20 px-5 pb-5">
                  {items.map((c) => {
                    const est = estadoMostrar(c.estado, Number(c.saldo_pendiente), c.fecha_vencimiento, hoy);
                    const sinDeuda = Number(c.saldo_pendiente) === 0;
                    return (
                      <div
                        key={c.id}
                        className={`flex flex-col gap-3 py-4 first:pt-0 ${sinDeuda ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-white/60">{c.propiedad_direccion}</p>
                            <p className="font-medium text-white">
                              {etiquetaTipoCargo(c.tipo_cargo)}
                            </p>
                          </div>
                          <span className={badge(est.tone)}>{est.label}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <details className="group min-w-0 flex-1">
                            <summary className={ui.listCardDisclosure}>
                              <Info size={14} />
                              <span className="group-open:hidden">Ver más información</span>
                              <span className="hidden group-open:inline">Ocultar información</span>
                            </summary>
                            <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                              <span>Deuda pendiente: {monto(c.saldo_pendiente)}</span>
                              {Number(c.monto) - Number(c.saldo_pendiente) > 0 && (
                                <span className="text-emerald-400">
                                  Pagado: {monto(Number(c.monto) - Number(c.saldo_pendiente))}
                                </span>
                              )}
                              <div className="my-1 border-t border-white/10" />
                              {c.fecha_vencimiento && <span>Vence: {formatearFecha(c.fecha_vencimiento)}</span>}
                              {(c.fecha_consumo_desde || c.fecha_consumo_hasta) && (
                                <span>
                                  Consumo: {formatearFecha(c.fecha_consumo_desde)} –{" "}
                                  {formatearFecha(c.fecha_consumo_hasta)}
                                </span>
                              )}
                            </div>
                          </details>

                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/cobros/${c.id}`}
                              aria-label="Ver detalle"
                              title="Ver detalle"
                              className={ui.listCardIconBtn}
                            >
                              <Eye size={16} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Agrupa cargos por período (mes/año), más reciente primero. */
function agruparPorPeriodo(cargos: CargoConContexto[]): [string, CargoConContexto[]][] {
  const grupos = new Map<string, CargoConContexto[]>();
  for (const c of cargos) {
    const key = c.periodo.slice(0, 7);
    const lista = grupos.get(key);
    if (lista) lista.push(c);
    else grupos.set(key, [c]);
  }
  return [...grupos.entries()].sort(([a], [b]) => b.localeCompare(a));
}
