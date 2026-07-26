import Link from "next/link";
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
                  <p className="font-medium text-ink">{nombreMostrar(p)}</p>
                  <p className="text-sm text-muted">{p.rut}</p>
                </div>
                <span className={badge(p.activo ? "success" : "neutral")}>
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="text-sm text-muted">
                <p>{p.email ?? "—"}</p>
                <p>{p.telefono ?? "—"}</p>
              </div>

              <div className="mt-1 flex items-center justify-end gap-4 border-t border-line pt-3">
                <Link href={`/propietarios/${p.id}`} className={ui.linkAction}>
                  Editar
                </Link>
                <form action={cambiarActivoPropietario.bind(null, p.id, !p.activo)}>
                  <button type="submit" className="text-sm text-muted hover:text-ink">
                    {p.activo ? "Desactivar" : "Activar"}
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
