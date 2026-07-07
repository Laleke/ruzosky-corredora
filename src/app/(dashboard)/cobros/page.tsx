import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { listCargos, listContratosSinArriendo } from "@/features/cobros/queries";
import { GenerarArriendos } from "@/features/cobros/generar-arriendos";
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

const ESTADOS_CARGO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
];

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
  const [cargos, opciones, sinArriendo] = await Promise.all([
    listCargos(filtros),
    getOpcionesRelacion(),
    listContratosSinArriendo(`${periodoActual}-01`),
  ]);
  const hoy = new Date().toISOString().slice(0, 10);
  const deudaTotal = cargos.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);

  return (
    <div>
      <PageHeader
        titulo="Cobros y pagos"
        descripcion="Cargos generados, saldos y morosidad."
        accion={{ href: "/cobros/nuevo", label: "Nuevo cargo" }}
      />

      <form
        method="get"
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Propiedad</span>
          <select name="propiedad" defaultValue={sp.propiedad ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {opciones.propiedades.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Arrendatario</span>
          <select name="arrendatario" defaultValue={sp.arrendatario ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.arrendatarios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select name="estado" defaultValue={sp.estado ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {ESTADOS_CARGO.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Período</span>
          <input type="month" name="periodo" defaultValue={sp.periodo ?? ""} className={ui.input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Vence desde</span>
          <input
            type="date"
            name="venceDesde"
            defaultValue={sp.venceDesde ?? ""}
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Vence hasta</span>
          <input
            type="date"
            name="venceHasta"
            defaultValue={sp.venceHasta ?? ""}
            className={ui.input}
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={ui.btnSecondary}>
            Filtrar
          </button>
          <Link href="/cobros" className={ui.btnGhost}>
            Limpiar
          </Link>
        </div>
      </form>

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
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Período</th>
                  <th className={ui.th}>Contrato / Propiedad</th>
                  <th className={ui.th}>Tipo</th>
                  <th className={ui.th}>Monto</th>
                  <th className={ui.th}>Saldo</th>
                  <th className={ui.th}>Estado</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cargos.map((c) => {
                  const est = estadoMostrar(
                    c.estado,
                    Number(c.saldo_pendiente),
                    c.fecha_vencimiento,
                    hoy
                  );
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-stone-50/50">
                      <td className={`${ui.td} text-muted`}>{c.periodo.slice(0, 7)}</td>
                      <td className={`${ui.td} font-medium`}>
                        {c.numero_contrato ? `${c.numero_contrato} · ` : ""}
                        {c.propiedad_direccion}
                      </td>
                      <td className={`${ui.td} text-muted`}>
                        {TIPO_LABEL[c.tipo_cargo] ?? c.tipo_cargo}
                      </td>
                      <td className={ui.td}>{monto(c.monto)}</td>
                      <td className={`${ui.td} font-medium`}>{monto(c.saldo_pendiente)}</td>
                      <td className={ui.td}>
                        <span className={badge(est.tone)}>{est.label}</span>
                      </td>
                      <td className={`${ui.td} text-right`}>
                        <Link href={`/cobros/${c.id}`} className={ui.linkAction}>
                          Detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
