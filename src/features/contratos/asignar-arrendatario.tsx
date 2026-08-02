"use client";

import { useActionState } from "react";
import { SelectStyled } from "@/components/select-styled";
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
      <p className="text-sm text-white/60">
        No hay arrendatarios activos para asignar. Crea uno primero.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-white">Arrendatario</span>
        <SelectStyled name="arrendatario_id" required>
          <option value="">Selecciona…</option>
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </SelectStyled>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Asignando…" : "Asignar"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
