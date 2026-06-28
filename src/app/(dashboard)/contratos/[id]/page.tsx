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
import { ui } from "@/components/ui";

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
      label: `${p.codigo_interno ? `${p.codigo_interno} · ` : ""}${
        p.direccion ?? "(sin dirección)"
      }${p.numero ? ` ${p.numero}` : ""}`,
    }));

  const yaVinculados = new Set(vinculados.map((v) => v.arrendatario_id));
  const opcionesArrendatarios = arrendatarios
    .filter((a) => a.activo && !yaVinculados.has(a.id))
    .map((a) => ({ id: a.id, label: `${nombreArrendatario(a)} · ${a.rut}` }));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Editar contrato
        </h1>
        <ContratoForm
          action={actualizarContrato.bind(null, id)}
          contrato={contrato}
          propiedades={opcionesPropiedades}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Arrendatarios del contrato</h2>

        {vinculados.length > 0 && (
          <div className={`${ui.card} overflow-hidden`}>
            <table className="w-full">
              <thead className="border-b border-line bg-stone-50/60">
                <tr>
                  <th className={ui.th}>Arrendatario</th>
                  <th className={ui.th}>RUT</th>
                  <th className={ui.th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {vinculados.map((v) => (
                  <tr key={v.vinculo_id}>
                    <td className={`${ui.td} font-medium`}>{v.nombre}</td>
                    <td className={`${ui.td} text-muted`}>{v.rut}</td>
                    <td className={`${ui.td} text-right`}>
                      <form action={quitarArrendatario.bind(null, v.vinculo_id, id)}>
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
          <h3 className="mb-3 text-sm font-semibold text-ink">Asignar arrendatario</h3>
          <AsignarArrendatario
            action={asignarArrendatario.bind(null, id)}
            opciones={opcionesArrendatarios}
          />
        </div>
      </section>
    </div>
  );
}
