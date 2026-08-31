import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGasto } from "@/features/gastos/queries";
import {
  getOpcionesRelacion,
  getContextoVigentePorPropiedad,
} from "@/features/documentos/queries";
import { DetalleGasto } from "@/features/gastos/detalle-gasto";
import { getCurrentProfile } from "@/lib/auth";
import { ui } from "@/components/ui";

export default async function GastoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [gasto, opciones, contexto] = await Promise.all([
    getGasto(id),
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);
  if (!gasto) notFound();

  return (
    <div>
      <Link href="/gastos" className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>

      <DetalleGasto
        id={id}
        gasto={gasto}
        opciones={opciones}
        contexto={contexto}
        empresaId={profile.empresa_id}
      />
    </div>
  );
}
