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
        <div className={ui.cardGrid}>
          {contratos.map((c) => {
            const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">{c.numero_contrato ?? "—"}</p>
                    <p className="font-medium text-ink">
                      {c.propiedad_codigo ? `${c.propiedad_codigo} · ` : ""}
                      {c.propiedad_direccion}
                    </p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted">
                  <span>Inicio: {c.fecha_inicio}</span>
                  <span>Término: {c.fecha_termino ?? "—"}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">
                    {formatoCanon(c.canon_monto, c.canon_moneda)}
                  </span>
                  {!c.activo && <span className="text-xs text-muted">Inactivo</span>}
                </div>

                <div className="mt-1 flex items-center justify-end gap-4 border-t border-line pt-3">
                  <Link href={`/contratos/${c.id}`} className={ui.linkAction}>
                    Detalle
                  </Link>
                  <form action={cambiarActivoContrato.bind(null, c.id, !c.activo)}>
                    <button type="submit" className="text-sm text-muted hover:text-ink">
                      {c.activo ? "Desactivar" : "Activar"}
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
