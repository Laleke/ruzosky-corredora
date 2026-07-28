import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import { listContratos } from "@/features/contratos/queries";
import { cambiarActivoContrato } from "@/features/contratos/actions";
import { PageHeader } from "@/components/page-header";
import { ToggleSwitch } from "@/components/toggle-switch";
import { FiltroContratos } from "@/features/contratos/filtro-contratos";
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

type SP = { estado?: string; activo?: string };

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const contratos = await listContratos(sp);
  const hayFiltros = Boolean(sp.estado || sp.activo);

  return (
    <div>
      <PageHeader
        titulo="Contratos"
        descripcion="Contratos de arriendo y su estado."
        accion={{ href: "/contratos/nuevo", label: "Nuevo contrato" }}
      />

      <FiltroContratos valores={sp} hayFiltros={hayFiltros} />

      {contratos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {hayFiltros ? "No hay contratos con esos filtros." : "Aún no hay contratos registrados."}
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {contratos.map((c) => {
            const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
            return (
              <div key={c.id} className={`${ui.listCard} ${!c.activo ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{c.numero_contrato ?? "—"}</p>
                    <p className="font-medium text-white">{c.propiedad_direccion}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <details className="min-w-0 flex-1">
                    <summary className={ui.listCardDisclosure}>
                      <Info size={14} /> Ver más información
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                      <span>Arrendatario: {c.arrendatarios_nombres.join(", ") || "—"}</span>
                      <span>Inicio: {c.fecha_inicio}</span>
                      <span>Término: {c.fecha_termino ?? "—"}</span>
                      <span>Canon: {formatoCanon(c.canon_actual ?? c.canon_monto, c.canon_moneda)}</span>
                    </div>
                  </details>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/contratos/${c.id}`}
                      aria-label="Editar / ver detalle"
                      title="Editar / ver detalle"
                      className={ui.listCardIconBtn}
                    >
                      <Pencil size={16} />
                    </Link>
                    <form action={cambiarActivoContrato.bind(null, c.id, !c.activo)}>
                      <ToggleSwitch on={c.activo} label={c.activo ? "Desactivar" : "Activar"} />
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
