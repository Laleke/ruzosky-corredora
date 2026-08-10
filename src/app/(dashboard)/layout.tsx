import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { BannerNotificaciones } from "@/features/notificaciones/banner-notificaciones";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/portal");

  return (
    <div className="min-h-screen">
      <BackToDashboard />
      <Sidebar nombre={profile.nombre ?? profile.email ?? "Usuario"} rol={profile.rol} />
      <div className="print-reset md:pl-64">
        <BannerNotificaciones />
        <main className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
