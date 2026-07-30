import Link from "next/link";
import { AlertTriangle, Eye, Info } from "lucide-react";
import { listCargos, listContratosSinArriendo } from "@/features/cobros/queries";
import { listContratosConReajustePendiente } from "@/features/contratos/queries";
import { GenerarArriendos } from "@/features/cobros/generar-arriendos";
import { FiltroCobros } from "@/features/cobros/filtro-cobros";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import type { FiltrosCargos } from "@/features/cobros/types";

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
  if (estado === "parcial") return { label: "Parcial", tone: "warning" };
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

  const periodoActual = new Date().toISOString().slice(0, 7);
  const [cargos, opciones, sinArriendo, reajustesPendientes] = await Promise.all([
    listCargos(filtros),
    getOpcionesRelacion(),
    listContratosSinArriendo(`${periodoActual}-01`),
    listContratosConReajustePendiente(),
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

      <FiltroCobros
        valores={sp}
        propiedades={opciones.propiedades}
        arrendatarios={opciones.arrendatarios}
        hayFiltros={hayFiltros}
      />

      {reajustesPendientes.length > 0 && (
        <div className={`${ui.card} mb-5 border-amber-200 bg-amber-50 p-5`}>
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {reajustesPendientes.length} contrato{reajustesPendientes.length === 1 ? "" : "s"} con
              reajuste pendiente de revisar — antes de generar, confirma si corresponde aplicarlo o
              postergarlo
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-amber-200/70 text-sm text-ink">
            {reajustesPendientes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {c.propiedad_direccion} · corresponde desde {c.fecha_proximo_reajuste}
                </span>
                <Link href={`/contratos/${c.id}`} className={ui.linkAction}>
                  Revisar
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sinArriendo.length > 0 && (
        <div className={`${ui.card} mb-5 border-amber-200 bg-amber-50 p-5`}>
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {sinArriendo.length} contrato{sinArriendo.length === 1 ? "" : "s"} sin arriendo
              generado · {periodoActual}
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-amber-200/70 text-sm text-ink">
            {sinArriendo.map((c) => (
              <li key={c.contratoId} className="py-2">
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${ui.card} p-5 lg:col-span-2`}>
          <h2 className="mb-3 text-sm font-semibold text-ink">Generación asistida</h2>
          <GenerarArriendos periodoDefault={periodoActual} />
        </div>
        <div className={`${ui.card} flex flex-col justify-center p-5`}>
          <span className="text-sm font-medium text-muted">Deuda pendiente total</span>
          <span className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {monto(deudaTotal)}
          </span>
        </div>
      </div>

      {cargos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {Object.values(sp).some(Boolean)
            ? "No hay cargos con esos filtros."
            : "Aún no hay cargos. Genera los del mes o crea uno."}
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {cargos.map((c) => {
            const est = estadoMostrar(c.estado, Number(c.saldo_pendiente), c.fecha_vencimiento, hoy);
            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">
                      {c.periodo.slice(0, 7)} · {TIPO_LABEL[c.tipo_cargo] ?? c.tipo_cargo}
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
                      <span>Monto: {monto(c.monto)}</span>
                      <span>Saldo: {monto(c.saldo_pendiente)}</span>
                      {c.fecha_vencimiento && <span>Vence: {c.fecha_vencimiento}</span>}
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
      )}
    </div>
  );
}
