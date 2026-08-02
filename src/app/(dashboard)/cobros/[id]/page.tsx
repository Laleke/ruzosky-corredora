import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { eliminarPago, eliminarCargo } from "@/features/cobros/actions";
import { getCargo, getPagosDeCargo } from "@/features/cobros/queries";
import { ComprobantePago } from "@/features/cobros/comprobante-pago";
import { BotonVolver } from "@/components/boton-volver";
import { getCurrentProfile } from "@/lib/auth";
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

function monto(n: number | null): string {
  if (n === null) return "—";
  return `$${Number(n).toLocaleString("es-CL")}`;
}

export default async function DetalleCargoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cargo, pagos, profile] = await Promise.all([
    getCargo(id),
    getPagosDeCargo(id),
    getCurrentProfile(),
  ]);
  if (!cargo || !profile) notFound();

  const saldo = Number(cargo.saldo_pendiente);
  const pagado = Number(cargo.monto) - saldo;

  return (
    <div className="flex flex-col gap-6">
      <BotonVolver label="Volver a cobros" />

      <section className="rounded-2xl bg-burgundy p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {TIPO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo} · {formatearPeriodo(cargo.periodo)}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {cargo.numero_contrato ? `Contrato ${cargo.numero_contrato} · ` : ""}
              {cargo.propiedad_direccion}
            </p>
          </div>
          <form action={eliminarCargo.bind(null, id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90"
            >
              Eliminar cargo
            </button>
          </form>
        </div>
        <div className="mt-5 rounded-lg bg-burgundy-strong px-4 py-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/60">Monto</p>
              <p className="text-lg font-semibold text-white">{monto(cargo.monto)}</p>
            </div>
            {pagado > 0 && (
              <div>
                <p className="text-xs text-white/60">Pagado</p>
                <p className="text-lg font-semibold text-emerald-400">{monto(pagado)}</p>
              </div>
            )}
          </div>
          <div className="my-3 border-t border-white/10" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/60">Saldo pendiente</p>
              <p className="text-lg font-semibold text-white">{monto(saldo)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Vence</p>
              <p className="text-lg font-semibold text-white">{formatearFecha(cargo.fecha_vencimiento)}</p>
            </div>
          </div>
        </div>
        {(cargo.fecha_consumo_desde || cargo.fecha_consumo_hasta) && (
          <p className="mt-3 text-sm text-white/70">
            Período de consumo: {formatearFecha(cargo.fecha_consumo_desde)} –{" "}
            {formatearFecha(cargo.fecha_consumo_hasta)}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-canvas-fg">Pagos</h2>

        {saldo > 0 ? (
          <Link
            href={`/cobros/${id}/pagos/nuevo`}
            className="flex items-center justify-center gap-2 rounded-xl bg-burgundy p-4 text-sm font-semibold text-white transition-colors hover:bg-burgundy-strong"
          >
            <Plus size={16} strokeWidth={2.5} /> Registrar pago
          </Link>
        ) : (
          <p className="text-sm text-canvas-muted">Cargo pagado por completo.</p>
        )}

        {pagos.length > 0 && (
          <div className="rounded-xl bg-burgundy overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/15">
                <tr>
                  <th className={thOscuro}>Fecha</th>
                  <th className={thOscuro}>Monto</th>
                  <th className={thOscuro}>Medio</th>
                  <th className={thOscuro}>Referencia</th>
                  <th className={thOscuro}>Comprobante</th>
                  <th className={thOscuro}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className={`${tdOscuro} text-white/70`}>{formatearFecha(p.fecha_pago)}</td>
                    <td className={`${tdOscuro} font-medium`}>{monto(p.monto_pagado)}</td>
                    <td className={`${tdOscuro} text-white/70`}>{p.medio_pago ?? "—"}</td>
                    <td className={`${tdOscuro} text-white/70`}>{p.referencia ?? "—"}</td>
                    <td className={tdOscuro}>
                      <ComprobantePago
                        pagoId={p.id}
                        cargoId={id}
                        contratoId={cargo.contrato_id}
                        empresaId={profile.empresa_id}
                        tieneComprobante={Boolean(p.documento_id)}
                      />
                    </td>
                    <td className={`${tdOscuro} text-right`}>
                      <form action={eliminarPago.bind(null, p.id, id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90"
                        >
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const thOscuro = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60";
const tdOscuro = "px-4 py-3 text-sm text-white";
