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
        <div className={`${ui.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Nombre / Razón social</th>
                  <th className={ui.th}>RUT</th>
                  <th className={ui.th}>Email</th>
                  <th className={ui.th}>Teléfono</th>
                  <th className={ui.th}>Estado</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {propietarios.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-stone-50/50">
                    <td className={`${ui.td} font-medium`}>{nombreMostrar(p)}</td>
                    <td className={`${ui.td} text-muted`}>{p.rut}</td>
                    <td className={`${ui.td} text-muted`}>{p.email ?? "—"}</td>
                    <td className={`${ui.td} text-muted`}>{p.telefono ?? "—"}</td>
                    <td className={ui.td}>
                      <span className={badge(p.activo ? "success" : "neutral")}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <div className="flex justify-end gap-4">
                        <Link href={`/propietarios/${p.id}`} className={ui.linkAction}>
                          Editar
                        </Link>
                        <form
                          action={cambiarActivoPropietario.bind(null, p.id, !p.activo)}
                        >
                          <button type="submit" className="text-sm text-muted hover:text-ink">
                            {p.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      </div>
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
