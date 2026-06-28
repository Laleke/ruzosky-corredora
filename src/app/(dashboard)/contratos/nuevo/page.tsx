import { ContratoForm } from "@/features/contratos/contrato-form";
import { crearContrato } from "@/features/contratos/actions";
import { listPropiedades } from "@/features/propiedades/queries";

export default async function NuevoContratoPage() {
  const propiedades = await listPropiedades();
  const opciones = propiedades
    .filter((p) => p.activo)
    .map((p) => ({
      id: p.id,
      label: `${p.codigo_interno ? `${p.codigo_interno} · ` : ""}${p.direccion}${
        p.numero ? ` ${p.numero}` : ""
      }`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nuevo contrato</h1>
      <ContratoForm action={crearContrato} propiedades={opciones} />
    </div>
  );
}
