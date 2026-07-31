import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { ArrendatarioWizard } from "@/features/arrendatarios/arrendatario-wizard";
import { PropietarioWizard } from "@/features/propietarios/propietario-wizard";
import {
  completarPerfilArrendatario,
  completarPerfilPropietario,
} from "@/features/portal/actions";

/**
 * Wizard de alta self-service: quien fue invitado por WhatsApp sin ficha
 * previa (ver `invitarNuevo`) completa aquí sus propios datos. El layout del
 * portal ya garantiza que solo se llega acá si aún no existe la fila de
 * negocio vinculada a este profile.
 */
export default async function CompletarPerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol === "admin") redirect("/dashboard");

  if (profile.rol === "arrendatario") {
    return (
      <ArrendatarioWizard
        action={completarPerfilArrendatario}
        cancelarHref="/portal"
        draftKey="rzk:draft:completar-perfil-arrendatario"
      />
    );
  }

  return (
    <PropietarioWizard
      action={completarPerfilPropietario}
      cancelarHref="/portal"
      draftKey="rzk:draft:completar-perfil-propietario"
    />
  );
}
