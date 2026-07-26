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
        <div className={ui.cardGrid}>
          {propiedades.map((p) => {
            const est = ESTADO[p.estado] ?? { label: p.estado, tone: "neutral" as const };
            return (
              <div key={p.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">{p.codigo_interno ?? "—"}</p>
                    <p className="font-medium text-ink">
                      {p.direccion ?? <span className="text-muted">(sin dirección)</span>}
                      {p.numero ? ` ${p.numero}` : ""}
                      {p.departamento ? `, ${p.departamento}` : ""}
                    </p>
                    <p className="text-sm text-muted">{p.comuna ?? "—"}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted">{p.tipo.replace("_", " ")}</span>
                  <span className="font-medium text-ink">
                    {formatoValor(p.valor_referencial_arriendo, p.moneda)}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
                  {!p.activo && <span className="text-xs text-muted">Inactivo</span>}
                  <div className="ml-auto flex items-center gap-4">
                    <Link href={`/propiedades/${p.id}`} className={ui.linkAction}>
                      Detalle
                    </Link>
                    <form action={cambiarActivoPropiedad.bind(null, p.id, !p.activo)}>
                      <button type="submit" className="text-sm text-muted hover:text-ink">
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
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
