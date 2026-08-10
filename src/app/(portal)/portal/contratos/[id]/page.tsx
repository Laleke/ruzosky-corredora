import { notFound } from "next/navigation";
import { miContrato } from "@/features/portal/queries";
import { BotonVolver } from "@/components/boton-volver";
import { badge } from "@/components/ui";
import { numeroContratoMostrar, terminoMostrar } from "@/features/contratos/vigencia";
import { formatearFecha } from "@/lib/fecha";

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  vigente: { label: "Vigente", tone: "success" },
  vencido: { label: "Vencido", tone: "warning" },
  terminado: { label: "Terminado", tone: "neutral" },
  renovado: { label: "Renovado", tone: "info" },
};

const REAJUSTE_LABEL: Record<string, string> = {
  sin_reajuste: "Sin reajuste",
  IPC: "IPC",
  UF: "UF",
};

const TIPO_COMISION_LABEL: Record<string, string> = {
  porcentaje: "Porcentaje",
  monto_fijo: "Monto fijo",
};

function dinero(v: number | null, moneda: string): string {
  if (v === null) return "—";
  return moneda === "UF" ? `UF ${v.toLocaleString("es-CL")}` : `$${v.toLocaleString("es-CL")}`;
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value ?? "—"}</dd>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-burgundy-strong p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{titulo}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</dl>
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
              {contrato.propiedad_direccion}
            </h1>
            <p className="mt-1 text-sm text-white/70">{numeroContratoMostrar(contrato.numero_contrato, contrato.id)}</p>
          </div>
          <span className={badge(est.tone)}>{est.label}</span>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <Bloque titulo="Contrato">
            <Dato label="N° de contrato" value={numeroContratoMostrar(contrato.numero_contrato, contrato.id)} />
            <Dato label="Arrendatario" value={contrato.arrendatarios_nombres.join(", ") || "—"} />
          </Bloque>

          <Bloque titulo="Fechas">
            <Dato label="Fecha de firma" value={formatearFecha(contrato.fecha_firma)} />
            <Dato label="Fecha de inicio" value={formatearFecha(contrato.fecha_inicio)} />
            <Dato label="Fecha de término" value={terminoMostrar(contrato.fecha_termino, contrato.estado)} />
          </Bloque>

          <Bloque titulo="Canon y reajuste">
            <Dato label="Canon original" value={dinero(contrato.canon_monto, contrato.canon_moneda)} />
            <Dato
              label="Canon actual"
              value={dinero(contrato.canon_actual ?? contrato.canon_monto, contrato.canon_moneda)}
            />
            {contrato.canon_uf_base !== null && (
              <Dato label="Canon fijo en UF" value={`UF ${contrato.canon_uf_base}`} />
            )}
            <Dato label="Moneda" value={contrato.canon_moneda} />
            <Dato label="Reajuste" value={REAJUSTE_LABEL[contrato.reajuste_tipo] ?? contrato.reajuste_tipo} />
            {contrato.periodicidad_reajuste_meses && (
              <Dato label="Periodicidad (meses)" value={contrato.periodicidad_reajuste_meses} />
            )}
            {contrato.fecha_proximo_reajuste && (
              <Dato
                label="Próximo reajuste a revisar"
                value={formatearFecha(contrato.fecha_proximo_reajuste)}
              />
            )}
          </Bloque>

          {(contrato.tipo_comision || contrato.cobra_administracion) && (
            <Bloque titulo="Comisión y administración">
              {contrato.tipo_comision && (
                <Dato
                  label="Tipo de comisión"
                  value={TIPO_COMISION_LABEL[contrato.tipo_comision] ?? contrato.tipo_comision}
                />
              )}
              {contrato.comision_monto !== null && (
                <Dato label="Valor comisión" value={dinero(contrato.comision_monto, contrato.canon_moneda)} />
              )}
              <Dato label="Cobra administración" value={contrato.cobra_administracion ? "Sí" : "No"} />
              {contrato.administracion_monto !== null && (
                <Dato
                  label="Administración monto"
                  value={dinero(contrato.administracion_monto, contrato.canon_moneda)}
                />
              )}
              {contrato.administracion_porcentaje !== null && (
                <Dato label="Administración %" value={`${contrato.administracion_porcentaje}%`} />
              )}
            </Bloque>
          )}

          {contrato.observaciones && (
            <div className="rounded-xl bg-burgundy-strong p-5">
              <h2 className="mb-2 text-sm font-semibold text-white">Observaciones</h2>
              <p className="text-sm text-white/90">{contrato.observaciones}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
