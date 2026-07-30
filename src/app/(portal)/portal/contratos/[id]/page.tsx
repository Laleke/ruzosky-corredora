import { notFound } from "next/navigation";
import { miContrato } from "@/features/portal/queries";
import { BotonVolver } from "@/components/boton-volver";
import { badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  vigente: { label: "Vigente", tone: "success" },
  vencido: { label: "Vencido", tone: "warning" },
  terminado: { label: "Terminado", tone: "neutral" },
  renovado: { label: "Renovado", tone: "info" },
};

function formatoCanon(monto: number, moneda: string): string {
  return moneda === "UF"
    ? `UF ${monto.toLocaleString("es-CL")}`
    : `$${monto.toLocaleString("es-CL")}`;
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value || "—"}</dd>
    </div>
  );
}

export default async function PortalDetalleContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contrato = await miContrato(id);
  if (!contrato) notFound();

  const est = ESTADO[contrato.estado] ?? { label: contrato.estado, tone: "neutral" as const };

  return (
    <div className="flex flex-col gap-6">
      <BotonVolver label="Volver a mis contratos" />

      <section className="rounded-2xl bg-burgundy p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {contrato.numero_contrato ?? "Contrato"}
            </h1>
            <p className="mt-1 text-sm text-white/70">{contrato.propiedad_direccion}</p>
          </div>
          <span className={badge(est.tone)}>{est.label}</span>
        </div>

        <div className="mt-5 rounded-xl bg-burgundy-strong p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Dato label="Fecha de inicio" value={formatearFecha(contrato.fecha_inicio)} />
            <Dato label="Fecha de término" value={formatearFecha(contrato.fecha_termino)} />
            <Dato
              label="Canon actual"
              value={formatoCanon(contrato.canon_actual ?? contrato.canon_monto, contrato.canon_moneda)}
            />
            <Dato label="Reajuste" value={contrato.reajuste_tipo} />
            {contrato.observaciones && (
              <Dato label="Observaciones" value={contrato.observaciones} />
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}
