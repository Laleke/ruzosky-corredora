import { solicitudesPendientes } from "@/features/solicitudes-pago/queries";
import { SolicitudesLista } from "@/features/solicitudes-pago/solicitudes-lista";

export default async function PortalSolicitudesPage() {
  const solicitudes = await solicitudesPendientes();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Solicitudes de pago
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Pagos reportados por tus arrendatarios, pendientes de tu aprobación.
        </p>
      </div>

      <SolicitudesLista solicitudes={solicitudes} />
    </div>
  );
}
