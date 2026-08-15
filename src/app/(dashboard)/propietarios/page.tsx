import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import {
  listPropietarios,
  getOpcionesFiltroPropietarios,
} from "@/features/propietarios/queries";
import { cambiarActivoPropietario } from "@/features/propietarios/actions";
import { PageHeader } from "@/components/page-header";
import { ToggleSwitch } from "@/components/toggle-switch";
import { FiltroPropietarios } from "@/features/propietarios/filtro-propietarios";
import { ui, badge } from "@/components/ui";

function nombreMostrar(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

type SP = { comuna?: string; region?: string; activo?: string };

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const [propietarios, opciones] = await Promise.all([
    listPropietarios(sp),
    getOpcionesFiltroPropietarios(),
  ]);
  const hayFiltros = Boolean(sp.comuna || sp.region || sp.activo);

  return (
    <div>
      <PageHeader
        titulo="Propietarios"
        descripcion="Dueños de las propiedades en administración."
        accion={{ href: "/propietarios/nuevo", label: "Nuevo propietario" }}
        accionSecundaria={{ href: "/propietarios/invitar", label: "Invitar por WhatsApp" }}
      />

      <FiltroPropietarios
        comunas={opciones.comunas}
        regiones={opciones.regiones}
        valores={sp}
        hayFiltros={hayFiltros}
      />

      {propietarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {hayFiltros
            ? "No hay propietarios con esos filtros."
            : "Aún no hay propietarios registrados."}
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {propietarios.map((p) => (
            <div
              key={p.id}
              className={`${ui.listCard} ${!p.activo ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-white/60">{p.rut}</p>
                  <p className="font-medium text-white">{nombreMostrar(p)}</p>
                </div>
                <span className={badge(p.activo ? "success" : "neutral")}>
                  {p.activo ? "Activo" : "Inactivo"}
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
                    {p.email && <span>{p.email}</span>}
                    {p.telefono && <span>{p.telefono}</span>}
                    {p.comuna && <span>{p.comuna}</span>}
                  </div>
                </details>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/propietarios/${p.id}`}
                    aria-label="Editar / ver detalle"
                    title="Editar / ver detalle"
                    className={ui.listCardIconBtn}
                  >
                    <Pencil size={16} />
                  </Link>
                  <form action={cambiarActivoPropietario.bind(null, p.id, !p.activo)}>
                    <ToggleSwitch on={p.activo} label={p.activo ? "Desactivar" : "Activar"} />
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
