import { misCargos } from "@/features/portal/queries";
import { ui, badge } from "@/components/ui";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";

const TIPO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
  luz: "Luz",
  agua: "Agua",
  internet: "Internet",
  multa: "Multa",
  ajuste: "Ajuste",
  otro: "Otro",
};

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  parcial: { label: "Parcial", tone: "info" },
  pagado: { label: "Pagado", tone: "success" },
  vencido: { label: "Vencido", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function PortalCargosPage() {
  const cargos = await misCargos();

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
            const est = ESTADO[c.estado] ?? { label: c.estado, tone: "neutral" as const };
            const saldo = Number(c.saldo_pendiente);
            return (
              <div key={c.id} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-white/60">{formatearPeriodo(c.periodo)}</p>
                    <p className="font-medium text-white">
                      {TIPO_LABEL[c.tipo_cargo] ?? c.tipo_cargo}
                    </p>
                    <p className="text-xs text-white/60">{c.propiedad_direccion}</p>
                  </div>
                  <span className={badge(est.tone)}>{est.label}</span>
                </div>

                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <span>Monto: {clp(Number(c.monto))}</span>
                  <span>Saldo pendiente: {clp(saldo)}</span>
                  <span>Vence: {formatearFecha(c.fecha_vencimiento)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
