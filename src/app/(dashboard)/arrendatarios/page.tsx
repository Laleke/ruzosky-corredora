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
        <div className={ui.cardGrid}>
          {arrendatarios.map((a) => (
            <div key={a.id} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{nombreMostrar(a)}</p>
                  <p className="text-sm text-muted">{a.rut}</p>
                </div>
                <span className={badge(a.activo ? "success" : "neutral")}>
                  {a.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="text-sm text-muted">
                <p>{a.email ?? "—"}</p>
                <p>{a.telefono ?? "—"}</p>
              </div>

              <div className="mt-1 flex items-center justify-end gap-4 border-t border-line pt-3">
                <Link href={`/arrendatarios/${a.id}`} className={ui.linkAction}>
                  Editar
                </Link>
                <form action={cambiarActivoArrendatario.bind(null, a.id, !a.activo)}>
                  <button type="submit" className="text-sm text-muted hover:text-ink">
                    {a.activo ? "Desactivar" : "Activar"}
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
