"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import { crearCargo, type CobroFormState } from "./actions";

const inputCls = ui.input;

export function CargoForm({
  contratos,
}: {
  contratos: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearCargo, {
    error: null,
  });

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          Contrato <span className="text-red-600">*</span>
        </span>
        <select name="contrato_id" required className={inputCls} defaultValue="">
          <option value="">Selecciona…</option>
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de cargo</span>
          <select name="tipo_cargo" className={inputCls} defaultValue="gasto_comun">
            <option value="arriendo">Arriendo</option>
            <option value="gasto_comun">Gasto común</option>
            <option value="luz">Luz</option>
            <option value="agua">Agua</option>
            <option value="internet">Internet</option>
            <option value="multa">Multa</option>
            <option value="ajuste">Ajuste</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Período <span className="text-red-600">*</span>
          </span>
          <input name="periodo" type="month" required className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Monto <span className="text-red-600">*</span>
          </span>
          <input
            name="monto"
            type="number"
            step="any"
            min="0"
            required
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Fecha de vencimiento</span>
          <input name="fecha_vencimiento" type="date" className={inputCls} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observaciones</span>
        <textarea name="observaciones" rows={2} className={inputCls} />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Crear cargo"}
        </button>
        <Link href="/cobros" className={ui.btnSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
