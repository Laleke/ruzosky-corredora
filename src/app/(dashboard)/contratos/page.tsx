import Link from "next/link";
import { Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
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
        <div className={ui.cardGrid}>
          {contratos.map((c) => {
            const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{c.numero_contrato ?? "—"}</p>
                    <p className="font-medium text-white">
                      {c.propiedad_codigo ? `${c.propiedad_codigo} · ` : ""}
                      {c.propiedad_direccion}
                    </p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <details>
                  <summary className={ui.listCardDisclosure}>
                    <Info size={14} /> Ver más información
                  </summary>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                    <span>Inicio: {c.fecha_inicio}</span>
                    <span>Término: {c.fecha_termino ?? "—"}</span>
                    <span>{formatoCanon(c.canon_monto, c.canon_moneda)}</span>
                    {!c.activo && <span className="text-white/60">Inactivo</span>}
                  </div>
                </details>

                <div className="mt-1 flex items-center justify-end gap-1 border-t border-white/15 pt-2">
                  <Link
                    href={`/contratos/${c.id}`}
                    aria-label="Editar / ver detalle"
                    title="Editar / ver detalle"
                    className={ui.listCardIconBtn}
                  >
                    <Pencil size={16} />
                  </Link>
                  <form action={cambiarActivoContrato.bind(null, c.id, !c.activo)}>
                    <button
                      type="submit"
                      aria-label={c.activo ? "Desactivar" : "Activar"}
                      title={c.activo ? "Desactivar" : "Activar"}
                      className={ui.listCardIconBtn}
                    >
                      {c.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
