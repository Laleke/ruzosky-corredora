import { redirect } from "next/navigation";
import { getOpcionesRelacion, getContextoVigentePorPropiedad } from "@/features/documentos/queries";
import { IncidenciaWizard } from "@/features/incidencias/incidencia-wizard";
import { getCurrentProfile } from "@/lib/auth";

export default async function NuevaIncidenciaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/incidencias");

  const [opciones, contexto] = await Promise.all([
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);

  return <IncidenciaWizard propiedades={opciones.propiedades} contexto={contexto} />;
}
