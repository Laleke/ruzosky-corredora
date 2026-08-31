"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ui, badge } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";
import {
  CATEGORIA_GASTO_LABEL,
  ESTADO_GASTO,
  RESPONSABLE_GASTO_LABEL,
  clp,
} from "./constants";
import { GastoForm } from "./gasto-form";
import { GastoAcciones, VerComprobanteBtn, CuotaAcciones } from "./acciones";
import { actualizarGasto } from "./actions";
import { estadoComprometido } from "./reparto";
import type { GastoListado } from "./types";
import type { OpcionesRelacion } from "@/features/documentos/types";
import type { ContextoPropiedad } from "@/features/documentos/queries";

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

/** Detalle de un gasto con edición en línea (mismo patrón que Arrendatarios/Cargo). */
export function DetalleGasto({
  id,
  gasto,
  opciones,
  contexto,
  empresaId,
}: {
  id: string;
  gasto: GastoListado;
  opciones: OpcionesRelacion;
  contexto: ContextoPropiedad;
  empresaId: string;
}) {
  const [editando, setEditando] = useState(false);
  const est = ESTADO_GASTO[gasto.estado];
  const compromiso = estadoComprometido(gasto.obligaciones);
  const totalCuotas = gasto.obligaciones.reduce((a, o) => a + o.cuotas.length, 0);

  if (editando) {
    return (
      <div className={`${ui.card} p-6`}>
        <GastoForm
          action={actualizarGasto.bind(null, id)}
          opciones={opciones}
          gasto={gasto}
          contexto={contexto}
          compromiso={compromiso}
          onCancelar={() => setEditando(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {gasto.descripcion}
            </h1>
            <span className={badge(est.tone)}>{est.label}</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-burgundy">{clp(gasto.monto)}</p>
        </div>
        {gasto.estado !== "anulado" && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className={ui.btnSecondary}
          >
            <Pencil size={16} /> Editar
          </button>
        )}
      </div>

      <div className={`${ui.card} mb-6 p-6`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Dato label="Fecha" valor={formatearFecha(gasto.fecha)} />
          <Dato label="Categoría" valor={CATEGORIA_GASTO_LABEL[gasto.categoria]} />
          <Dato label="Propiedad" valor={gasto.propiedad_label} />
          <Dato label="Registrado por" valor={gasto.creado_por_email} />
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Comprobante</dt>
            <dd className="mt-0.5 text-sm text-ink">
              {gasto.documento_id ? (
                <span className="flex items-center gap-2">
                  Adjuntado <VerComprobanteBtn id={id} />
                </span>
              ) : (
                <span className="text-muted">Sin comprobante</span>
              )}
            </dd>
          </div>
        </dl>
        {gasto.observaciones && (
          <div className="mt-4 border-t border-line pt-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Observaciones</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{gasto.observaciones}</dd>
          </div>
        )}
      </div>

      <div className={`${ui.card} mb-6 p-6`}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Reparto y cuotas
        </h2>
        <div className="flex flex-col gap-4">
          {gasto.obligaciones.map((o) => (
            <div key={o.id} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-sm font-medium text-ink">
                {RESPONSABLE_GASTO_LABEL[o.responsable]} —{" "}
                {o.tipo_monto === "porcentaje" ? `${Number(o.valor)}%` : clp(o.valor)} ·{" "}
                {clp(o.monto_calculado)}
              </p>
              <div className="flex flex-col gap-2">
                {o.cuotas
                  .sort((a, b) => a.numero_cuota - b.numero_cuota)
                  .map((c) => {
                    const estCuota = ESTADO_GASTO[c.estado];
                    return (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-stone-50 px-3 py-2 text-sm"
                      >
                        <span className="text-ink">
                          Cuota {c.numero_cuota} · {clp(c.monto)}
                          {c.fecha_vencimiento && ` · vence ${formatearFecha(c.fecha_vencimiento)}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={badge(estCuota.tone)}>{estCuota.label}</span>
                          <CuotaAcciones
                            cuotaId={c.id}
                            estado={c.estado}
                            liquidacionId={c.liquidacion_id}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <GastoAcciones
        id={id}
        estado={gasto.estado}
        compromiso={compromiso}
        totalCuotas={totalCuotas}
        empresaId={empresaId}
        propiedadId={gasto.propiedad_id}
        descripcion={gasto.descripcion}
      />
    </div>
  );
}
