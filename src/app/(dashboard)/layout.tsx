import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { APP_NAME, ROLES } from "@/config/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  // Defensa adicional al middleware: sin sesión o sin profile, fuera.
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3">
        <div className="flex items-baseline gap-4">
          <Link href="/dashboard" className="font-semibold">
            {APP_NAME}
          </Link>
          {profile.rol === ROLES.ADMIN && (
            <nav className="flex gap-4 text-sm">
              <Link href="/propiedades" className="hover:underline">
                Propiedades
              </Link>
              <Link href="/propietarios" className="hover:underline">
                Propietarios
              </Link>
              <Link href="/arrendatarios" className="hover:underline">
                Arrendatarios
              </Link>
            </nav>
          )}
          <span className="rounded bg-black/5 px-2 py-0.5 text-xs uppercase tracking-wide">
            {profile.rol}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-70">{profile.nombre ?? profile.email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-red-600 hover:underline">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
