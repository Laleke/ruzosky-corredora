import { notFound } from "next/navigation";
import { PropietarioForm } from "@/features/propietarios/propietario-form";
import { actualizarPropietario } from "@/features/propietarios/actions";
import { getPropietario } from "@/features/propietarios/queries";

export default async function EditarPropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propietario = await getPropietario(id);
  if (!propietario) notFound();

  // bind mantiene la server action serializable con firma (prev, formData).
  const action = actualizarPropietario.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Editar propietario</h1>
      <PropietarioForm action={action} propietario={propietario} />
    </div>
  );
}
