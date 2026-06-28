import { notFound } from "next/navigation";
import { PropiedadForm } from "@/features/propiedades/propiedad-form";
import { AsignarPropietario } from "@/features/propiedades/asignar-propietario";
import {
  actualizarPropiedad,
  asignarPropietario,
  quitarPropietario,
} from "@/features/propiedades/actions";
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

export default async function DetallePropiedadPage({
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
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Editar propiedad</h1>
        <PropiedadForm
          action={actualizarPropiedad.bind(null, id)}
          propiedad={propiedad}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Propietarios asociados</h2>
          <span className="text-sm opacity-60">
            Participación total: {sumaParticipacion}%
          </span>
        </div>

        {asignados.length === 0 ? (
          <p className="opacity-60">Sin propietarios asignados.</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Propietario</th>
                <th className="py-2 pr-4">RUT</th>
                <th className="py-2 pr-4">Participación</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {asignados.map((a) => (
                <tr key={a.vinculo_id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{a.nombre}</td>
                  <td className="py-2 pr-4">{a.rut}</td>
                  <td className="py-2 pr-4">{a.porcentaje_participacion}%</td>
                  <td className="py-2 pr-4">
                    <form
                      action={quitarPropietario.bind(null, a.vinculo_id, id)}
                    >
                      <button
                        type="submit"
                        className="text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="max-w-2xl rounded-md border border-black/10 p-4">
          <h3 className="mb-3 text-sm font-semibold">Asignar propietario</h3>
          <AsignarPropietario
            action={asignarPropietario.bind(null, id)}
            opciones={opciones}
          />
        </div>
      </section>
    </div>
  );
}
