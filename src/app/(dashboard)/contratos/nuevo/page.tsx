import { ContratoWizard } from "@/features/contratos/contrato-wizard";
import { crearContrato } from "@/features/contratos/actions";
import { listPropiedades } from "@/features/propiedades/queries";
import { etiquetaPropiedad } from "@/lib/propiedad";

export default async function NuevoContratoPage() {
  const propiedades = await listPropiedades();
  const opciones = propiedades
    .filter((p) => p.activo)
    .map((p) => ({ id: p.id, label: etiquetaPropiedad(p) }));

  return <ContratoWizard action={crearContrato} propiedades={opciones} />;
}
