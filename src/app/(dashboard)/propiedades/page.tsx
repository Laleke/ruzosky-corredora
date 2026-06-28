import Link from "next/link";
import { listPropiedades } from "@/features/propiedades/queries";
import { cambiarActivoPropiedad } from "@/features/propiedades/actions";

const ESTADO_LABEL: Record<string, string> = {
  disponible: "Disponible",
  reservada: "Reservada",
  arrendada: "Arrendada",
  mantencion: "Mantención",
  inactiva: "Inactiva",
};

function formatoValor(valor: number | null, moneda: string): string {
  if (valor === null) return "—";
  return moneda === "UF"
    ? `UF ${valor.toLocaleString("es-CL")}`
    : `$${valor.toLocaleString("es-CL")}`;
}

export default async function PropiedadesPage() {
  const propiedades = await listPropiedades();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Propiedades</h1>
        <Link
          href="/propiedades/nueva"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Nueva propiedad
        </Link>
      </div>

      {propiedades.length === 0 ? (
        <p className="opacity-60">Aún no hay propiedades registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Código</th>
                <th className="py-2 pr-4">Dirección</th>
                <th className="py-2 pr-4">Comuna</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Valor ref.</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{p.codigo_interno ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {p.direccion}
                    {p.numero ? ` ${p.numero}` : ""}
                    {p.departamento ? `, ${p.departamento}` : ""}
                  </td>
                  <td className="py-2 pr-4">{p.comuna ?? "—"}</td>
                  <td className="py-2 pr-4 capitalize">
                    {p.tipo.replace("_", " ")}
                  </td>
                  <td className="py-2 pr-4">
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                    {!p.activo && (
                      <span className="ml-1 text-black/40">(inactivo)</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {formatoValor(p.valor_referencial_arriendo, p.moneda)}
                  </td>
                  <td className="flex gap-3 py-2 pr-4">
                    <Link
                      href={`/propiedades/${p.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Detalle
                    </Link>
                    <form
                      action={cambiarActivoPropiedad.bind(null, p.id, !p.activo)}
                    >
                      <button
                        type="submit"
                        className="text-black/50 hover:underline"
                      >
                        {p.activo ? "Desactivar" : "Activar"}
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
