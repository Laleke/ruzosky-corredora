import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPropiedad,
  getPropietariosAsignados,
} from "@/features/propiedades/queries";
import { actualizarPropiedad } from "@/features/propiedades/actions";
import { EditarParticipacion } from "@/features/propiedades/editar-participacion";
import { PropiedadDetalle } from "@/features/propiedades/detalle-propiedad";
import { badge } from "@/components/ui";

export default async function DetallePropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, asignados] = await Promise.all([
    getPropiedad(id),
    getPropietariosAsignados(id),
  ]);
  if (!p) notFound();

  const suma = asignados.reduce(
    (acc, a) => acc + Number(a.porcentaje_participacion),
    0
  );
  const completo = suma === 100;
  const falta = Math.round((100 - suma) * 100) / 100;

  return (
    <div className="flex flex-col gap-6">
      <PropiedadDetalle id={id} propiedad={p} actualizarAction={actualizarPropiedad} />

      <div className="rounded-2xl bg-burgundy p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Propietarios asociados</h2>
          {suma < 100 && (
            <Link
              href={`/propiedades/${id}/editar`}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
            >
              Agregar copropietario
            </Link>
          )}
        </div>

        {asignados.length > 0 && (
          <ul className="mb-3 divide-y divide-white/15">
            {asignados.map((a) => (
              <li
                key={a.vinculo_id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-white">
                  {a.nombre} <span className="text-white/60">· {a.rut}</span>
                </span>
                <EditarParticipacion
                  vinculoId={a.vinculo_id}
                  propiedadId={id}
                  valor={a.porcentaje_participacion}
                />
              </li>
            ))}
          </ul>
        )}

        {completo ? (
          <p className="flex items-center gap-2 text-sm text-white/90">
            <span className={badge("success")}>100%</span> Participación completa.
          </p>
        ) : (
          <div className="rounded-lg bg-amber-600/20 px-3 py-2 text-sm text-white">
            {asignados.length === 0 ? (
              <>Sin propietarios asociados. Falta asignar el 100%.</>
            ) : (
              <>
                Participación total: <strong>{suma}%</strong>. Falta asignar{" "}
                <strong>{falta}%</strong> — agrega uno o más copropietarios hasta
                completar el 100%.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
