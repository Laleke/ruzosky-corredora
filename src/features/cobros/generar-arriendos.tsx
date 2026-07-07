"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import { generarArriendosDelMes, type CobroFormState } from "./actions";

const initial: CobroFormState = { error: null, mensaje: null };

export function GenerarArriendos({ periodoDefault }: { periodoDefault?: string }) {
  const [state, formAction, pending] = useActionState(
    generarArriendosDelMes,
    initial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Período</span>
        <input
          name="periodo"
          type="month"
          defaultValue={periodoDefault}
          required
          className={ui.input}
        />
      </label>
      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "Generando…" : "Generar arriendos del mes"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.mensaje && (
        <p className="w-full text-sm text-green-700">{state.mensaje}</p>
      )}
    </form>
  );
}
