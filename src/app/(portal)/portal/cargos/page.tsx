import Link from "next/link";
import { Eye, Send, ChevronDown } from "lucide-react";
import { misCargos } from "@/features/portal/queries";
import { misSolicitudes } from "@/features/solicitudes-pago/queries";
import { ui, badge } from "@/components/ui";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import type { CargoConContexto } from "@/features/cobros/types";
import type { SolicitudConContexto } from "@/features/solicitudes-pago/types";

const ESTADO_SOLICITUD: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pago informado — esperando validación", tone: "warning" },
  aprobada: { label: "Pago validado", tone: "success" },
  rechazada: { label: "Pago no validado", tone: "danger" },
};

/** El arriendo va primero; el resto sigue el orden en que se suele revisar. */
const ORDEN_TIPO = [
  "arriendo",
  "gasto_comun",
  "administracion",
  "luz",
  "agua",
  "internet",
  "multa",
  "ajuste",
  "otro",
];

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

type EstadoVista = { label: string; tone: Parameters<typeof badge>[0]; orden: number };

/** `vencido` no es un estado en la base: se deriva del saldo y el vencimiento. */
function estadoMostrar(
  estado: string,
  saldo: number,
  fechaVencimiento: string | null,
  hoy: string
): EstadoVista {
  if (estado === "pagado") return { label: "Pagado", tone: "success", orden: 3 };
  if (saldo > 0 && fechaVencimiento && fechaVencimiento < hoy) {
    return { label: "Vencido", tone: "danger", orden: 0 };
  }
  if (estado === "parcial") return { label: "Parcial", tone: "neutral", orden: 1 };
  return { label: "Pendiente", tone: "neutral", orden: 2 };
}

function ordenTipo(tipo: string): number {
  const i = ORDEN_TIPO.indexOf(tipo);
  return i === -1 ? ORDEN_TIPO.length : i;
}

type CargoVista = CargoConContexto & {
  saldo: number;
  est: EstadoVista;
  solicitud: SolicitudConContexto | undefined;
};

/** Estado → vencimiento → tipo (arriendo primero). */
function compararCargos(a: CargoVista, b: CargoVista): number {
  if (a.est.orden !== b.est.orden) return a.est.orden - b.est.orden;
  const va = a.fecha_vencimiento ?? "9999-12-31";
  const vb = b.fecha_vencimiento ?? "9999-12-31";
  if (va !== vb) return va < vb ? -1 : 1;
  return ordenTipo(a.tipo_cargo) - ordenTipo(b.tipo_cargo);
}

