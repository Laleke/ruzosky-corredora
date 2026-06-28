import { PropietarioForm } from "@/features/propietarios/propietario-form";
import { crearPropietario } from "@/features/propietarios/actions";

export default function NuevoPropietarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Nuevo propietario
      </h1>
      <PropietarioForm action={crearPropietario} />
    </div>
  );
}
