import Link from "next/link";
import { listContratos } from "@/features/contratos/queries";
import { cambiarActivoContrato } from "@/features/contratos/actions";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  vigente: "Vigente",
  vencido: "Vencido",
  terminado: "Terminado",
  renovado: "Renovado",
};

function formatoCanon(monto: number, moneda: string): string {
  return moneda === "UF"
    ? `UF ${monto.toLocaleString("es-CL")}`
    : `$${monto.toLocaleString("es-CL")}`;
}

export default async function ContratosPage() {
  const contratos = await listContratos();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contratos</h1>
        <Link
          href="/contratos/nuevo"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo contrato
        </Link>
      </div>

      {contratos.length === 0 ? (
        <p className="opacity-60">Aún no hay contratos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">N°</th>
                <th className="py-2 pr-4">Propiedad</th>
                <th className="py-2 pr-4">Inicio</th>
                <th className="py-2 pr-4">Término</th>
                <th className="py-2 pr-4">Canon</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr key={c.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{c.numero_contrato ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {c.propiedad_codigo ? `${c.propiedad_codigo} · ` : ""}
                    {c.propiedad_direccion}
                  </td>
                  <td className="py-2 pr-4">{c.fecha_inicio}</td>
                  <td className="py-2 pr-4">{c.fecha_termino ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {formatoCanon(c.canon_monto, c.canon_moneda)}
                  </td>
                  <td className="py-2 pr-4">
                    {ESTADO_LABEL[c.estado] ?? c.estado}
                    {!c.activo && (
                      <span className="ml-1 text-black/40">(inactivo)</span>
                    )}
                  </td>
                  <td className="flex gap-3 py-2 pr-4">
                    <Link
                      href={`/contratos/${c.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Detalle
                    </Link>
                    <form
                      action={cambiarActivoContrato.bind(null, c.id, !c.activo)}
                    >
                      <button
                        type="submit"
                        className="text-black/50 hover:underline"
                      >
                        {c.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
