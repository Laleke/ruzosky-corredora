"use client";

import { useActionState } from "react";
import { Printer } from "lucide-react";
import { ui } from "@/components/ui";
import { marcarPagada, type LiquidacionFormState } from "./actions";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={ui.btnSecondary}
    >
      <Printer size={16} />
      Descargar PDF
    </button>
  );
}

type Action = (
  prev: LiquidacionFormState,
  formData: FormData
) => Promise<LiquidacionFormState>;

export function MarcarPagadaForm({ id }: { id: string }) {
  const action: Action = marcarPagada.bind(null, id);
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha de transferencia</span>
        <input name="fecha_pago" type="date" className={ui.input} />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="font-medium">Observación</span>
        <input name="pago_observacion" type="text" className={ui.input} />
      </label>
      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "Guardando…" : "Marcar como pagada"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
