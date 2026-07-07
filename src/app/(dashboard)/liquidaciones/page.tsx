import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { listLiquidaciones, listPendientesLiquidar } from "@/features/liquidaciones/queries";
import { listPropietarios } from "@/features/propietarios/queries";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  pagada: { label: "Pagada", tone: "success" },
  anulada: { label: "Anulada", tone: "danger" },
};

function nombre(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function LiquidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ propietario?: string; estado?: string }>;
}) {
  const sp = await searchParams;
  const periodoActual = new Date().toISOString().slice(0, 7);
  const [liquidaciones, propietarios, pendientes] = await Promise.all([
    listLiquidaciones({ propietarioId: sp.propietario, estado: sp.estado }),
    listPropietarios(),
    listPendientesLiquidar(`${periodoActual}-01`),
  ]);
  const opciones = propietarios.map((p) => ({ id: p.id, label: nombre(p) }));

  return (
    <div>
      <PageHeader
        titulo="Liquidaciones"
        descripcion="Montos a transferir a cada propietario por período."
        accion={{ href: "/liquidaciones/nueva", label: "Nueva liquidación" }}
      />

      {pendientes.length > 0 && (
        <div className={`${ui.card} mb-5 border-amber-200 bg-amber-50 p-5`}>
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle size={18} />
            <h2 className="text-sm font-semibold">
              {pendientes.length} liquidación{pendientes.length === 1 ? "" : "es"} pendiente
              {pendientes.length === 1 ? "" : "s"} de generar · {periodoActual}
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-amber-200/70">
            {pendientes.map((p) => (
              <li
                key={p.propietarioId}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="text-ink">{p.propietarioNombre}</span>
                <span className="flex items-center gap-3">
                  <span className="font-medium text-ink">{clp(p.totalEstimado)}</span>
                  <Link
                    href={`/liquidaciones/nueva?propietario=${p.propietarioId}&periodo=${periodoActual}`}
                    className={`${ui.btnSecondary} px-3 py-1.5 text-xs`}
                  >
                    Generar
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Propietario</span>
          <select name="propietario" defaultValue={sp.propietario ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select name="estado" defaultValue={sp.estado ?? ""} className={ui.input}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="anulada">Anulada</option>
          </select>
        </label>
        <button type="submit" className={ui.btnSecondary}>Filtrar</button>
      </form>

      {liquidaciones.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay liquidaciones con esos filtros.
        </div>
      ) : (
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>N°</th>
                  <th className={ui.th}>Período</th>
                  <th className={ui.th}>Propietario</th>
                  <th className={ui.th}>Total</th>
                  <th className={ui.th}>Estado</th>
                  <th className={ui.th}>Generación</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {liquidaciones.map((l) => {
                  const est = ESTADO[l.estado] ?? { label: l.estado, tone: "neutral" as const };
                  return (
                    <tr key={l.id} className="transition-colors hover:bg-stone-50/50">
                      <td className={`${ui.td} text-muted`}>{l.numero ?? "—"}</td>
                      <td className={`${ui.td} font-medium`}>{l.periodo.slice(0, 7)}</td>
                      <td className={ui.td}>{l.propietario_nombre}</td>
                      <td className={`${ui.td} font-medium`}>{clp(l.total_liquidacion)}</td>
                      <td className={ui.td}>
                        <span className={badge(est.tone)}>{est.label}</span>
                      </td>
                      <td className={`${ui.td} text-muted`}>{l.fecha_generacion}</td>
                      <td className={`${ui.td} text-right`}>
                        <Link href={`/liquidaciones/${l.id}`} className={ui.linkAction}>
                          Ver detalle
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
