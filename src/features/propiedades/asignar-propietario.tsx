"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import type { PropiedadFormState } from "./actions";

type Action = (
  prev: PropiedadFormState,
  formData: FormData
) => Promise<PropiedadFormState>;

export function AsignarPropietario({
  action,
  opciones,
}: {
  action: Action;
  opciones: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  if (opciones.length === 0) {
    return (
      <p className="text-sm opacity-60">
        No hay propietarios activos para asignar. Crea uno primero.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Propietario</span>
        <select name="propietario_id" required className={ui.input}>
          <option value="">Selecciona…</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Participación %</span>
        <input
          name="porcentaje_participacion"
          type="number"
          step="any"
          min="0"
          max="100"
          defaultValue="100"
          className={`w-28 ${ui.input}`}
        />
      </label>
      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "Asignando…" : "Asignar"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
