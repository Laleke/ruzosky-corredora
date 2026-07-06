"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { SelectorPropiedadContrato } from "@/components/selector-propiedad-contrato";
import { CATEGORIAS_GASTO, ESTADOS_GASTO } from "./constants";
import type { GastoFormState } from "./actions";
import type { Gasto } from "./types";
import type { OpcionesRelacion } from "@/features/documentos/types";
import type { ContextoPropiedad } from "@/features/documentos/queries";

type Action = (
  prev: GastoFormState,
  fd: FormData
) => Promise<GastoFormState>;

// Un gasto SIEMPRE corresponde al propietario: el usuario solo elige Propiedad
// + datos del gasto. Propietario/contrato/arrendatario/responsable se derivan
// o quedan implícitos (ver reglas de simplificación en PROYECTO.md).
export function GastoForm({
  action,
  opciones,
  gasto,
  contexto,
}: {
  action: Action;
  opciones: OpcionesRelacion;
  gasto?: Gasto;
  contexto: ContextoPropiedad;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
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

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Categoría *</label>
          <select
            name="categoria"
            defaultValue={gasto?.categoria ?? "mantencion"}
            className={ui.input}
          >
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Monto (CLP) *</label>
          <MoneyInput
            name="monto"
            defaultValue={gasto?.monto ?? ""}
            placeholder="0"
            className={ui.input}
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

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Estado</label>
          <select
            name="estado"
            defaultValue={gasto?.estado ?? "pendiente"}
            className={ui.input}
          >
            {ESTADOS_GASTO.filter((e) => e.value !== "anulado").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <SelectorPropiedadContrato
          propiedades={opciones.propiedades}
          contexto={contexto}
          propiedadDefault={gasto?.propiedad_id ?? ""}
          contratoDefault={gasto?.contrato_id ?? ""}
          mostrarArrendatario={false}
        />

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

      {/* El gasto es del propietario: puede descontarse de su liquidación. */}
      <label className="flex items-start gap-3 rounded-lg border border-line p-4">
        <input
          type="checkbox"
          name="descontar_de_liquidacion"
          defaultChecked={gasto?.descontar_de_liquidacion ?? false}
          className="mt-0.5 h-4 w-4 accent-burgundy"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">
            Descontar de la liquidación del propietario
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Se restará de una liquidación futura del propietario (afecta su
            rentabilidad).
          </span>
        </span>
      </label>

      {state.error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : gasto ? "Guardar cambios" : "Registrar gasto"}
        </button>
      </div>
    </form>
  );
}
