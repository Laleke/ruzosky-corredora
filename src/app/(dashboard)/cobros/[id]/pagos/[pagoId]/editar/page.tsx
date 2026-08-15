import { notFound } from "next/navigation";
import { getCargo, getPago } from "@/features/cobros/queries";
import { PagoWizard } from "@/features/cobros/pago-wizard";
import { getCurrentProfile } from "@/lib/auth";

export default async function EditarPagoPage({
  params,
}: {
  params: Promise<{ id: string; pagoId: string }>;
}) {
  const { id, pagoId } = await params;
  const [cargo, pago, profile] = await Promise.all([
    getCargo(id),
    getPago(pagoId),
    getCurrentProfile(),
  ]);
  if (!cargo || !pago || !profile || pago.cargo_id !== id) notFound();

  return (
    <PagoWizard
      cargoId={id}
      saldoPendiente={Number(cargo.saldo_pendiente)}
      contratoId={cargo.contrato_id}
      empresaId={profile.empresa_id}
      pagoExistente={pago}
    />
  );
}
