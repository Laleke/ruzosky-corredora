import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import { listPropiedades } from "@/features/propiedades/queries";
import { cambiarActivoPropiedad } from "@/features/propiedades/actions";
import { PageHeader } from "@/components/page-header";
import { ToggleSwitch } from "@/components/toggle-switch";
import { ui, badge } from "@/components/ui";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  disponible: { label: "Disponible", tone: "neutral" },
  reservada: { label: "Reservada", tone: "info" },
  arrendada: { label: "Arrendada", tone: "success" },
  mantencion: { label: "Mantención", tone: "warning" },
  inactiva: { label: "Inactiva", tone: "danger" },
};

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

function formatoValor(valor: number | null, moneda: string): string {
  if (valor === null) return "—";
  return moneda === "UF"
    ? `UF ${valor.toLocaleString("es-CL")}`
    : `$${valor.toLocaleString("es-CL")}`;
}

export default async function PropiedadesPage() {
  const propiedades = await listPropiedades();

  return (
    <div>
      <PageHeader
        titulo="Propiedades"
        descripcion="Inmuebles en administración y su estado."
        accion={{ href: "/propiedades/nueva", label: "Nueva propiedad" }}
      />

      {propiedades.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay propiedades registradas.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {propiedades.map((p) => {
            const est = ESTADO[p.estado] ?? { label: p.estado, tone: "neutral" as const };
            return (
              <div
                key={p.id}
                className={`${ui.listCard} ${!p.activo ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">
                      {TIPO_LABEL[p.tipo] ?? p.tipo} - {p.comuna ?? "—"}
                    </p>
                    <p className="font-medium text-white">
                      {p.direccion ?? <span className="text-white/60">(sin dirección)</span>}
                      {p.numero ? ` ${p.numero}` : ""}
                      {p.departamento ? `, ${p.departamento}` : ""}
                    </p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <details className="min-w-0 flex-1">
                    <summary className={ui.listCardDisclosure}>
                      <Info size={14} /> Ver más información
                    </summary>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                      <span>{formatoValor(p.valor_referencial_arriendo, p.moneda)}</span>
                      {!!p.dormitorios && <span>{p.dormitorios} dormitorio(s)</span>}
                      {!!p.banos && <span>{p.banos} baño(s)</span>}
                      {!!p.estacionamientos && <span>Estacionamiento N° {p.estacionamientos}</span>}
                      {!!p.bodegas && <span>Bodega N° {p.bodegas}</span>}
                    </div>
                  </details>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/propiedades/${p.id}`}
                      aria-label="Editar / ver detalle"
                      title="Editar / ver detalle"
                      className={ui.listCardIconBtn}
                    >
                      <Pencil size={16} />
                    </Link>
                    <form action={cambiarActivoPropiedad.bind(null, p.id, !p.activo)}>
                      <ToggleSwitch on={p.activo} label={p.activo ? "Desactivar" : "Activar"} />
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
