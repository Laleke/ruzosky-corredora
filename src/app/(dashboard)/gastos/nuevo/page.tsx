import { redirect } from "next/navigation";
import { getOpcionesRelacion, getContextoVigentePorPropiedad } from "@/features/documentos/queries";
import { GastoWizard } from "@/features/gastos/gasto-wizard";
import { getCurrentProfile } from "@/lib/auth";

export default async function NuevoGastoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/gastos");

  const [opciones, contexto] = await Promise.all([
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);

  return <GastoWizard propiedades={opciones.propiedades} contexto={contexto} />;
}