function TarjetaCargo({ c }: { c: CargoVista }) {
  const solicitudActiva = c.solicitud?.estado === "pendiente";
  const solicitudEstado = c.solicitud ? ESTADO_SOLICITUD[c.solicitud.estado] : null;

  return (
    <div className={ui.listCard}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-white">{etiquetaTipoCargo(c.tipo_cargo)}</p>
          <p className="truncate text-xs text-white/60">{c.propiedad_direccion}</p>
        </div>
        <span className={badge(c.est.tone)}>{c.est.label}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-white/80">
        <span>Deuda pendiente: {clp(c.saldo)}</span>
        <span>Monto: {clp(Number(c.monto))}</span>
        <span className="font-bold text-white">Vence: {formatearFecha(c.fecha_vencimiento)}</span>
        {(c.fecha_consumo_desde || c.fecha_consumo_hasta) && (
          <span>
            Consumo: {formatearFecha(c.fecha_consumo_desde)} – {formatearFecha(c.fecha_consumo_hasta)}
          </span>
        )}
      </div>

      {solicitudEstado && (
        <span className={`w-fit ${badge(solicitudEstado.tone)}`}>{solicitudEstado.label}</span>
      )}
      {c.solicitud?.estado === "rechazada" && c.solicitud.motivo_rechazo && (
        <p className="text-xs text-white/60">Motivo: {c.solicitud.motivo_rechazo}</p>
      )}

      {c.saldo > 0 && !solicitudActiva && (
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

      {c.solicitud && (
        <Link
          href={`/portal/cargos/${c.id}`}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          <Eye size={15} /> Ver pago informado
        </Link>
      )}
    </div>
  );
}

/** Cargos pagados del período: una línea por cargo, plegados tras un "ver más". */
function PagadosResumidos({ cargos }: { cargos: CargoVista[] }) {
  const total = cargos.reduce((acc, c) => acc + Number(c.monto), 0);

  return (
    <details className="rounded-xl bg-burgundy-strong/60 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm text-white/80 [&::-webkit-details-marker]:hidden hover:text-white">
        <span className="inline-flex items-center gap-1.5">
          <Eye size={14} /> {cargos.length} {cargos.length === 1 ? "pagado" : "pagados"} · {clp(total)}
        </span>
        <ChevronDown size={14} className="shrink-0" />
      </summary>
      <ul className="mt-3 flex flex-col divide-y divide-white/10">
        {cargos.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="text-white">{etiquetaTipoCargo(c.tipo_cargo)}</span>
              <span className="block text-xs font-bold text-white/70">
                Venció: {formatearFecha(c.fecha_vencimiento)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums text-white/80">{clp(Number(c.monto))}</span>
              <Link
                href={`/portal/cargos/${c.id}`}
                aria-label="Ver detalle"
                title="Ver detalle"
                className={ui.listCardIconBtn}
              >
                <Eye size={15} />
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default async function PortalCargosPage() {
  const [cargos, solicitudes] = await Promise.all([misCargos(), misSolicitudes()]);
  const hoy = new Date().toISOString().slice(0, 10);

  // Solicitud más reciente por cargo (una activa/pendiente a la vez en la práctica).
  const solicitudPorCargo = new Map<string, SolicitudConContexto>();
  for (const s of solicitudes) {
    const actual = solicitudPorCargo.get(s.cargo_id);
    if (!actual || s.created_at > actual.created_at) solicitudPorCargo.set(s.cargo_id, s);
  }

  const vista: CargoVista[] = cargos.map((c) => {
    const saldo = Number(c.saldo_pendiente);
    return {
      ...c,
      saldo,
      est: estadoMostrar(c.estado, saldo, c.fecha_vencimiento, hoy),
      solicitud: solicitudPorCargo.get(c.id),
    };
  });

  // Nivel superior: período, del más reciente al más antiguo.
  const periodos = [...new Set(vista.map((c) => c.periodo))].sort((a, b) => (a < b ? 1 : -1));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-canvas-fg">
          Mis cargos y pagos
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Cobros de arriendo y otros conceptos de tus contratos, agrupados por período.
        </p>
      </div>

      {vista.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No tienes cargos registrados.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {periodos.map((periodo) => {
            const delPeriodo = vista.filter((c) => c.periodo === periodo);
            const pendientes = delPeriodo.filter((c) => c.saldo > 0).sort(compararCargos);
            const pagados = delPeriodo.filter((c) => c.saldo <= 0).sort(compararCargos);
            const deuda = pendientes.reduce((acc, c) => acc + c.saldo, 0);

            return (
              // Abierto si queda algo por pagar; los períodos ya saldados parten plegados.
              <details
                key={periodo}
                open={deuda > 0}
                className="overflow-hidden rounded-xl bg-burgundy"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-white">{formatearPeriodo(periodo)}</span>
                  <span className="flex items-center gap-2 text-sm text-white/70">
                    {deuda > 0 ? `Deuda pendiente: ${clp(deuda)}` : "Sin deuda"}
                    <ChevronDown size={15} className="shrink-0" />
                  </span>
                </summary>

                <div className="flex flex-col gap-3 px-4 pb-4">
                  {pendientes.map((c) => (
                    <TarjetaCargo key={c.id} c={c} />
                  ))}
                  {pagados.length > 0 && <PagadosResumidos cargos={pagados} />}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
