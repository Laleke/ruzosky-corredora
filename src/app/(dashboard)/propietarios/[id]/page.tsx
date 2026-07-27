import { notFound } from "next/navigation";
import { getPropietario, tieneLiquidacionesVinculadas } from "@/features/propietarios/queries";
import { actualizarPropietario } from "@/features/propietarios/actions";
import { DetallePropietario } from "@/features/propietarios/detalle-propietario";

export default async function DetallePropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [propietario, bloqueada] = await Promise.all([
    getPropietario(id),
    tieneLiquidacionesVinculadas(id),
  ]);
  if (!propietario) notFound();

  return (
    <DetallePropietario
      id={id}
      propietario={propietario}
      actualizarAction={actualizarPropietario}
      eliminacionBloqueada={bloqueada}
    />
  );
}
