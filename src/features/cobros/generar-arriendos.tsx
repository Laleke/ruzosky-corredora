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
        <span className="font-medium text-white">Período</span>
        <input
          name="periodo"
          type="month"
          defaultValue={periodoDefault}
          required
          className={ui.input}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Generando…" : "Generar arriendos"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      )}
      {state.mensaje && (
        <p className="w-full text-sm text-emerald-300">{state.mensaje}</p>
      )}
    </form>
  );
}
