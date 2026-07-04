import Link from "next/link";
import { FileText } from "lucide-react";
import {
  listDocumentos,
  getOpcionesRelacion,
} from "@/features/documentos/queries";
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  CATEGORIA_TONE,
  formatearTamano,
} from "@/features/documentos/constants";
import { AccionesArchivo } from "@/features/documentos/acciones";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import type { CategoriaDocumento } from "@/types/database.types";
import type { FiltrosDocumentos } from "@/features/documentos/types";

type SP = {
  q?: string;
  categoria?: string;
  propiedad?: string;
  contrato?: string;
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
    contratoId: sp.contrato,
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

      <form
        method="get"
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Buscar</span>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Nombre u observaciones…"
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Categoría</span>
          <select name="categoria" defaultValue={sp.categoria ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Propiedad</span>
          <select name="propiedad" defaultValue={sp.propiedad ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {opciones.propiedades.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Contrato</span>
          <select name="contrato" defaultValue={sp.contrato ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.contratos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Propietario</span>
          <select name="propietario" defaultValue={sp.propietario ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.propietarios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Arrendatario</span>
          <select name="arrendatario" defaultValue={sp.arrendatario ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.arrendatarios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Desde</span>
          <input type="date" name="desde" defaultValue={sp.desde ?? ""} className={ui.input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Hasta</span>
          <input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className={ui.input} />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={ui.btnSecondary}>
            Filtrar
          </button>
          <Link href="/documentos" className={ui.btnGhost}>
            Limpiar
          </Link>
        </div>
      </form>

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
