import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AsignarPropietario } from "@/features/propiedades/asignar-propietario";
import { asignarPropietario, quitarPropietario } from "@/features/propiedades/actions";
import {
  getPropiedad,
  getPropietariosAsignados,
} from "@/features/propiedades/queries";
import { listPropietarios } from "@/features/propietarios/queries";

function nombrePropietario(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

/**
 * La edición de los campos de la propiedad ahora se hace en línea en
 * `/propiedades/[id]` (botón "Editar" en esa misma pantalla). Esta página
 * queda dedicada solo a la gestión de copropietarios (tabla + asignación),
 * que es un flujo de varias filas distinto a editar un registro único.
 */
export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [propiedad, asignados, propietarios] = await Promise.all([
    getPropiedad(id),
    getPropietariosAsignados(id),
    listPropietarios(),
  ]);
  if (!propiedad) notFound();

  const yaAsignados = new Set(asignados.map((a) => a.propietario_id));
  const opciones = propietarios
    .filter((p) => p.activo && !yaAsignados.has(p.id))
    .map((p) => ({ id: p.id, label: `${nombrePropietario(p)} · ${p.rut}` }));

  const sumaParticipacion = asignados.reduce(
    (acc, a) => acc + Number(a.porcentaje_participacion),
    0
  );

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <Link
        href={`/propiedades/${id}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver al detalle
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        Copropietarios
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-white">Propietarios asociados</h2>
          <span className="text-sm text-white/70">
            Participación total: <strong className="text-white">{sumaParticipacion}%</strong>
          </span>
        </div>

        {asignados.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-burgundy-strong">
            <table className="w-full">
              <thead className="border-b border-white/15">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Propietario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    RUT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Participación
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15">
                {asignados.map((a) => (
                  <tr key={a.vinculo_id}>
                    <td className="px-4 py-3 text-sm font-medium text-white">{a.nombre}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{a.rut}</td>
                    <td className="px-4 py-3 text-sm text-white">{a.porcentaje_participacion}%</td>
                    <td className="px-4 py-3 text-right">
                      <form action={quitarPropietario.bind(null, a.vinculo_id, id)}>
                        <button type="submit" className="text-sm text-red-300 hover:text-red-200">
                          Quitar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-xl bg-burgundy-strong p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Asignar propietario</h3>
          <AsignarPropietario
            action={asignarPropietario.bind(null, id)}
            opciones={opciones}
          />
        </div>
      </div>
    </div>
  );
}
