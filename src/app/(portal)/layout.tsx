import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalSidebar } from "@/features/portal/portal-sidebar";
import { BackToDashboard } from "@/components/back-to-dashboard";
import type { EntidadPortal } from "@/features/portal/types";

const TABLA: Record<EntidadPortal, "propietarios" | "arrendatarios"> = {
  propietario: "propietarios",
  arrendatario: "arrendatarios",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol === "admin") redirect("/dashboard");

  const rol = profile.rol as EntidadPortal;

  const supabase = await createClient();
  await supabase
    .from(TABLA[rol])
    .update({ estado_invitacion: "activo" })
    .eq("profile_id", profile.id)
    .eq("estado_invitacion", "invitado");

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
