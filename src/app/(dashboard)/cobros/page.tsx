import Link from "next/link";
import { listCargos } from "@/features/cobros/queries";
import { GenerarArriendos } from "@/features/cobros/generar-arriendos";

const TIPO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
  multa: "Multa",
  ajuste: "Ajuste",
  otro: "Otro",
};

function monto(n: number): string {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

/** Deriva 'vencido' en lectura: vencido si tiene saldo y pasó su vencimiento. */
function estadoMostrar(
  estado: string,
  saldo: number,
  fechaVencimiento: string | null,
  hoy: string
): { label: string; cls: string } {
  if (estado === "pagado") return { label: "Pagado", cls: "text-green-700" };
  if (saldo > 0 && fechaVencimiento && fechaVencimiento < hoy) {
    return { label: "Vencido", cls: "text-red-600" };
  }
  if (estado === "parcial") return { label: "Parcial", cls: "text-amber-600" };
  return { label: "Pendiente", cls: "text-black/60" };
}

export default async function CobrosPage() {
  const cargos = await listCargos();
  const hoy = new Date().toISOString().slice(0, 10);
  const deudaTotal = cargos.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cobros y pagos</h1>
        <Link
          href="/cobros/nuevo"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo cargo
        </Link>
      </div>

      <div className="rounded-md border border-black/10 p-4">
        <h2 className="mb-3 text-sm font-semibold">Generación asistida</h2>
        <GenerarArriendos />
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Cargos</h2>
        <span className="text-sm opacity-70">
          Deuda pendiente total: <strong>{monto(deudaTotal)}</strong>
        </span>
      </div>

      {cargos.length === 0 ? (
        <p className="opacity-60">Aún no hay cargos. Genera los del mes o crea uno.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Período</th>
                <th className="py-2 pr-4">Contrato / Propiedad</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Saldo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((c) => {
                const est = estadoMostrar(
                  c.estado,
                  Number(c.saldo_pendiente),
                  c.fecha_vencimiento,
                  hoy
                );
                return (
                  <tr key={c.id} className="border-b border-black/5">
                    <td className="py-2 pr-4">{c.periodo.slice(0, 7)}</td>
                    <td className="py-2 pr-4">
                      {c.numero_contrato ? `${c.numero_contrato} · ` : ""}
                      {c.propiedad_direccion}
                    </td>
                    <td className="py-2 pr-4">
                      {TIPO_LABEL[c.tipo_cargo] ?? c.tipo_cargo}
                    </td>
                    <td className="py-2 pr-4">{monto(c.monto)}</td>
                    <td className="py-2 pr-4">{monto(c.saldo_pendiente)}</td>
                    <td className={`py-2 pr-4 ${est.cls}`}>{est.label}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/cobros/${c.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        Detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
