"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import type { CobroFormState } from "./actions";

type Action = (
  prev: CobroFormState,
  formData: FormData
) => Promise<CobroFormState>;

const inputCls = ui.input;

export function RegistrarPago({
  action,
  saldoPendiente,
}: {
  action: Action;
  saldoPendiente: number;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  if (saldoPendiente <= 0) {
    return <p className="text-sm text-green-700">Cargo pagado por completo.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Monto</span>
        <MoneyInput name="monto_pagado" className={`w-36 ${ui.input}`} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <input name="fecha_pago" type="date" className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Medio</span>
        <select name="medio_pago" className={inputCls} defaultValue="transferencia">
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="cheque">Cheque</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observación</span>
        <input name="referencia" type="text" className={inputCls} />
      </label>
      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "Registrando…" : "Registrar pago"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
