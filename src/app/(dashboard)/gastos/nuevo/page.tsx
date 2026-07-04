import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { getArrendatariosPorPropiedad } from "@/features/gastos/queries";
import { GastoForm } from "@/features/gastos/gasto-form";
import { crearGasto } from "@/features/gastos/actions";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";

export default async function NuevoGastoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/gastos");

  const [opciones, arrendatariosPorPropiedad] = await Promise.all([
    getOpcionesRelacion(),
    getArrendatariosPorPropiedad(),
  ]);

  return (
    <div>
      <Link href="/gastos" className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>
      <PageHeader
        titulo="Registrar gasto"
        descripcion="Imputa el gasto a una propiedad y define quién lo asume."
      />
      <div className={`${ui.card} p-6`}>
        <GastoForm
          action={crearGasto}
          opciones={opciones}
          arrendatariosPorPropiedad={arrendatariosPorPropiedad}
        />
      </div>
    </div>
  );
}
