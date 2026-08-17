import Link from "next/link";
import { Pencil, Info } from "lucide-react";
import { listIncidencias } from "@/features/incidencias/queries";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { FiltroIncidencias } from "@/features/incidencias/filtro-incidencias";
import { ESTADO_INCIDENCIA } from "@/features/incidencias/constants";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";
import type { EstadoIncidencia } from "@/types/database.types";
import type { FiltrosIncidencias } from "@/features/incidencias/types";

type SP = { propiedad?: string; estado?: string };

export default async function IncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filtros: FiltrosIncidencias = {
    propiedadId: sp.propiedad,
    estado: sp.estado as EstadoIncidencia | undefined,
  };

  const [incidencias, opciones] = await Promise.all([
    listIncidencias(filtros),
    getOpcionesRelacion(),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Incidencias"
        descripcion="Registro de incidencias de mantención/arreglos por propiedad, con proveedor y seguimiento."
        accion={{ href: "/incidencias/nueva", label: "Registrar incidencia" }}
      />

      <FiltroIncidencias
        valores={sp}
        propiedades={opciones.propiedades}
        hayFiltros={Boolean(sp.propiedad || sp.estado)}
      />

      {incidencias.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay incidencias con esos filtros.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {incidencias.map((inc) => {
            const est = ESTADO_INCIDENCIA[inc.estado];
            return (
              <div key={inc.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">
                      {formatearFecha(inc.fecha_reportada)} · {inc.propiedad_label ?? "—"}
                    </p>
                    <p className="flex items-center gap-2 font-medium text-white">
                      {inc.titulo}
                      {inc.gasto_id && (
                        <span className={badge("info")} title="Ya generó un gasto">
                          Gasto
                        </span>
                      )}
                    </p>
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
                      <span>Proveedor: {inc.proveedor_nombre ?? "—"}</span>
                      {inc.costo != null && <span>Costo: ${Math.round(Number(inc.costo)).toLocaleString("es-CL")}</span>}
                    </div>
                  </details>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/incidencias/${inc.id}`}
                      aria-label="Ver detalle"
                      title="Ver detalle"
                      className={ui.listCardIconBtn}
                    >
                      <Pencil size={16} />
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
