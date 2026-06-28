import { notFound } from "next/navigation";
import { ContratoForm } from "@/features/contratos/contrato-form";
import { AsignarArrendatario } from "@/features/contratos/asignar-arrendatario";
import {
  actualizarContrato,
  asignarArrendatario,
  quitarArrendatario,
} from "@/features/contratos/actions";
import {
  getContrato,
  getArrendatariosDeContrato,
} from "@/features/contratos/queries";
import { listPropiedades } from "@/features/propiedades/queries";
import { listArrendatarios } from "@/features/arrendatarios/queries";

function nombreArrendatario(a: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (a.tipo_persona === "persona_juridica") return a.razon_social ?? "—";
  return [a.nombre, a.apellido].filter(Boolean).join(" ") || "—";
}

export default async function DetalleContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contrato, vinculados, propiedades, arrendatarios] = await Promise.all([
    getContrato(id),
    getArrendatariosDeContrato(id),
    listPropiedades(),
    listArrendatarios(),
  ]);
  if (!contrato) notFound();

  const opcionesPropiedades = propiedades
    .filter((p) => p.activo || p.id === contrato.propiedad_id)
    .map((p) => ({
      id: p.id,
      label: `${p.codigo_interno ? `${p.codigo_interno} · ` : ""}${p.direccion}${
        p.numero ? ` ${p.numero}` : ""
      }`,
    }));

  const yaVinculados = new Set(vinculados.map((v) => v.arrendatario_id));
  const opcionesArrendatarios = arrendatarios
    .filter((a) => a.activo && !yaVinculados.has(a.id))
    .map((a) => ({ id: a.id, label: `${nombreArrendatario(a)} · ${a.rut}` }));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <h1 className="text-xl font-semibold">Editar contrato</h1>
        <ContratoForm
          action={actualizarContrato.bind(null, id)}
          contrato={contrato}
          propiedades={opcionesPropiedades}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Arrendatarios del contrato</h2>

        {vinculados.length === 0 ? (
          <p className="opacity-60">Sin arrendatarios asignados.</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Arrendatario</th>
                <th className="py-2 pr-4">RUT</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {vinculados.map((v) => (
                <tr key={v.vinculo_id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{v.nombre}</td>
                  <td className="py-2 pr-4">{v.rut}</td>
                  <td className="py-2 pr-4">
                    <form
                      action={quitarArrendatario.bind(null, v.vinculo_id, id)}
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
          <h3 className="mb-3 text-sm font-semibold">Asignar arrendatario</h3>
          <AsignarArrendatario
            action={asignarArrendatario.bind(null, id)}
            opciones={opcionesArrendatarios}
          />
        </div>
      </section>
    </div>
  );
}
