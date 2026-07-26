import Link from "next/link";
import { Info, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
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
                  <p className="font-medium text-white">{nombreMostrar(a)}</p>
                  <p className="text-sm text-white/60">{a.rut}</p>
                </div>
                <span className={badge(a.activo ? "success" : "neutral")}>
                  {a.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <details>
                <summary className={ui.listCardDisclosure}>
                  <Info size={14} /> Ver más información
                </summary>
                <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                  <span>{a.email ?? "—"}</span>
                  <span>{a.telefono ?? "—"}</span>
                </div>
              </details>

              <div className="mt-1 flex items-center justify-end gap-1 border-t border-white/15 pt-2">
                <Link
                  href={`/arrendatarios/${a.id}`}
                  aria-label="Editar"
                  title="Editar"
                  className={ui.listCardIconBtn}
                >
                  <Pencil size={16} />
                </Link>
                <form action={cambiarActivoArrendatario.bind(null, a.id, !a.activo)}>
                  <button
                    type="submit"
                    aria-label={a.activo ? "Desactivar" : "Activar"}
                    title={a.activo ? "Desactivar" : "Activar"}
                    className={ui.listCardIconBtn}
                  >
                    {a.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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
