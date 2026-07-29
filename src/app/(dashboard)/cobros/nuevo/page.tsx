import { CargoWizard } from "@/features/cobros/cargo-wizard";
import {
  getOpcionesRelacion,
  getContextoVigentePorPropiedad,
} from "@/features/documentos/queries";

export default async function NuevoCargoPage() {
  const [opciones, contexto] = await Promise.all([
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);

  return <CargoWizard propiedades={opciones.propiedades} contexto={contexto} />;
}
