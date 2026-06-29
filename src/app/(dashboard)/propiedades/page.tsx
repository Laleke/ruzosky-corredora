import Link from "next/link";
import { listPropiedades } from "@/features/propiedades/queries";
import { cambiarActivoPropiedad } from "@/features/propiedades/actions";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  disponible: { label: "Disponible", tone: "neutral" },
  reservada: { label: "Reservada", tone: "info" },
  arrendada: { label: "Arrendada", tone: "success" },
  mantencion: { label: "Mantención", tone: "warning" },
  inactiva: { label: "Inactiva", tone: "danger" },
};

function formatoValor(valor: number | null, moneda: string): string {
  if (valor === null) return "—";
  return moneda === "UF"
    ? `UF ${valor.toLocaleString("es-CL")}`
    : `$${valor.toLocaleString("es-CL")}`;
}

export default async function PropiedadesPage() {
  const propiedades = await listPropiedades();

  return (
    <div>
      <PageHeader
        titulo="Propiedades"
        descripcion="Inmuebles en administración y su estado."
        accion={{ href: "/propiedades/nueva", label: "Nueva propiedad" }}
      />

      {propiedades.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay propiedades registradas.
        </div>
      ) : (
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Código</th>
                  <th className={ui.th}>Dirección</th>
                  <th className={ui.th}>Comuna</th>
                  <th className={ui.th}>Tipo</th>
                  <th className={ui.th}>Estado</th>
                  <th className={ui.th}>Valor ref.</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {propiedades.map((p) => {
                  const est = ESTADO[p.estado] ?? { label: p.estado, tone: "neutral" as const };
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-stone-50/50">
                      <td className={`${ui.td} text-muted`}>{p.codigo_interno ?? "—"}</td>
                      <td className={`${ui.td} font-medium`}>
                        {p.direccion ?? <span className="text-muted">(sin dirección)</span>}
                        {p.numero ? ` ${p.numero}` : ""}
                        {p.departamento ? `, ${p.departamento}` : ""}
                      </td>
                      <td className={`${ui.td} text-muted`}>{p.comuna ?? "—"}</td>
                      <td className={`${ui.td} capitalize text-muted`}>
                        {p.tipo.replace("_", " ")}
                      </td>
                      <td className={ui.td}>
                        <span className={badge(est.tone)}>{est.label}</span>
                        {!p.activo && (
                          <span className="ml-1 text-xs text-muted">(inactivo)</span>
                        )}
                      </td>
                      <td className={ui.td}>
                        {formatoValor(p.valor_referencial_arriendo, p.moneda)}
                      </td>
                      <td className={`${ui.td} text-right`}>
                        <div className="flex justify-end gap-4">
                          <Link href={`/propiedades/${p.id}`} className={ui.linkAction}>
                            Detalle
                          </Link>
                          <form
                            action={cambiarActivoPropiedad.bind(null, p.id, !p.activo)}
                          >
                            <button type="submit" className="text-sm text-muted hover:text-ink">
                              {p.activo ? "Desactivar" : "Activar"}
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
