import { notFound, redirect } from "next/navigation";
import { getCargo } from "@/features/cobros/queries";
import { PagoWizard } from "@/features/cobros/pago-wizard";

export default async function NuevoPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cargo = await getCargo(id);
  if (!cargo) notFound();

  const saldo = Number(cargo.saldo_pendiente);
  if (saldo <= 0) redirect(`/cobros/${id}`);

  return <PagoWizard cargoId={id} saldoPendiente={saldo} />;
}
