import Link from "next/link";
import { listContratos } from "@/features/contratos/queries";
import { cambiarActivoContrato } from "@/features/contratos/actions";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  vigente: { label: "Vigente", tone: "success" },
  vencido: { label: "Vencido", tone: "warning" },
  terminado: { label: "Terminado", tone: "neutral" },
  renovado: { label: "Renovado", tone: "info" },
};

function formatoCanon(monto: number, moneda: string): string {
  return moneda === "UF"
    ? `UF ${monto.toLocaleString("es-CL")}`
    : `$${monto.toLocaleString("es-CL")}`;
}

export default async function ContratosPage() {
  const contratos = await listContratos();

  return (
    <div>
      <PageHeader
        titulo="Contratos"
        descripcion="Contratos de arriendo y su estado."
        accion={{ href: "/contratos/nuevo", label: "Nuevo contrato" }}
      />

      {contratos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay contratos registrados.
        </div>
      ) : (
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>N°</th>
                  <th className={ui.th}>Propiedad</th>
                  <th className={ui.th}>Inicio</th>
                  <th className={ui.th}>Término</th>
                  <th className={ui.th}>Canon</th>
                  <th className={ui.th}>Estado</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contratos.map((c) => {
                  const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-stone-50/50">
                      <td className={`${ui.td} text-muted`}>{c.numero_contrato ?? "—"}</td>
                      <td className={`${ui.td} font-medium`}>
                        {c.propiedad_codigo ? `${c.propiedad_codigo} · ` : ""}
                        {c.propiedad_direccion}
                      </td>
                      <td className={`${ui.td} text-muted`}>{c.fecha_inicio}</td>
                      <td className={`${ui.td} text-muted`}>{c.fecha_termino ?? "—"}</td>
                      <td className={ui.td}>{formatoCanon(c.canon_monto, c.canon_moneda)}</td>
                      <td className={ui.td}>
                        <span className={badge(est.tone)}>{est.label}</span>
                        {!c.activo && (
                          <span className="ml-1 text-xs text-muted">(inactivo)</span>
                        )}
                      </td>
                      <td className={`${ui.td} text-right`}>
                        <div className="flex justify-end gap-4">
                          <Link href={`/contratos/${c.id}`} className={ui.linkAction}>
                            Detalle
                          </Link>
                          <form action={cambiarActivoContrato.bind(null, c.id, !c.activo)}>
                            <button type="submit" className="text-sm text-muted hover:text-ink">
                              {c.activo ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        </div>
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
