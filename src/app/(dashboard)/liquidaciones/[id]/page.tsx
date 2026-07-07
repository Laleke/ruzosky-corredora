import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLiquidacion,
  getDetalles,
  getGastosDeLiquidacion,
} from "@/features/liquidaciones/queries";
import { anularLiquidacion } from "@/features/liquidaciones/actions";
import {
  BotonImprimir,
  MarcarPagadaForm,
} from "@/features/liquidaciones/acciones-detalle";
import { CATEGORIA_GASTO_LABEL } from "@/features/gastos/constants";
import { ui, badge } from "@/components/ui";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  pagada: { label: "Pagada", tone: "success" },
  anulada: { label: "Anulada", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function DetalleLiquidacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [liq, detalles, gastos] = await Promise.all([
    getLiquidacion(id),
    getDetalles(id),
    getGastosDeLiquidacion(id),
  ]);
  if (!liq) notFound();

  const ingresos = detalles.filter((d) => d.tipo === "ingreso");
  // Descuentos = comisiones/ajustes manuales + gastos del propietario, en un solo bloque.
  const comisionesYAjustes = detalles.filter(
    (d) => d.tipo === "descuento" && d.referencia_tipo !== "gasto"
  );
  type LineaDescuento = { key: string; label: string; sub: string | null; monto: number };
  const descuentos: LineaDescuento[] = [
    ...comisionesYAjustes.map((d) => ({
      key: d.id,
      label: d.concepto,
      sub:
        [d.referencia_tipo === "manual" ? "Ajuste manual" : null, d.observacion]
          .filter(Boolean)
          .join(" · ") || null,
      monto: d.monto,
    })),
    ...gastos.map((g) => ({
      key: g.gasto_id,
      label: g.descripcion,
      sub: `Gasto: ${
        CATEGORIA_GASTO_LABEL[g.categoria as keyof typeof CATEGORIA_GASTO_LABEL] ?? g.categoria
      } · ${g.fecha}`,
      monto: g.monto,
    })),
  ];
  const est = ESTADO[liq.estado] ?? { label: liq.estado, tone: "neutral" as const };

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <Link href="/liquidaciones" className="text-sm text-muted hover:text-ink">
          ← Volver a liquidaciones
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {liq.numero ?? "Liquidación"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Período {liq.periodo.slice(0, 7)} · {liq.propietario_nombre} · generada{" "}
            {liq.fecha_generacion}
          </p>
          <span className={`mt-2 inline-flex ${badge(est.tone)}`}>{est.label}</span>
        </div>
        <div className="no-print flex gap-2">
          <BotonImprimir />
          {liq.estado === "pendiente" && (
            <form action={anularLiquidacion.bind(null, id)}>
              <button type="submit" className={`${ui.btnSecondary} text-red-600`}>
                Anular
              </button>
            </form>
          )}
        </div>
      </div>

      <div className={`${ui.card} overflow-hidden`}>
        <div className="border-b border-line bg-stone-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Ingresos
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-line">
            {ingresos.length === 0 ? (
              <tr><td className={`${ui.td} text-muted`}>Sin ingresos.</td></tr>
            ) : (
              ingresos.map((d) => (
                <tr key={d.id}>
                  <td className={ui.td}>
                    {d.concepto}
                    {d.referencia_tipo === "manual" && (
                      <span className="ml-2 text-xs text-muted">(ajuste)</span>
                    )}
                    {d.observacion && (
                      <span className="block text-xs text-muted">{d.observacion}</span>
                    )}
                  </td>
                  <td className={`${ui.td} text-right font-medium`}>{clp(d.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={`${ui.card} overflow-hidden`}>
        <div className="border-b border-line bg-stone-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Descuentos
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-line">
            {descuentos.length === 0 ? (
              <tr><td className={`${ui.td} text-muted`}>Sin descuentos.</td></tr>
            ) : (
              descuentos.map((d) => (
                <tr key={d.key}>
                  <td className={ui.td}>
                    {d.label}
                    {d.sub && <span className="block text-xs text-muted">{d.sub}</span>}
                  </td>
                  <td className={`${ui.td} text-right font-medium`}>{clp(d.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={`${ui.card} flex flex-col gap-2 p-5`}>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total ingresos</span>
          <span>{clp(liq.subtotal_ingresos)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total descuentos</span>
          <span>− {clp(liq.subtotal_descuentos)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
          <span>Total a liquidar</span>
          <span>{clp(liq.total_liquidacion)}</span>
        </div>
      </div>

      {liq.estado === "pagada" && (
        <div className={`${ui.card} p-5 text-sm`}>
          <p className="font-medium text-ink">Pago registrado</p>
          <p className="mt-1 text-muted">
            Fecha de transferencia: {liq.fecha_pago ?? "—"}
            {liq.pago_observacion ? ` · ${liq.pago_observacion}` : ""}
          </p>
        </div>
      )}

      {liq.estado === "pendiente" && (
        <div className={`${ui.card} no-print p-5`}>
          <h2 className="mb-3 text-sm font-semibold text-ink">Registrar pago</h2>
          <MarcarPagadaForm id={id} />
        </div>
      )}

      {liq.observaciones && (
        <p className="text-sm text-muted">Observaciones: {liq.observaciones}</p>
      )}
    </div>
  );
}
