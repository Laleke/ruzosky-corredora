import Link from "next/link";
import { listCargos } from "@/features/cobros/queries";
import { GenerarArriendos } from "@/features/cobros/generar-arriendos";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";

const TIPO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
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

export default async function CobrosPage() {
  const cargos = await listCargos();
  const hoy = new Date().toISOString().slice(0, 10);
  const deudaTotal = cargos.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);

  return (
    <div>
      <PageHeader
        titulo="Cobros y pagos"
        descripcion="Cargos generados, saldos y morosidad."
        accion={{ href: "/cobros/nuevo", label: "Nuevo cargo" }}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${ui.card} p-5 lg:col-span-2`}>
          <h2 className="mb-3 text-sm font-semibold text-ink">Generación asistida</h2>
          <GenerarArriendos />
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
          Aún no hay cargos. Genera los del mes o crea uno.
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
