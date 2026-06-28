import { notFound } from "next/navigation";
import { ArrendatarioForm } from "@/features/arrendatarios/arrendatario-form";
import { actualizarArrendatario } from "@/features/arrendatarios/actions";
import { getArrendatario } from "@/features/arrendatarios/queries";

export default async function EditarArrendatarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const arrendatario = await getArrendatario(id);
  if (!arrendatario) notFound();

  const action = actualizarArrendatario.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Editar arrendatario
      </h1>
      <ArrendatarioForm action={action} arrendatario={arrendatario} />
    </div>
  );
}
