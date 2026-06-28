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
import { ui } from "@/components/ui";

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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Editar propiedad
        </h1>
        <PropiedadForm
          action={actualizarPropiedad.bind(null, id)}
          propiedad={propiedad}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-ink">Propietarios asociados</h2>
          <span className="text-sm text-muted">
            Participación total: <strong className="text-ink">{sumaParticipacion}%</strong>
          </span>
        </div>

        {asignados.length > 0 && (
          <div className={`${ui.card} overflow-hidden`}>
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Propietario</th>
                  <th className={ui.th}>RUT</th>
                  <th className={ui.th}>Participación</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {asignados.map((a) => (
                  <tr key={a.vinculo_id}>
                    <td className={`${ui.td} font-medium`}>{a.nombre}</td>
                    <td className={`${ui.td} text-muted`}>{a.rut}</td>
                    <td className={ui.td}>{a.porcentaje_participacion}%</td>
                    <td className={`${ui.td} text-right`}>
                      <form action={quitarPropietario.bind(null, a.vinculo_id, id)}>
                        <button type="submit" className="text-sm text-red-600 hover:text-red-700">
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

        <div className={`${ui.card} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-ink">Asignar propietario</h3>
          <AsignarPropietario
            action={asignarPropietario.bind(null, id)}
            opciones={opciones}
          />
        </div>
      </section>
    </div>
  );
}
