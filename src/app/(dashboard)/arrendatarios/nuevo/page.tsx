import { ArrendatarioWizard } from "@/features/arrendatarios/arrendatario-wizard";
import { crearArrendatario } from "@/features/arrendatarios/actions";

export default function NuevoArrendatarioPage() {
  return <ArrendatarioWizard action={crearArrendatario} />;
}
