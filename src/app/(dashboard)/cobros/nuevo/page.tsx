import { CargoForm } from "@/features/cobros/cargo-form";
import { listContratos } from "@/features/contratos/queries";

export default async function NuevoCargoPage() {
  const contratos = await listContratos();
  const opciones = contratos
    .filter((c) => c.activo)
    .map((c) => ({
      id: c.id,
      label: `${c.numero_contrato ?? "Contrato"} · ${c.propiedad_label}`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Nuevo cargo
      </h1>
      <CargoForm contratos={opciones} />
    </div>
  );
}
