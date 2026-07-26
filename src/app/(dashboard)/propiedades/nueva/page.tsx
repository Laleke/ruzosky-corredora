import { PropiedadWizard } from "@/features/propiedades/propiedad-wizard";
import { crearPropiedad } from "@/features/propiedades/actions";

export default function NuevaPropiedadPage() {
  return <PropiedadWizard action={crearPropiedad} />;
}
