import { notFound } from "next/navigation";
import { RegistrarPago } from "@/features/cobros/registrar-pago";
import {
  registrarPago,
  eliminarPago,
  eliminarCargo,
} from "@/features/cobros/actions";
import { getCargo, getPagosDeCargo } from "@/features/cobros/queries";
import { BotonVolver } from "@/components/boton-volver";

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
  const [cargo, pagos] = await Promise.all([
    getCargo(id),
    getPagosDeCargo(id),
  ]);
  if (!cargo) notFound();

  const saldo = Number(cargo.saldo_pendiente);

  return (
    <div className="flex flex-col gap-6">
      <BotonVolver label="Volver a cobros" />

      <section className="rounded-2xl bg-burgundy p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {TIPO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo} · {cargo.periodo.slice(0, 7)}
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
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-burgundy-strong px-4 py-3">
            <p className="text-xs text-white/60">Monto</p>
            <p className="text-lg font-semibold text-white">{monto(cargo.monto)}</p>
          </div>
          <div className="rounded-lg bg-burgundy-strong px-4 py-3">
            <p className="text-xs text-white/60">Saldo pendiente</p>
            <p className="text-lg font-semibold text-white">{monto(saldo)}</p>
          </div>
          <div className="rounded-lg bg-burgundy-strong px-4 py-3">
            <p className="text-xs text-white/60">Vence</p>
            <p className="text-lg font-semibold text-white">{cargo.fecha_vencimiento ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-canvas-fg">Pagos</h2>
        {pagos.length > 0 && (
          <div className="rounded-xl bg-burgundy overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/15">
                <tr>
                  <th className={thOscuro}>Fecha</th>
                  <th className={thOscuro}>Monto</th>
                  <th className={thOscuro}>Medio</th>
                  <th className={thOscuro}>Referencia</th>
                  <th className={thOscuro}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className={`${tdOscuro} text-white/70`}>{p.fecha_pago}</td>
                    <td className={`${tdOscuro} font-medium`}>{monto(p.monto_pagado)}</td>
                    <td className={`${tdOscuro} text-white/70`}>{p.medio_pago ?? "—"}</td>
                    <td className={`${tdOscuro} text-white/70`}>{p.referencia ?? "—"}</td>
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

        <div className="rounded-xl bg-burgundy p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Registrar pago</h3>
          <RegistrarPago action={registrarPago.bind(null, id)} saldoPendiente={saldo} />
        </div>
      </section>
    </div>
  );
}

const thOscuro = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60";
const tdOscuro = "px-4 py-3 text-sm text-white";
