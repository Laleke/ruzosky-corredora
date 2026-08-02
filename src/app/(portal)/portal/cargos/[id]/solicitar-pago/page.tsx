import { notFound, redirect } from "next/navigation";
import { miCargo } from "@/features/portal/queries";
import { miSolicitudPendiente } from "@/features/solicitudes-pago/queries";
import { SolicitudPagoWizard } from "@/features/solicitudes-pago/solicitud-wizard";

export default async function SolicitarPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cargo, solicitudExistente] = await Promise.all([
    miCargo(id),
    miSolicitudPendiente(id),
  ]);
  if (!cargo) notFound();

  const saldo = Number(cargo.saldo_pendiente);
  if (saldo <= 0 && !solicitudExistente) redirect("/portal/cargos");

  return (
    <SolicitudPagoWizard
      cargoId={id}
      saldoPendiente={saldo}
      solicitudExistente={solicitudExistente ?? undefined}
    />
  );
}
