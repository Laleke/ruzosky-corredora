import { PropiedadForm } from "@/features/propiedades/propiedad-form";
import { crearPropiedad } from "@/features/propiedades/actions";

export default function NuevaPropiedadPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nueva propiedad</h1>
      <PropiedadForm action={crearPropiedad} />
    </div>
  );
}
