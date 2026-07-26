import Link from "next/link";
import { Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
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
              <div
                key={p.id}
                className={`${ui.listCard} ${!p.activo ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{p.comuna ?? "—"}</p>
                    <p className="font-medium text-white">
                      {p.direccion ?? <span className="text-white/60">(sin dirección)</span>}
                      {p.numero ? ` ${p.numero}` : ""}
                      {p.departamento ? `, ${p.departamento}` : ""}
                    </p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <details className="min-w-0 flex-1">
                    <summary className={`${ui.listCardDisclosure} justify-between`}>
                      <span className="flex items-center gap-1.5">
                        <Info size={14} /> Ver más información
                      </span>
                      <span className="shrink-0 text-sm font-medium text-white">
                        {formatoValor(p.valor_referencial_arriendo, p.moneda)}
                      </span>
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                      <span>{p.codigo_interno ?? "—"}</span>
                      <span className="capitalize">{p.tipo.replace("_", " ")}</span>
                      {!p.activo && <span className="text-white/60">Inactivo</span>}
                    </div>
                  </details>

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/propiedades/${p.id}`}
                      aria-label="Editar / ver detalle"
                      title="Editar / ver detalle"
                      className={ui.listCardIconBtn}
                    >
                      <Pencil size={16} />
                    </Link>
                    <form action={cambiarActivoPropiedad.bind(null, p.id, !p.activo)}>
                      <button
                        type="submit"
                        aria-label={p.activo ? "Desactivar" : "Activar"}
                        title={p.activo ? "Desactivar" : "Activar"}
                        className={`${ui.listCardIconBtn} ${
                          p.activo ? "text-emerald-400 hover:text-emerald-300" : "text-red-400 hover:text-red-300"
                        }`}
                      >
                        {p.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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
