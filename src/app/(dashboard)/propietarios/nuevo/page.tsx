import { PropietarioWizard } from "@/features/propietarios/propietario-wizard";
import { crearPropietario } from "@/features/propietarios/actions";

export default function NuevoPropietarioPage() {
  return <PropietarioWizard action={crearPropietario} />;
}
