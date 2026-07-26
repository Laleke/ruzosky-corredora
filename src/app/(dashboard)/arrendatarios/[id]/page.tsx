import { notFound } from "next/navigation";
import { getArrendatario, tieneContratosVinculados } from "@/features/arrendatarios/queries";
import { actualizarArrendatario } from "@/features/arrendatarios/actions";
import { DetalleArrendatario } from "@/features/arrendatarios/detalle-arrendatario";

export default async function DetalleArrendatarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [arrendatario, bloqueada] = await Promise.all([
    getArrendatario(id),
    tieneContratosVinculados(id),
  ]);
  if (!arrendatario) notFound();

  return (
    <DetalleArrendatario
      id={id}
      arrendatario={arrendatario}
      actualizarAction={actualizarArrendatario}
      eliminacionBloqueada={bloqueada}
    />
  );
}
