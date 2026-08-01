import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";
import { usuariosPortal } from "@/features/portal/queries";
import { InvitarPortal } from "@/features/portal/invitar-portal";

const ENTIDAD_LABEL = { propietario: "Propietario", arrendatario: "Arrendatario" } as const;
const ENTIDAD_HREF = { propietario: "/propietarios", arrendatario: "/arrendatarios" } as const;

export default async function UsuariosPage() {
  const usuarios = await usuariosPortal();

  return (
    <div>
      <PageHeader
        titulo="Usuarios del portal"
        descripcion="Propietarios y arrendatarios con acceso al portal — reenvía la invitación o restablece su contraseña."
      />

      {usuarios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Nadie ha sido invitado al portal todavía. Invita desde la ficha de un propietario o
          arrendatario, o con &quot;Invitar por WhatsApp&quot; en sus listados.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {usuarios.map((u) => (
            <div key={`${u.entidad}-${u.entidadId}`} className={ui.listCard}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-white/60">{ENTIDAD_LABEL[u.entidad]}</p>
                  <p className="font-medium text-white">{u.nombre}</p>
                  {u.email && <p className="text-xs text-white/60">{u.email}</p>}
                </div>
                <Link
                  href={`${ENTIDAD_HREF[u.entidad]}/${u.entidadId}`}
                  className="text-xs font-medium text-white/70 hover:text-white hover:underline"
                >
                  Ver ficha
                </Link>
              </div>

              <InvitarPortal
                entidad={u.entidad}
                entidadId={u.entidadId}
                emailDefault={u.email}
                telefonoDefault={u.telefono}
                estadoInvitacion={u.estadoInvitacion}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
