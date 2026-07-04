import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  getPropiedad,
  getPropietariosAsignados,
} from "@/features/propiedades/queries";
import { EditarParticipacion } from "@/features/propiedades/editar-participacion";
import { ui, badge } from "@/components/ui";

const TIPO_LABEL: Record<string, string> = {
  departamento: "Departamento",
  casa: "Casa",
  oficina: "Oficina",
  local_comercial: "Local comercial",
  bodega: "Bodega",
  estacionamiento: "Estacionamiento",
  terreno: "Terreno",
  otro: "Otro",
};
const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  disponible: { label: "Disponible", tone: "neutral" },
  reservada: { label: "Reservada", tone: "info" },
  arrendada: { label: "Arrendada", tone: "success" },
  mantencion: { label: "Mantención", tone: "warning" },
  inactiva: { label: "Inactiva", tone: "danger" },
};

function dinero(v: number | null, moneda: string): string {
  if (v === null) return "—";
  return moneda === "UF"
    ? `UF ${v.toLocaleString("es-CL")}`
    : `$${v.toLocaleString("es-CL")}`;
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${ui.card} p-5`}>
      <h2 className="mb-4 text-sm font-semibold text-ink">{titulo}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

export default async function DetallePropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, asignados] = await Promise.all([
    getPropiedad(id),
    getPropietariosAsignados(id),
  ]);
  if (!p) notFound();

  const est = ESTADO[p.estado] ?? { label: p.estado, tone: "neutral" as const };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/propiedades" className="text-sm text-muted hover:text-ink">
          ← Volver a propiedades
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {p.direccion ?? "Propiedad sin dirección"}
              {p.numero ? ` ${p.numero}` : ""}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              {p.codigo_interno && (
                <span className={badge("info")}>{p.codigo_interno}</span>
              )}
              <span className={badge(est.tone)}>{est.label}</span>
              {p.publicada && <span className={badge("success")}>Publicada</span>}
              {!p.activo && <span className={badge("neutral")}>Inactiva</span>}
            </div>
          </div>
          <Link href={`/propiedades/${id}/editar`} className={ui.btnPrimary}>
            <Pencil size={16} />
            Editar
          </Link>
        </div>
      </div>

      <Bloque titulo="Ubicación">
        <Dato label="Región" value={p.region} />
        <Dato label="Comuna" value={p.comuna} />
        <Dato label="Tipo" value={TIPO_LABEL[p.tipo] ?? p.tipo} />
        <Dato label="Calle" value={p.direccion} />
        <Dato label="Número" value={p.numero} />
        <Dato label="Depto / Casa" value={p.departamento} />
        <Dato label="Rol SII" value={p.rol_sii} />
      </Bloque>

      <Bloque titulo="Características">
        <Dato label="Dormitorios" value={p.dormitorios} />
        <Dato label="Baños" value={p.banos} />
        <Dato label="Estacionamientos" value={p.estacionamientos} />
        <Dato label="Bodegas" value={p.bodegas} />
        <Dato label="Sup. útil" value={p.superficie_util_m2 ? `${p.superficie_util_m2} m²` : null} />
        <Dato label="Sup. total" value={p.superficie_total_m2 ? `${p.superficie_total_m2} m²` : null} />
      </Bloque>

      <Bloque titulo="Valorización">
        <Dato label="Moneda" value={p.moneda} />
        <Dato label="Valor ref. arriendo" value={dinero(p.valor_referencial_arriendo, p.moneda)} />
        <Dato label="Gasto común estimado" value={dinero(p.gasto_comun_estimado, p.moneda)} />
        <Dato label="Fecha adquisición" value={p.fecha_adquisicion} />
      </Bloque>

      {p.observaciones && (
        <div className={`${ui.card} p-5`}>
          <h2 className="mb-2 text-sm font-semibold text-ink">Observaciones</h2>
          <p className="text-sm text-ink">{p.observaciones}</p>
        </div>
      )}

      <div className={`${ui.card} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Propietarios asociados</h2>
          {asignados.length === 0 && (
            <Link
              href={`/propiedades/${id}/editar`}
              className={`${ui.btnSecondary} px-3 py-1.5 text-xs`}
            >
              Asignar propietario
            </Link>
          )}
        </div>
        {asignados.length === 0 ? (
          <p className="text-sm text-muted">Sin propietarios asociados.</p>
        ) : (
          <ul className="divide-y divide-line">
            {asignados.map((a) => (
              <li key={a.vinculo_id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">
                  {a.nombre} <span className="text-muted">· {a.rut}</span>
                </span>
                <EditarParticipacion
                  vinculoId={a.vinculo_id}
                  propiedadId={id}
                  valor={a.porcentaje_participacion}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
