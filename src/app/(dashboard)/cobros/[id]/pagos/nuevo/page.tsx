import { notFound, redirect } from "next/navigation";
import { getCargo } from "@/features/cobros/queries";
import { PagoWizard } from "@/features/cobros/pago-wizard";
import { getCurrentProfile } from "@/lib/auth";

export default async function NuevoPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cargo, profile] = await Promise.all([getCargo(id), getCurrentProfile()]);
  if (!cargo || !profile) notFound();

  const saldo = Number(cargo.saldo_pendiente);
  if (saldo <= 0) redirect(`/cobros/${id}`);

  return (
    <PagoWizard
      cargoId={id}
      saldoPendiente={saldo}
      contratoId={cargo.contrato_id}
      empresaId={profile.empresa_id}
    />
  );
}
