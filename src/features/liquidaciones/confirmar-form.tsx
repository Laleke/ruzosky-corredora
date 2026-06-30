"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import type { LiquidacionFormState } from "./actions";

type Action = (
  prev: LiquidacionFormState,
  formData: FormData
) => Promise<LiquidacionFormState>;

export function ConfirmarForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="observaciones"
        rows={2}
        placeholder="Observaciones (opcional)"
        className={ui.input}
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "Generando…" : "Confirmar y generar"}
      </button>
    </form>
  );
}
