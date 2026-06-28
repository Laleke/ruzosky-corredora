import Link from "next/link";
import { listArrendatarios } from "@/features/arrendatarios/queries";
import { cambiarActivoArrendatario } from "@/features/arrendatarios/actions";
import { PageHeader } from "@/components/page-header";
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

export default async function ArrendatariosPage() {
  const arrendatarios = await listArrendatarios();

  return (
    <div>
      <PageHeader
        titulo="Arrendatarios"
        descripcion="Inquilinos vinculados a los contratos."
        accion={{ href: "/arrendatarios/nuevo", label: "Nuevo arrendatario" }}
      />

      {arrendatarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay arrendatarios registrados.
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
                {arrendatarios.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-stone-50/50">
                    <td className={`${ui.td} font-medium`}>{nombreMostrar(a)}</td>
                    <td className={`${ui.td} text-muted`}>{a.rut}</td>
                    <td className={`${ui.td} text-muted`}>{a.email ?? "—"}</td>
                    <td className={`${ui.td} text-muted`}>{a.telefono ?? "—"}</td>
                    <td className={ui.td}>
                      <span className={badge(a.activo ? "success" : "neutral")}>
                        {a.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <div className="flex justify-end gap-4">
                        <Link href={`/arrendatarios/${a.id}`} className={ui.linkAction}>
                          Editar
                        </Link>
                        <form
                          action={cambiarActivoArrendatario.bind(null, a.id, !a.activo)}
                        >
                          <button type="submit" className="text-sm text-muted hover:text-ink">
                            {a.activo ? "Desactivar" : "Activar"}
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
