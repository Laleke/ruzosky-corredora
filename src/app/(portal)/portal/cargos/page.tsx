import Link from "next/link";
import { Eye, Send } from "lucide-react";
import { misCargos } from "@/features/portal/queries";
import { misSolicitudes } from "@/features/solicitudes-pago/queries";
import { ui, badge } from "@/components/ui";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";

function estadoMostrar(
  estado: string,
  saldo: number,
  fechaVencimiento: string | null,
  hoy: string
): { label: string; tone: Parameters<typeof badge>[0] } {
  if (estado === "pagado") return { label: "Pagado", tone: "success" };
  if (saldo > 0 && fechaVencimiento && fechaVencimiento < hoy) {
    return { label: "Vencido", tone: "danger" };
  }
  if (estado === "parcial") return { label: "Parcial", tone: "neutral" };
  return { label: "Pendiente", tone: "neutral" };
}

const ESTADO_SOLICITUD: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pago informado — esperando validación", tone: "warning" },
  aprobada: { label: "Pago validado", tone: "success" },
  rechazada: { label: "Pago no validado", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function PortalCargosPage() {
  const [cargos, solicitudes] = await Promise.all([misCargos(), misSolicitudes()]);
  const hoy = new Date().toISOString().slice(0, 10);

  // Solicitud más reciente por cargo (una activa/pendiente a la vez en la práctica).
  const solicitudPorCargo = new Map<string, (typeof solicitudes)[number]>();
  for (const s of solicitudes) {
    const actual = solicitudPorCargo.get(s.cargo_id);
    if (!actual || s.created_at > actual.created_at) solicitudPorCargo.set(s.cargo_id, s);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Mis cargos y pagos
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Cobros de arriendo y otros conceptos de tus contratos.
        </p>
      </div>

      {cargos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes cargos registrados.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {cargos.map((c) => {
            const saldo = Number(c.saldo_pendiente);
            const est = estadoMostrar(c.estado, saldo, c.fecha_vencimiento, hoy);
            const solicitud = solicitudPorCargo.get(c.id);
            const solicitudActiva = solicitud?.estado === "pendiente";
            const solicitudEstado = solicitud ? ESTADO_SOLICITUD[solicitud.estado] : null;

            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{formatearPeriodo(c.periodo)}</p>
                    <p className="font-medium text-white">
                      {etiquetaTipoCargo(c.tipo_cargo)}
                    </p>
                    <p className="text-xs text-white/60">{c.propiedad_direccion}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <span>Deuda pendiente: {clp(saldo)}</span>
                  <span>Monto: {clp(Number(c.monto))}</span>
                  <span>Vence: {formatearFecha(c.fecha_vencimiento)}</span>
                  {(c.fecha_consumo_desde || c.fecha_consumo_hasta) && (
                    <span>
                      Consumo: {formatearFecha(c.fecha_consumo_desde)} – {formatearFecha(c.fecha_consumo_hasta)}
                    </span>
                  )}
                </div>

                {solicitudEstado && (
                  <span className={`w-fit ${badge(solicitudEstado.tone)}`}>{solicitudEstado.label}</span>
                )}
                {solicitud?.estado === "rechazada" && solicitud.motivo_rechazo && (
                  <p className="text-xs text-white/60">Motivo: {solicitud.motivo_rechazo}</p>
                )}

                {saldo > 0 && !solicitudActiva && (
                  <div className="mt-1 flex flex-col gap-1">
                    <Link
                      href={`/portal/cargos/${c.id}/solicitar-pago`}
                      className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
                    >
                      <Send size={15} /> Informar pago
                    </Link>
                    <p className="text-center text-xs font-semibold text-white/80">
                      Quedará pendiente de validación del propietario.
                    </p>
                  </div>
                )}

                {solicitud && (
                  <Link
                    href={`/portal/cargos/${c.id}`}
                    className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    <Eye size={15} /> Ver pago informado
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
