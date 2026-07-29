import Link from "next/link";
import { FileText } from "lucide-react";
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
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Nombre</th>
                  <th className={ui.th}>Categoría</th>
                  <th className={ui.th}>Propiedad</th>
                  <th className={ui.th}>Fecha</th>
                  <th className={ui.th}>Tamaño</th>
                  <th className={ui.th}>Usuario</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {documentos.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-stone-50/50">
                    <td className={ui.td}>
                      <Link
                        href={`/documentos/${d.id}`}
                        className="flex items-center gap-2 font-medium text-ink hover:text-burgundy"
                      >
                        <FileText size={16} className="shrink-0 text-muted" />
                        <span className="min-w-0">
                          <span className="block truncate">{d.nombre}</span>
                          {d.version_actual > 1 && (
                            <span className="text-xs text-muted">
                              v{d.version_actual}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className={ui.td}>
                      <span className={badge(CATEGORIA_TONE[d.categoria])}>
                        {CATEGORIA_LABEL[d.categoria]}
                      </span>
                    </td>
                    <td className={`${ui.td} text-muted`}>
                      {d.propiedad_label ?? "—"}
                    </td>
                    <td className={`${ui.td} text-muted`}>
                      {d.fecha_documento ?? d.created_at.slice(0, 10)}
                    </td>
                    <td className={`${ui.td} text-muted`}>
                      {formatearTamano(d.version_tamano_bytes)}
                    </td>
                    <td className={`${ui.td} text-muted`}>
                      {d.subido_por_email ?? "—"}
                    </td>
                    <td className={`${ui.td} text-right`}>
                      {d.version_actual_id && (
                        <AccionesArchivo versionId={d.version_actual_id} compacto />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
