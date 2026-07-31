import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalSidebar } from "@/features/portal/portal-sidebar";
import { BackToDashboard } from "@/components/back-to-dashboard";
import type { EntidadPortal } from "@/features/portal/types";

const TABLA: Record<EntidadPortal, "propietarios" | "arrendatarios"> = {
  propietario: "propietarios",
  arrendatario: "arrendatarios",
};

const RUTA_COMPLETAR_PERFIL = "/portal/completar-perfil";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol === "admin") redirect("/dashboard");

  const rol = profile.rol as EntidadPortal;
  const pathname = (await headers()).get("x-pathname") ?? "";

  const supabase = await createClient();
  const { data: fila } = await supabase
    .from(TABLA[rol])
    .select("id, estado_invitacion")
    .eq("profile_id", profile.id)
    .maybeSingle();

  // Invitado por WhatsApp sin ficha previa (ver `invitarNuevo`): todavía no
  // existe fila de negocio vinculada — debe completarla antes de usar el
  // resto del portal (todo lo demás quedaría vacío igual, por RLS).
  if (!fila) {
    if (pathname === RUTA_COMPLETAR_PERFIL) return <>{children}</>;
    redirect(RUTA_COMPLETAR_PERFIL);
  } else if (pathname === RUTA_COMPLETAR_PERFIL) {
    // Ya completó su ficha — no tiene nada que hacer en ese wizard.
    redirect("/portal");
  } else if (fila.estado_invitacion === "invitado") {
    await supabase
      .from(TABLA[rol])
      .update({ estado_invitacion: "activo" })
      .eq("id", fila.id);
  }

  return (
    <div className="min-h-screen">
      <BackToDashboard home="/portal" />
      <PortalSidebar nombre={profile.nombre ?? profile.email ?? "Usuario"} rol={rol} />
      <div className="print-reset md:pl-64">
        <main className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
