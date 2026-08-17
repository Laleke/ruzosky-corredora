import { notFound } from "next/navigation";
import { getIncidencia } from "@/features/incidencias/queries";
import { DetalleIncidencia } from "@/features/incidencias/detalle-incidencia";

export default async function DetalleIncidenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incidencia = await getIncidencia(id);
  if (!incidencia) notFound();

  return <DetalleIncidencia id={id} incidencia={incidencia} />;
}
