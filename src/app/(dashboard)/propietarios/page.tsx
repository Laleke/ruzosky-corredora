import Link from "next/link";
import { Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { listPropietarios } from "@/features/propietarios/queries";
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

export default async function PropietariosPage() {
  const propietarios = await listPropietarios();

  return (
    <div>
      <PageHeader
        titulo="Propietarios"
        descripcion="Dueños de las propiedades en administración."
        accion={{ href: "/propietarios/nuevo", label: "Nuevo propietario" }}
      />

      {propietarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay propietarios registrados.
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
