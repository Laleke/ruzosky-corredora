import Link from "next/link";
import { Eye } from "lucide-react";
import { misLiquidaciones } from "@/features/portal/queries";
import { ui, badge } from "@/components/ui";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  pagada: { label: "Pagada", tone: "success" },
  anulada: { label: "Anulada", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function PortalLiquidacionesPage() {
  const liquidaciones = await misLiquidaciones();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Mis liquidaciones
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Liquidaciones generadas a tu nombre.
        </p>
      </div>

      {liquidaciones.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes liquidaciones registradas.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {liquidaciones.map((l) => {
            const est = ESTADO[l.estado] ?? { label: l.estado, tone: "neutral" as const };
            return (
              <div key={l.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{formatearPeriodo(l.periodo)}</p>
                    <p className="font-medium text-white">{clp(l.total_liquidacion)}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/60">
                    Generada {formatearFecha(l.fecha_generacion)}
                  </span>
                  <Link
                    href={`/portal/liquidaciones/${l.id}`}
                    aria-label="Ver detalle"
                    title="Ver detalle"
                    className={ui.listCardIconBtn}
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
