"use client";

import { useActionState, useState } from "react";
import { ui } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import {
  CATEGORIAS_GASTO,
  RESPONSABLES_GASTO,
  ESTADOS_GASTO,
} from "./constants";
import type { GastoFormState } from "./actions";
import type { Gasto } from "./types";
import type { OpcionesRelacion, Opcion } from "@/features/documentos/types";

type Action = (
  prev: GastoFormState,
  fd: FormData
) => Promise<GastoFormState>;

export function GastoForm({
  action,
  opciones,
  gasto,
  arrendatariosPorPropiedad,
}: {
  action: Action;
  opciones: OpcionesRelacion;
  gasto?: Gasto;
  arrendatariosPorPropiedad?: Record<string, Opcion[]>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [responsable, setResponsable] = useState(
    gasto?.responsable_pago ?? "propietario"
  );
  const [propiedadSel, setPropiedadSel] = useState(gasto?.propiedad_id ?? "");

  // Filtra arrendatarios según la propiedad elegida (si hay vínculos); si no,
  // ofrece todos.
  const arrendatariosFiltrados =
    propiedadSel && arrendatariosPorPropiedad?.[propiedadSel]?.length
      ? arrendatariosPorPropiedad[propiedadSel]
      : opciones.arrendatarios;

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

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Propiedad *</label>
          <select
            name="propiedad_id"
            value={propiedadSel}
            onChange={(e) => setPropiedadSel(e.target.value)}
            className={ui.input}
          >
            <option value="">Selecciona…</option>
            {opciones.propiedades.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Responsable del pago *</label>
          <select
            name="responsable_pago"
            value={responsable}
            onChange={(e) =>
              setResponsable(e.target.value as typeof responsable)
            }
            className={ui.input}
          >
            {RESPONSABLES_GASTO.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Contrato</label>
          <select
            name="contrato_id"
            defaultValue={gasto?.contrato_id ?? ""}
            className={ui.input}
          >
            <option value="">—</option>
            {opciones.contratos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Propietario</label>
          <select
            name="propietario_id"
            defaultValue={gasto?.propietario_id ?? ""}
            className={ui.input}
          >
            <option value="">—</option>
            {opciones.propietarios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Arrendatario</label>
          <select
            name="arrendatario_id"
            defaultValue={gasto?.arrendatario_id ?? ""}
            className={ui.input}
          >
            <option value="">—</option>
            {arrendatariosFiltrados.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

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

      {/* Descuento de liquidación: solo aplica a gastos del propietario. */}
      <label
        className={`flex items-start gap-3 rounded-lg border border-line p-4 ${
          responsable === "propietario"
            ? ""
            : "cursor-not-allowed opacity-50"
        }`}
      >
        <input
          type="checkbox"
          name="descontar_de_liquidacion"
          defaultChecked={gasto?.descontar_de_liquidacion ?? false}
          disabled={responsable !== "propietario"}
          className="mt-0.5 h-4 w-4 accent-burgundy"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">
            Descontar de la liquidación del propietario
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Solo para gastos que asume el propietario. Se restará de una
            liquidación futura (afecta su rentabilidad). Los gastos del
            arrendatario o de la corredora no afectan al propietario.
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
