import { notFound } from "next/navigation";
import Link from "next/link";
import { RegistrarPago } from "@/features/cobros/registrar-pago";
import {
  registrarPago,
  eliminarPago,
  eliminarCargo,
} from "@/features/cobros/actions";
import { getCargo, getPagosDeCargo } from "@/features/cobros/queries";
import { ui } from "@/components/ui";

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
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/cobros" className="text-sm text-muted hover:text-ink">
          ← Volver a cobros
        </Link>
      </div>

      <section className={`${ui.card} p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {TIPO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo} · {cargo.periodo.slice(0, 7)}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {cargo.numero_contrato ? `Contrato ${cargo.numero_contrato} · ` : ""}
              {cargo.propiedad_direccion}
            </p>
          </div>
          <form action={eliminarCargo.bind(null, id)}>
            <button type="submit" className="text-sm text-red-600 hover:text-red-700">
              Eliminar cargo
            </button>
          </form>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 px-4 py-3">
            <p className="text-xs text-muted">Monto</p>
            <p className="text-lg font-semibold text-ink">{monto(cargo.monto)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 px-4 py-3">
            <p className="text-xs text-muted">Saldo pendiente</p>
            <p className="text-lg font-semibold text-ink">{monto(saldo)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 px-4 py-3">
            <p className="text-xs text-muted">Vence</p>
            <p className="text-lg font-semibold text-ink">{cargo.fecha_vencimiento ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Pagos</h2>
        {pagos.length > 0 && (
          <div className={`${ui.card} overflow-hidden`}>
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Fecha</th>
                  <th className={ui.th}>Monto</th>
                  <th className={ui.th}>Medio</th>
                  <th className={ui.th}>Referencia</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className={`${ui.td} text-muted`}>{p.fecha_pago}</td>
                    <td className={`${ui.td} font-medium`}>{monto(p.monto_pagado)}</td>
                    <td className={`${ui.td} text-muted`}>{p.medio_pago ?? "—"}</td>
                    <td className={`${ui.td} text-muted`}>{p.referencia ?? "—"}</td>
                    <td className={`${ui.td} text-right`}>
                      <form action={eliminarPago.bind(null, p.id, id)}>
                        <button type="submit" className="text-sm text-red-600 hover:text-red-700">
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

        <div className={`${ui.card} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-ink">Registrar pago</h3>
          <RegistrarPago action={registrarPago.bind(null, id)} saldoPendiente={saldo} />
        </div>
      </section>
    </div>
  );
}
