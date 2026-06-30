"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ui } from "@/components/ui";
import type { LiquidacionFormState } from "./actions";

type Action = (
  prev: LiquidacionFormState,
  formData: FormData
) => Promise<LiquidacionFormState>;

type Ajuste = {
  tipo: "ingreso" | "descuento";
  concepto: string;
  monto: string;
  observacion: string;
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export function ConfirmarForm({
  action,
  subtotalIngresos,
  subtotalDescuentos,
}: {
  action: Action;
  subtotalIngresos: number;
  subtotalDescuentos: number;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);

  const agregar = () =>
    setAjustes((a) => [
      ...a,
      { tipo: "descuento", concepto: "", monto: "", observacion: "" },
    ]);
  const quitar = (i: number) =>
    setAjustes((a) => a.filter((_, idx) => idx !== i));
  const actualizar = (i: number, campo: keyof Ajuste, valor: string) =>
    setAjustes((a) =>
      a.map((row, idx) => (idx === i ? { ...row, [campo]: valor } : row))
    );

  const manualIng = ajustes
    .filter((a) => a.tipo === "ingreso")
    .reduce((s, a) => s + (Number(a.monto) || 0), 0);
  const manualDesc = ajustes
    .filter((a) => a.tipo === "descuento")
    .reduce((s, a) => s + (Number(a.monto) || 0), 0);

  const totalIng = subtotalIngresos + manualIng;
  const totalDesc = subtotalDescuentos + manualDesc;
  const total = totalIng - totalDesc;

  // Solo se envían los ajustes con concepto y monto válido.
  const ajustesValidos = ajustes.filter(
    (a) => a.concepto.trim() && Number(a.monto) > 0
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Ajustes manuales</h3>
          <button
            type="button"
            onClick={agregar}
            className={`${ui.btnSecondary} px-3 py-1.5 text-xs`}
          >
            <Plus size={14} /> Agregar ajuste
          </button>
        </div>

        {ajustes.map((a, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 rounded-lg border border-line p-3 sm:grid-cols-[7rem_1fr_8rem_auto]"
          >
            <select
              value={a.tipo}
              onChange={(e) => actualizar(i, "tipo", e.target.value)}
              className={ui.input}
            >
              <option value="ingreso">Ingreso</option>
              <option value="descuento">Descuento</option>
            </select>
            <input
              value={a.concepto}
              onChange={(e) => actualizar(i, "concepto", e.target.value)}
              placeholder="Concepto"
              className={ui.input}
            />
            <input
              type="number"
              step="any"
              min="0"
              value={a.monto}
              onChange={(e) => actualizar(i, "monto", e.target.value)}
              placeholder="Monto"
              className={ui.input}
            />
            <button
              type="button"
              onClick={() => quitar(i)}
              className="flex items-center justify-center rounded-lg px-2 text-red-600 hover:bg-red-50"
              aria-label="Quitar ajuste"
            >
              <Trash2 size={16} />
            </button>
            <input
              value={a.observacion}
              onChange={(e) => actualizar(i, "observacion", e.target.value)}
              placeholder="Observación (opcional)"
              className={`${ui.input} sm:col-span-4`}
            />
          </div>
        ))}
      </div>

      {/* Totales en vivo (incluye ajustes) */}
      <div className="flex flex-col gap-1 rounded-lg bg-stone-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Total ingresos</span>
          <span>{clp(totalIng)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total descuentos</span>
          <span>− {clp(totalDesc)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
          <span>Total a liquidar</span>
          <span>{clp(total)}</span>
        </div>
      </div>

      <input type="hidden" name="ajustes" value={JSON.stringify(ajustesValidos)} />
      <textarea
        name="observaciones"
        rows={2}
        placeholder="Observaciones de la liquidación (opcional)"
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
