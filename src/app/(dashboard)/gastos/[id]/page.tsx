import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getGasto } from "@/features/gastos/queries";
import {
  CATEGORIA_GASTO_LABEL,
  ESTADO_GASTO,
  RESPONSABLE_GASTO_LABEL,
  clp,
} from "@/features/gastos/constants";
import { GastoAcciones } from "@/features/gastos/acciones";
import { getCurrentProfile } from "@/lib/auth";
import { ui, badge } from "@/components/ui";

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

export default async function GastoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const gasto = await getGasto(id);
  if (!gasto) notFound();

  const est = ESTADO_GASTO[gasto.estado];
  const ligado = Boolean(gasto.liquidacion_id);

  return (
    <div>
      <Link href="/gastos" className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {gasto.descripcion}
            </h1>
            <span className={badge(est.tone)}>{est.label}</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-burgundy">
            {clp(gasto.monto)}
          </p>
        </div>
        {!ligado && (
          <Link href={`/gastos/${id}/editar`} className={ui.btnSecondary}>
            <Pencil size={16} /> Editar
          </Link>
        )}
      </div>

      <div className={`${ui.card} mb-6 p-6`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Dato label="Fecha" valor={gasto.fecha} />
          <Dato label="Categoría" valor={CATEGORIA_GASTO_LABEL[gasto.categoria]} />
          <Dato label="Responsable" valor={RESPONSABLE_GASTO_LABEL[gasto.responsable_pago]} />
          <Dato label="Propiedad" valor={gasto.propiedad_label} />
          <Dato label="Contrato" valor={gasto.contrato_numero} />
          <Dato label="Propietario" valor={gasto.propietario_nombre} />
          <Dato label="Arrendatario" valor={gasto.arrendatario_nombre} />
          <Dato
            label="Descuenta de liquidación"
            valor={gasto.descontar_de_liquidacion ? "Sí" : "No"}
          />
          <Dato label="Registrado por" valor={gasto.creado_por_email} />
        </dl>
        {gasto.observaciones && (
          <div className="mt-4 border-t border-line pt-4">
            <dt className="text-xs uppercase tracking-wide text-muted">
              Observaciones
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {gasto.observaciones}
            </dd>
          </div>
        )}
      </div>

      <GastoAcciones id={id} estado={gasto.estado} ligadoALiquidacion={ligado} />
    </div>
  );
}
