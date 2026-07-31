import { notFound, redirect } from "next/navigation";
import { miCargo } from "@/features/portal/queries";
import { SolicitudPagoWizard } from "@/features/solicitudes-pago/solicitud-wizard";

export default async function SolicitarPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cargo = await miCargo(id);
  if (!cargo) notFound();

  const saldo = Number(cargo.saldo_pendiente);
  if (saldo <= 0) redirect("/portal/cargos");

  return <SolicitudPagoWizard cargoId={id} saldoPendiente={saldo} />;
}
