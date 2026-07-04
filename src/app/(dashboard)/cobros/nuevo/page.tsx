import { CargoForm } from "@/features/cobros/cargo-form";
import {
  getOpcionesRelacion,
  getContextoVigentePorPropiedad,
} from "@/features/documentos/queries";

export default async function NuevoCargoPage() {
  const [opciones, contexto] = await Promise.all([
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Nuevo cargo
      </h1>
      <CargoForm propiedades={opciones.propiedades} contexto={contexto} />
    </div>
  );
}
