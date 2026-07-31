import { PageHeader } from "@/components/page-header";
import { solicitudesPendientes } from "@/features/solicitudes-pago/queries";
import { SolicitudesLista } from "@/features/solicitudes-pago/solicitudes-lista";

export default async function SolicitudesPagoAdminPage() {
  const solicitudes = await solicitudesPendientes();

  return (
    <div>
      <PageHeader
        titulo="Solicitudes de pago"
        descripcion="Pagos reportados por arrendatarios desde el portal, pendientes de aprobación."
      />
      <SolicitudesLista solicitudes={solicitudes} />
    </div>
  );
}
