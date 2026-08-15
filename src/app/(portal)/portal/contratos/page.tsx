import Link from "next/link";
import { Info, Eye } from "lucide-react";
import { misContratos } from "@/features/portal/queries";
import { ui, badge } from "@/components/ui";
import { numeroContratoMostrar, terminoMostrar } from "@/features/contratos/vigencia";
import { formatearFecha } from "@/lib/fecha";

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

export default async function PortalContratosPage() {
  const contratos = await misContratos();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">Mis contratos</h1>
        <p className="mt-1 text-sm text-canvas-muted">Contratos de arriendo asociados a ti.</p>
      </div>

      {contratos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes contratos asociados.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {contratos.map((c) => {
            const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">
                      {numeroContratoMostrar(c.numero_contrato, c.id)}
                    </p>
                    <p className="font-medium text-white">{c.propiedad_direccion}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <details className="group min-w-0 flex-1">
                    <summary className={ui.listCardDisclosure}>
                      <Info size={14} />
                      <span className="group-open:hidden">Ver más información</span>
                      <span className="hidden group-open:inline">Ocultar información</span>
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                      <span>Arrendatario: {c.arrendatarios_nombres.join(", ") || "—"}</span>
                      <span>Inicio: {formatearFecha(c.fecha_inicio)}</span>
                      <span>Término: {terminoMostrar(c.fecha_termino, c.estado)}</span>
                      <span>Canon: {formatoCanon(c.canon_actual ?? c.canon_monto, c.canon_moneda)}</span>
                    </div>
                  </details>

                  <Link
                    href={`/portal/contratos/${c.id}`}
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
