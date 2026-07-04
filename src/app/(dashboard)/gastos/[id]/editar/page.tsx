import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGasto, getArrendatariosPorPropiedad } from "@/features/gastos/queries";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { GastoForm } from "@/features/gastos/gasto-form";
import { actualizarGasto } from "@/features/gastos/actions";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/gastos");

  const [gasto, opciones, arrendatariosPorPropiedad] = await Promise.all([
    getGasto(id),
    getOpcionesRelacion(),
    getArrendatariosPorPropiedad(),
  ]);
  if (!gasto) notFound();
  if (gasto.liquidacion_id) redirect(`/gastos/${id}`);

  const action = actualizarGasto.bind(null, id);

  return (
    <div>
      <Link href={`/gastos/${id}`} className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>
      <PageHeader titulo="Editar gasto" />
      <div className={`${ui.card} p-6`}>
        <GastoForm
          action={action}
          opciones={opciones}
          gasto={gasto}
          arrendatariosPorPropiedad={arrendatariosPorPropiedad}
        />
      </div>
    </div>
  );
}
