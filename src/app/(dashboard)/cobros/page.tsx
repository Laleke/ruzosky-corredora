import Link from "next/link";
import { AlertTriangle, Eye, Info } from "lucide-react";
import {
  listCargos,
  listContratosSinArriendo,
  periodoArriendoVigente,
  debeAvisarGeneracionAsistida,
  listContratosConDesfazadoPendiente,
} from "@/features/cobros/queries";
import { listContratosConReajustePendiente } from "@/features/contratos/queries";
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

const TIPO_LABEL: Record<string, string> = {
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

      <FiltroCobros
        valores={sp}
        propiedades={opciones.propiedades}
        arrendatarios={opciones.arrendatarios}
        hayFiltros={hayFiltros}
      />

      {!hayFiltros && (
        <p className="mb-5 text-xs text-canvas-muted">
          Mostrando deuda viva (pendiente/parcial/vencida) más el período actual. Para ver cargos
          pagados de otros períodos, usa los filtros de Estado o Período.
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
            const deudaPeriodo = items.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);
            return (
              <details key={periodo} className="rounded-xl bg-burgundy overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-white">{formatearPeriodo(periodo)}</span>
                  <span className="flex items-center gap-2 text-white/70">
                    Deuda pendiente: {monto(deudaPeriodo)}
                  </span>
                </summary>
                <div className="flex flex-col divide-y divide-white/10 px-5 pb-5">
                  {items.map((c) => {
                    const est = estadoMostrar(c.estado, Number(c.saldo_pendiente), c.fecha_vencimiento, hoy);
                    return (
                      <div key={c.id} className="flex flex-col gap-3 py-4 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-white/60">
                              {TIPO_LABEL[c.tipo_cargo] ?? c.tipo_cargo}
                            </p>
                            <p className="font-medium text-white">
                              {c.numero_contrato ? `${c.numero_contrato} · ` : ""}
                              {c.propiedad_direccion}
                            </p>
                          </div>
                          <span className={badge(est.tone)}>{est.label}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <details className="min-w-0 flex-1">
                            <summary className={ui.listCardDisclosure}>
                              <Info size={14} /> Ver más información
                            </summary>
                            <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                              <span>Deuda pendiente: {monto(c.saldo_pendiente)}</span>
                              <span>Monto: {monto(c.monto)}</span>
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
