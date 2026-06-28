import { ArrendatarioForm } from "@/features/arrendatarios/arrendatario-form";
import { crearArrendatario } from "@/features/arrendatarios/actions";

export default function NuevoArrendatarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo arrendatario</h1>
      <ArrendatarioForm action={crearArrendatario} />
    </div>
  );
}
