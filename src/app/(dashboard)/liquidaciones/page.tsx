import Link from "next/link";
import { AlertTriangle, Eye, Info } from "lucide-react";
import { listLiquidaciones, listPendientesLiquidar } from "@/features/liquidaciones/queries";
import { FiltroLiquidaciones } from "@/features/liquidaciones/filtro-liquidaciones";
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

      <FiltroLiquidaciones
        valores={sp}
        propietarios={opciones}
        hayFiltros={Boolean(sp.propietario || sp.estado)}
      />

      {liquidaciones.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay liquidaciones con esos filtros.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {liquidaciones.map((l) => {
            const est = ESTADO[l.estado] ?? { label: l.estado, tone: "neutral" as const };
            return (
              <div key={l.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{l.numero ?? "—"} · {l.periodo.slice(0, 7)}</p>
                    <p className="font-medium text-white">{l.propietario_nombre}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <details className="min-w-0 flex-1">
                    <summary className={ui.listCardDisclosure}>
                      <Info size={14} /> Ver más información
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                      <span>Total: {clp(l.total_liquidacion)}</span>
                      {l.fecha_generacion && <span>Generada: {l.fecha_generacion}</span>}
                    </div>
                  </details>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/liquidaciones/${l.id}`}
                      aria-label="Ver detalle"
                      title="Ver detalle"
                      className={ui.listCardIconBtn}
                    >
                      <Eye size={16} />
                    </Link>
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
