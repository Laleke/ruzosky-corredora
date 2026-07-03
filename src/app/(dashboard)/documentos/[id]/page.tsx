import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getDocumento,
  getVersiones,
} from "@/features/documentos/queries";
import {
  CATEGORIA_LABEL,
  CATEGORIA_TONE,
  formatearTamano,
} from "@/features/documentos/constants";
import {
  AccionesArchivo,
  NuevaVersionBtn,
  EliminarVersionBtn,
  EliminarDocumentoBtn,
} from "@/features/documentos/acciones";
import { getCurrentProfile } from "@/lib/auth";
import { ui, badge } from "@/components/ui";

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

export default async function DocumentoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const doc = await getDocumento(id);
  if (!doc) notFound();

  const versiones = await getVersiones(id);

  return (
    <div>
      <Link href="/documentos" className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {doc.nombre}
            </h1>
            <span className={badge(CATEGORIA_TONE[doc.categoria])}>
              {CATEGORIA_LABEL[doc.categoria]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {versiones.length} versión{versiones.length === 1 ? "" : "es"} · subido
            por {doc.subido_por_email ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NuevaVersionBtn documentoId={doc.id} empresaId={profile.empresa_id} />
          <EliminarDocumentoBtn documentoId={doc.id} />
        </div>
      </div>

      {/* Metadatos */}
      <div className={`${ui.card} mb-6 p-6`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Dato label="Fecha documento" valor={doc.fecha_documento} />
          <Dato label="Fecha de subida" valor={doc.created_at.slice(0, 10)} />
          <Dato label="Propiedad" valor={doc.propiedad_label} />
          <Dato label="Contrato" valor={doc.contrato_numero} />
          <Dato label="Propietario" valor={doc.propietario_nombre} />
          <Dato label="Arrendatario" valor={doc.arrendatario_nombre} />
        </dl>
        {doc.observaciones && (
          <div className="mt-4 border-t border-line pt-4">
            <dt className="text-xs uppercase tracking-wide text-muted">
              Observaciones
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {doc.observaciones}
            </dd>
          </div>
        )}
      </div>

      {/* Versiones */}
      <h2 className="mb-3 text-sm font-semibold text-ink">Versiones</h2>
      <div className={`${ui.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-stone-50/60">
              <tr>
                <th className={ui.th}>Versión</th>
                <th className={ui.th}>Archivo</th>
                <th className={ui.th}>Tamaño</th>
                <th className={ui.th}>Subido</th>
                <th className={ui.th}>Usuario</th>
                <th className={ui.th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {versiones.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-stone-50/50">
                  <td className={`${ui.td} font-medium`}>
                    v{v.version}
                    {v.version === doc.version_actual && (
                      <span className={`${badge("success")} ml-2`}>Vigente</span>
                    )}
                  </td>
                  <td className={`${ui.td} max-w-xs truncate`} title={v.nombre_archivo}>
                    {v.nombre_archivo}
                  </td>
                  <td className={`${ui.td} text-muted`}>
                    {formatearTamano(v.tamano_bytes)}
                  </td>
                  <td className={`${ui.td} text-muted`}>
                    {v.created_at.slice(0, 10)}
                  </td>
                  <td className={`${ui.td} text-muted`}>
                    {v.subido_por_email ?? "—"}
                  </td>
                  <td className={ui.td}>
                    <div className="flex items-center justify-end gap-4">
                      <AccionesArchivo versionId={v.id} compacto />
                      {versiones.length > 1 && (
                        <EliminarVersionBtn versionId={v.id} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
