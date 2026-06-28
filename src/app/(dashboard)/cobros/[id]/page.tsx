import { notFound } from "next/navigation";
import Link from "next/link";
import { RegistrarPago } from "@/features/cobros/registrar-pago";
import {
  registrarPago,
  eliminarPago,
  eliminarCargo,
} from "@/features/cobros/actions";
import { getCargo, getPagosDeCargo } from "@/features/cobros/queries";

const TIPO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
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
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Cargo — {TIPO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo}{" "}
            {cargo.periodo.slice(0, 7)}
          </h1>
          <form action={eliminarCargo.bind(null, id)}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Eliminar cargo
            </button>
          </form>
        </div>
        <p className="text-sm opacity-70">
          {cargo.numero_contrato ? `Contrato ${cargo.numero_contrato} · ` : ""}
          {cargo.propiedad_direccion}
        </p>
        <div className="mt-2 flex gap-8 text-sm">
          <span>
            Monto: <strong>{monto(cargo.monto)}</strong>
          </span>
          <span>
            Saldo pendiente: <strong>{monto(saldo)}</strong>
          </span>
          <span>Vence: {cargo.fecha_vencimiento ?? "—"}</span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Pagos</h2>
        {pagos.length === 0 ? (
          <p className="opacity-60">Sin pagos registrados.</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Medio</th>
                <th className="py-2 pr-4">Referencia</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{p.fecha_pago}</td>
                  <td className="py-2 pr-4">{monto(p.monto_pagado)}</td>
                  <td className="py-2 pr-4">{p.medio_pago ?? "—"}</td>
                  <td className="py-2 pr-4">{p.referencia ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <form action={eliminarPago.bind(null, p.id, id)}>
                      <button
                        type="submit"
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="max-w-2xl rounded-md border border-black/10 p-4">
          <h3 className="mb-3 text-sm font-semibold">Registrar pago</h3>
          <RegistrarPago
            action={registrarPago.bind(null, id)}
            saldoPendiente={saldo}
          />
        </div>
      </section>

      <Link href="/cobros" className="text-sm text-blue-700 hover:underline">
        ← Volver a cobros
      </Link>
    </div>
  );
}
