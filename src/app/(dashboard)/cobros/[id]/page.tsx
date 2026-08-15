import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCargo, getPagosDeCargo } from "@/features/cobros/queries";
import { DetalleCargo } from "@/features/cobros/detalle-cargo";
import { PagosLista } from "@/features/cobros/pagos-lista";
import { BotonVolver } from "@/components/boton-volver";
import { getCurrentProfile } from "@/lib/auth";

export default async function DetalleCargoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cargo, pagos, profile] = await Promise.all([
    getCargo(id),
    getPagosDeCargo(id),
    getCurrentProfile(),
  ]);
  if (!cargo || !profile) notFound();

  const saldo = Number(cargo.saldo_pendiente);

  return (
    <div className="flex flex-col gap-6">
      <BotonVolver label="Volver a cobros" />

      <DetalleCargo id={id} cargo={cargo} />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-canvas-fg">Pagos</h2>

        {saldo > 0 ? (
          <Link
            href={`/cobros/${id}/pagos/nuevo`}
            className="flex items-center justify-center gap-2 rounded-xl bg-burgundy p-4 text-sm font-semibold text-white transition-colors hover:bg-burgundy-strong"
          >
            <Plus size={16} strokeWidth={2.5} /> Registrar pago
          </Link>
        ) : (
          <p className="text-sm text-canvas-muted">Cargo pagado por completo.</p>
        )}

        {pagos.length > 0 && (
          <PagosLista
            cargoId={id}
            pagos={pagos}
            contratoId={cargo.contrato_id}
            empresaId={profile.empresa_id}
            tipoCargo={cargo.tipo_cargo}
            periodo={cargo.periodo}
          />
        )}
      </section>
    </div>
  );
}
