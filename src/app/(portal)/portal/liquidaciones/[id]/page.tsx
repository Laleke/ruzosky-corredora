import { notFound } from "next/navigation";
import { miLiquidacion } from "@/features/portal/queries";
import { BotonVolver } from "@/components/boton-volver";
import { badge } from "@/components/ui";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  pagada: { label: "Pagada", tone: "success" },
  anulada: { label: "Anulada", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function PortalDetalleLiquidacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await miLiquidacion(id);
  if (!res) notFound();
  const { liquidacion: liq, detalles } = res;

  const ingresos = detalles.filter((d) => d.tipo === "ingreso");
  const descuentos = detalles.filter((d) => d.tipo === "descuento");
  const est = ESTADO[liq.estado] ?? { label: liq.estado, tone: "neutral" as const };

  return (
    <div className="flex flex-col gap-6">
      <BotonVolver label="Volver a mis liquidaciones" />

      <section className="rounded-2xl bg-burgundy p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Período {formatearPeriodo(liq.periodo)}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Generada {formatearFecha(liq.fecha_generacion)}
            </p>
          </div>
          <span className={badge(est.tone)}>{est.label}</span>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="rounded-xl bg-burgundy-strong overflow-hidden">
            <div className="border-b border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Ingresos
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-white/10">
                {ingresos.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-white/60">Sin ingresos.</td>
                  </tr>
                ) : (
                  ingresos.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-sm text-white">{d.concepto}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">
                        {clp(d.monto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-burgundy-strong overflow-hidden">
            <div className="border-b border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/60">
              Descuentos
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-white/10">
                {descuentos.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-sm text-white/60">Sin descuentos.</td>
                  </tr>
                ) : (
                  descuentos.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-sm text-white">{d.concepto}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">
                        {clp(d.monto)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-burgundy-strong p-5">
            <div className="flex justify-between text-sm text-white/80">
              <span>Total ingresos</span>
              <span>{clp(liq.subtotal_ingresos)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>Total descuentos</span>
              <span>− {clp(liq.subtotal_descuentos)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-white/15 pt-2 text-base font-semibold text-white">
              <span>Total liquidado</span>
              <span>{clp(liq.total_liquidacion)}</span>
            </div>
          </div>

          {liq.estado === "pagada" && (
            <div className="rounded-xl bg-burgundy-strong p-5 text-sm text-white/80">
              <p className="font-medium text-white">Pago registrado</p>
              <p className="mt-1">
                Fecha de transferencia: {formatearFecha(liq.fecha_pago)}
                {liq.pago_observacion ? ` · ${liq.pago_observacion}` : ""}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
