import { misPropiedades } from "@/features/portal/queries";
import { etiquetaPropiedad } from "@/lib/propiedad";
import { ui, badge } from "@/components/ui";

export default async function PortalPropiedadesPage() {
  const propiedades = await misPropiedades();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Mis propiedades
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Propiedades de las que eres propietario o copropietario.
        </p>
      </div>

      {propiedades.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes propiedades asociadas.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {propiedades.map((p) => (
            <div key={p.id} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-white/60">{p.codigo_interno ?? "—"}</p>
                  <p className="font-medium text-white">{etiquetaPropiedad(p)}</p>
                </div>
                <span className={badge(p.activo ? "success" : "neutral")}>
                  {p.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-white/80">
                <span>Comuna: {p.comuna ?? "—"}</span>
                <span>Región: {p.region ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
