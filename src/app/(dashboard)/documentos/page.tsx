import Link from "next/link";
import { Eye, FileText, Info } from "lucide-react";
import {
  listDocumentos,
  getOpcionesRelacion,
} from "@/features/documentos/queries";
import {
  CATEGORIA_LABEL,
  CATEGORIA_TONE,
  formatearTamano,
} from "@/features/documentos/constants";
import { FiltroDocumentos } from "@/features/documentos/filtro-documentos";
import { AccionesArchivo } from "@/features/documentos/acciones";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";
import type { CategoriaDocumento } from "@/types/database.types";
import type { FiltrosDocumentos } from "@/features/documentos/types";

type SP = {
  q?: string;
  categoria?: string;
  propiedad?: string;
  propietario?: string;
  arrendatario?: string;
  desde?: string;
  hasta?: string;
};

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const filtros: FiltrosDocumentos = {
    q: sp.q,
    categoria: sp.categoria as CategoriaDocumento | undefined,
    propiedadId: sp.propiedad,
    propietarioId: sp.propietario,
    arrendatarioId: sp.arrendatario,
    desde: sp.desde,
    hasta: sp.hasta,
  };

  const [documentos, opciones] = await Promise.all([
    listDocumentos(filtros),
    getOpcionesRelacion(),
  ]);

  return (
    <div>
      <PageHeader
        titulo="Documentos"
        descripcion="Centro documental: contratos, actas, comprobantes, facturas y más."
        accion={{ href: "/documentos/nuevo", label: "Subir documento" }}
      />

      <FiltroDocumentos
        valores={sp}
        propiedades={opciones.propiedades}
        propietarios={opciones.propietarios}
        arrendatarios={opciones.arrendatarios}
        hayFiltros={Boolean(
          sp.q || sp.categoria || sp.propiedad || sp.propietario || sp.arrendatario || sp.desde || sp.hasta
        )}
      />

      {documentos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay documentos con esos filtros.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {documentos.map((d) => (
            <div key={d.id} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-white/60">
                    {formatearFecha(d.fecha_documento ?? d.created_at)} · {formatearTamano(d.version_tamano_bytes)}
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-white">
                    <FileText size={15} className="shrink-0 text-white/60" />
                    <span className="truncate">
                      {d.nombre}
                      {d.version_actual > 1 && (
                        <span className="ml-1 text-xs text-white/60">v{d.version_actual}</span>
                      )}
                    </span>
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
                    <span>Subido por: {d.subido_por_email ?? "—"}</span>
                  </div>
                </details>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/documentos/${d.id}`}
                    aria-label="Ver detalle"
                    title="Ver detalle"
                    className={ui.listCardIconBtn}
                  >
                    <Eye size={16} />
                  </Link>
                  {d.version_actual_id && (
                    <AccionesArchivo versionId={d.version_actual_id} compacto oscuro />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
