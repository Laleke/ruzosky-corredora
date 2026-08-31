"use client";

import { useActionState, useState } from "react";
import { ui } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { SelectorPropiedadContrato } from "@/components/selector-propiedad-contrato";
import { SelectStyled } from "@/components/select-styled";
import { CATEGORIAS_GASTO, CATEGORIA_GASTO_LABEL, clp } from "./constants";
import { ObligacionesEditor } from "./obligaciones-editor";
import type { FilaObligacion } from "./reparto";
import { formatearFecha } from "@/lib/fecha";
import type { GastoFormState } from "./actions";
import type { GastoListado } from "./types";
import type { OpcionesRelacion } from "@/features/documentos/types";
import type { ContextoPropiedad } from "@/features/documentos/queries";

type Action = (
  prev: GastoFormState,
  fd: FormData
) => Promise<GastoFormState>;

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={ui.label}>{label}</span>
      <span className="rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm text-ink">
        {valor ?? "—"}
      </span>
    </div>
  );
}

function obligacionesAFilas(gasto: GastoListado): FilaObligacion[] {
  return gasto.obligaciones.map((o) => ({
    responsable: o.responsable,
    tipo_monto: o.tipo_monto,
    valor: Number(o.valor),
    cuotas: o.cuotas
      .sort((a, b) => a.numero_cuota - b.numero_cuota)
      .map((c) => ({
        numero_cuota: c.numero_cuota,
        monto: Number(c.monto),
        fecha_vencimiento: c.fecha_vencimiento,
      })),
  }));
}

export function GastoForm({
  action,
  opciones,
  gasto,
  contexto,
  compromiso = "libre",
  onCancelar,
}: {
  action: Action;
  opciones: OpcionesRelacion;
  gasto?: GastoListado;
  contexto: ContextoPropiedad;
  compromiso?: "libre" | "parcial" | "total";
  onCancelar?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [monto, setMonto] = useState(Number(gasto?.monto ?? 0));
  const libre = compromiso === "libre";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {!libre && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este gasto ya tiene cuotas pagadas o descontadas en una liquidación: solo
          puedes editar la descripción, las observaciones y el comprobante. El
          reparto y las cuotas se administran cuota por cuota desde el detalle.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Descripción *</label>
          <input
            name="descripcion"
            defaultValue={gasto?.descripcion ?? ""}
            placeholder="Ej: Reparación de filtración en baño"
            className={ui.input}
          />
        </div>

        {libre ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Categoría *</label>
              <SelectStyled name="categoria" defaultValue={gasto?.categoria ?? "mantencion"}>
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </SelectStyled>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Monto (CLP) *</label>
              <MoneyInput
                name="monto"
                defaultValue={gasto?.monto ?? ""}
                placeholder="0"
                className={ui.input}
                onValueChange={setMonto}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={ui.label}>Fecha *</label>
              <input
                type="date"
                name="fecha"
                defaultValue={gasto?.fecha ?? ""}
                className={ui.input}
              />
            </div>

            <SelectorPropiedadContrato
              propiedades={opciones.propiedades}
              contexto={contexto}
              propiedadDefault={gasto?.propiedad_id ?? ""}
              contratoDefault={gasto?.contrato_id ?? ""}
              mostrarArrendatario={false}
            />
          </>
        ) : (
          <>
            <Dato label="Categoría" valor={CATEGORIA_GASTO_LABEL[gasto!.categoria]} />
            <Dato label="Monto" valor={clp(gasto!.monto)} />
            <Dato label="Fecha" valor={formatearFecha(gasto!.fecha)} />
            <Dato label="Propiedad" valor={gasto!.propiedad_label} />
            <input type="hidden" name="propiedad_id" value={gasto!.propiedad_id} />
          </>
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Observaciones</label>
          <textarea
            name="observaciones"
            rows={3}
            defaultValue={gasto?.observaciones ?? ""}
            placeholder="Notas internas (opcional)"
            className={ui.input}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={ui.label}>Reparto y cuotas</label>
        <ObligacionesEditor
          montoTotalGasto={monto}
          fechaGasto={gasto?.fecha ?? ""}
          valorInicial={gasto ? obligacionesAFilas(gasto) : undefined}
          soloLectura={!libre}
        />
      </div>

      {state.error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : gasto ? "Guardar cambios" : "Registrar gasto"}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={pending}
            className={ui.btnSecondary}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
