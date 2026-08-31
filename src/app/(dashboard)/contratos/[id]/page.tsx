import { notFound } from "next/navigation";
import {
  getContrato,
  getArrendatariosDeContrato,
  tieneRelacionesBloqueantes,
} from "@/features/contratos/queries";
import {
  actualizarContrato,
  asignarArrendatario,
  quitarArrendatario,
} from "@/features/contratos/actions";
import { listPropiedades } from "@/features/propiedades/queries";
import { listArrendatarios } from "@/features/arrendatarios/queries";
import { etiquetaPropiedad } from "@/lib/propiedad";
import { DetalleContrato } from "@/features/contratos/detalle-contrato";
import { AsignarArrendatario } from "@/features/contratos/asignar-arrendatario";
import { listMovimientosGarantia, saldoGarantiaDisponible } from "@/features/garantia/queries";
import { SeccionGarantia } from "@/features/garantia/seccion-garantia";
import { getConfigNotificacionCobroContrato } from "@/features/notificaciones/config-notificaciones-cobro-queries";

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
  const [
    contrato,
    vinculados,
    propiedades,
    arrendatarios,
    relaciones,
    movimientosGarantia,
    configNotifCobro,
  ] = await Promise.all([
    getContrato(id),
    getArrendatariosDeContrato(id),
    listPropiedades(),
    listArrendatarios(),
    tieneRelacionesBloqueantes(id),
    listMovimientosGarantia(id),
    getConfigNotificacionCobroContrato(id),
  ]);
  if (!contrato) notFound();

  const propiedadActual = propiedades.find((p) => p.id === contrato.propiedad_id);
  const propiedadLabel = etiquetaPropiedad(propiedadActual);

  const opcionesPropiedades = propiedades
    .filter((p) => p.activo || p.id === contrato.propiedad_id)
    .map((p) => ({ id: p.id, label: etiquetaPropiedad(p) }));

  const yaVinculados = new Set(vinculados.map((v) => v.arrendatario_id));
  const opcionesArrendatarios = arrendatarios
    .filter((a) => a.activo && !yaVinculados.has(a.id))
    .map((a) => ({ id: a.id, label: `${nombreArrendatario(a)} · ${a.rut}` }));

  return (
    <div className="flex flex-col gap-6">
      <DetalleContrato
        id={id}
        contrato={contrato}
        propiedadLabel={propiedadLabel}
        propiedades={opcionesPropiedades}
        actualizarAction={actualizarContrato}
        eliminacionBloqueada={relaciones}
        configNotifCobro={configNotifCobro}
      />

      <div className="rounded-2xl bg-burgundy p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">Arrendatarios del contrato</h2>

        {vinculados.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-xl bg-burgundy-strong">
            <table className="w-full">
              <thead className="border-b border-white/15">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    Arrendatario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                    RUT
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15">
                {vinculados.map((v) => (
                  <tr key={v.vinculo_id}>
                    <td className="px-4 py-3 text-sm font-medium text-white">{v.nombre}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{v.rut}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={quitarArrendatario.bind(null, v.vinculo_id, id)}>
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
          <h3 className="mb-3 text-sm font-semibold text-white">Asignar arrendatario</h3>
          <AsignarArrendatario
            action={asignarArrendatario.bind(null, id)}
            opciones={opcionesArrendatarios}
          />
        </div>
      </div>

      <SeccionGarantia
        contratoId={id}
        movimientos={movimientosGarantia}
        saldoDisponible={saldoGarantiaDisponible(movimientosGarantia)}
      />
    </div>
  );
}
