import { FileText, Info } from "lucide-react";
import { misDocumentos } from "@/features/portal/queries";
import { CATEGORIA_LABEL, CATEGORIA_TONE, formatearTamano } from "@/features/documentos/constants";
import { AccionesArchivoPortal } from "@/features/portal/acciones-archivo";
import { ui, badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";

export default async function PortalDocumentosPage() {
  const documentos = await misDocumentos();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Mis documentos
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Contratos, comprobantes y otros documentos asociados a ti.
        </p>
      </div>

      {documentos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes documentos disponibles.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {documentos.map((d) => (
            <div key={d.id} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-white/60">
                    {formatearFecha(d.fecha_documento ?? d.created_at)} ·{" "}
                    {formatearTamano(d.version_tamano_bytes)}
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-white">
                    <FileText size={15} className="shrink-0 text-white/60" />
                    <span className="truncate">{d.nombre}</span>
                  </p>
                </div>
                <span className={badge(CATEGORIA_TONE[d.categoria])}>
                  {CATEGORIA_LABEL[d.categoria]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <details className="group min-w-0 flex-1">
                  <summary className={ui.listCardDisclosure}>
                    <Info size={14} />
                    <span className="group-open:hidden">Ver más información</span>
                    <span className="hidden group-open:inline">Ocultar información</span>
                  </summary>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                    <span>Propiedad: {d.propiedad_label ?? "—"}</span>
                    <span>Contrato: {d.contrato_numero ?? "—"}</span>
                  </div>
                </details>

                {d.version_actual_id && (
                  <AccionesArchivoPortal versionId={d.version_actual_id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
