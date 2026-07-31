import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import {
  listArrendatarios,
  getOpcionesFiltroArrendatarios,
} from "@/features/arrendatarios/queries";
import { cambiarActivoArrendatario } from "@/features/arrendatarios/actions";
import { PageHeader } from "@/components/page-header";
import { ToggleSwitch } from "@/components/toggle-switch";
import { FiltroArrendatarios } from "@/features/arrendatarios/filtro-arrendatarios";
import { ui, badge } from "@/components/ui";

function nombreMostrar(a: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (a.tipo_persona === "persona_juridica") return a.razon_social ?? "—";
  return [a.nombre, a.apellido].filter(Boolean).join(" ") || "—";
}

type SP = { tipoPersona?: string; comuna?: string; region?: string; activo?: string };

export default async function ArrendatariosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const [arrendatarios, opciones] = await Promise.all([
    listArrendatarios(sp),
    getOpcionesFiltroArrendatarios(),
  ]);
  const hayFiltros = Boolean(sp.tipoPersona || sp.comuna || sp.region || sp.activo);

  return (
    <div>
      <PageHeader
        titulo="Arrendatarios"
        descripcion="Inquilinos vinculados a los contratos."
        accion={{ href: "/arrendatarios/nuevo", label: "Nuevo arrendatario" }}
        accionSecundaria={{ href: "/arrendatarios/invitar", label: "Invitar por WhatsApp" }}
      />

      <FiltroArrendatarios
        comunas={opciones.comunas}
        regiones={opciones.regiones}
        valores={sp}
        hayFiltros={hayFiltros}
      />

      {arrendatarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {hayFiltros
            ? "No hay arrendatarios con esos filtros."
            : "Aún no hay arrendatarios registrados."}
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {arrendatarios.map((a) => (
            <div
              key={a.id}
              className={`${ui.listCard} ${!a.activo ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-white/60">{a.rut}</p>
                  <p className="font-medium text-white">{nombreMostrar(a)}</p>
                </div>
                <span className={badge(a.activo ? "success" : "neutral")}>
                  {a.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <details className="min-w-0 flex-1">
                  <summary className={ui.listCardDisclosure}>
                    <Info size={14} /> Ver más información
                  </summary>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                    {a.email && <span>{a.email}</span>}
                    {a.telefono && <span>{a.telefono}</span>}
                    {a.comuna && <span>{a.comuna}</span>}
                  </div>
                </details>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/arrendatarios/${a.id}`}
                    aria-label="Editar / ver detalle"
                    title="Editar / ver detalle"
                    className={ui.listCardIconBtn}
                  >
                    <Pencil size={16} />
                  </Link>
                  <form action={cambiarActivoArrendatario.bind(null, a.id, !a.activo)}>
                    <ToggleSwitch on={a.activo} label={a.activo ? "Desactivar" : "Activar"} />
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
