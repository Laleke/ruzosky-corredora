"use client";

import { useActionState } from "react";
import type { ContratoFormState } from "./actions";

type Action = (
  prev: ContratoFormState,
  formData: FormData
) => Promise<ContratoFormState>;

export function AsignarArrendatario({
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
        No hay arrendatarios activos para asignar. Crea uno primero.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Arrendatario</span>
        <select
          name="arrendatario_id"
          required
          className="rounded-md border border-black/15 px-3 py-2"
        >
          <option value="">Selecciona…</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
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
