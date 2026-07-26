import Link from "next/link";
import { Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import {
  listPropietarios,
  getOpcionesFiltroPropietarios,
} from "@/features/propietarios/queries";
import { cambiarActivoPropietario } from "@/features/propietarios/actions";
import { PageHeader } from "@/components/page-header";
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
      />

      <form
        method="get"
        className={`${ui.card} mb-5 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Comuna</span>
          <select name="comuna" defaultValue={sp.comuna ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {opciones.comunas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Región</span>
          <select name="region" defaultValue={sp.region ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {opciones.regiones.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Activo</span>
          <select name="activo" defaultValue={sp.activo ?? ""} className={ui.input}>
            <option value="">Todos</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={ui.btnSecondary}>
            Filtrar
          </button>
          <Link href="/propietarios" className={ui.btnGhost}>
            Limpiar
          </Link>
        </div>
      </form>

      {propietarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          {hayFiltros
            ? "No hay propietarios con esos filtros."
            : "Aún no hay propietarios registrados."}
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {propietarios.map((p) => (
            <div key={p.id} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{nombreMostrar(p)}</p>
                  <p className="text-sm text-white/60">{p.rut}</p>
                </div>
                <span className={badge(p.activo ? "success" : "neutral")}>
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <details>
                <summary className={ui.listCardDisclosure}>
                  <Info size={14} /> Ver más información
                </summary>
                <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                  <span>{p.email ?? "—"}</span>
                  <span>{p.telefono ?? "—"}</span>
                </div>
              </details>

              <div className="mt-1 flex items-center justify-end gap-1 border-t border-white/15 pt-2">
                <Link
                  href={`/propietarios/${p.id}`}
                  aria-label="Editar"
                  title="Editar"
                  className={ui.listCardIconBtn}
                >
                  <Pencil size={16} />
                </Link>
                <form action={cambiarActivoPropietario.bind(null, p.id, !p.activo)}>
                  <button
                    type="submit"
                    aria-label={p.activo ? "Desactivar" : "Activar"}
                    title={p.activo ? "Desactivar" : "Activar"}
                    className={ui.listCardIconBtn}
                  >
                    {p.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
