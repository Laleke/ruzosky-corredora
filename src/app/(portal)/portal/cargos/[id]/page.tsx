import { notFound } from "next/navigation";
import { miCargo, personasDeContrato } from "@/features/portal/queries";
import { miSolicitudDeCargo } from "@/features/solicitudes-pago/queries";
import { CargoDetalle } from "@/features/portal/cargo-detalle";

export default async function CargoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cargo = await miCargo(id);
  if (!cargo) notFound();

  const [personas, solicitud] = await Promise.all([
    personasDeContrato(cargo.contrato_id),
    miSolicitudDeCargo(id),
  ]);

  return (
    <CargoDetalle
      cargo={cargo}
      arrendatarios={personas.arrendatarios}
      propietarios={personas.propietarios}
      solicitud={solicitud}
    />
  );
}
