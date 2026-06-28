import { getCurrentProfile } from "@/lib/auth";
import { ROLES } from "@/config/constants";

const SALUDO_POR_ROL: Record<string, string> = {
  [ROLES.ADMIN]: "Panel de administración de la corredora.",
  [ROLES.PROPIETARIO]: "Resumen de tus propiedades.",
  [ROLES.ARRENDATARIO]: "Resumen de tu arriendo.",
};

export default async function DashboardPage() {
  // El layout ya garantizó sesión; aquí solo leemos para personalizar.
  const profile = await getCurrentProfile();
  const mensaje = profile ? SALUDO_POR_ROL[profile.rol] : "";

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">
        Hola, {profile?.nombre ?? "usuario"}
      </h1>
      <p className="opacity-70">{mensaje}</p>
      <p className="mt-4 text-sm opacity-50">
        Aún no hay módulos de negocio. Próximo: propiedades.
      </p>
    </div>
  );
}
