"use client";

import { useActionState } from "react";
import { generarArriendosDelMes, type CobroFormState } from "./actions";

const initial: CobroFormState = { error: null, mensaje: null };

export function GenerarArriendos() {
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
          required
          className="rounded-md border border-black/15 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
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
