"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { ui } from "@/components/ui";
import { SelectStyled } from "@/components/select-styled";
import { formatearFecha } from "@/lib/fecha";
import {
  registrarMovimientoGarantia,
  eliminarMovimientoGarantia,
  type GarantiaFormState,
} from "./actions";
import type { MovimientoGarantia } from "./types";

const TIPO_LABEL: Record<MovimientoGarantia["tipo_movimiento"], string> = {
  recepcion: "Recepción",
  retencion: "Retención",
  devolucion: "Devolución",
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export function SeccionGarantia({
  contratoId,
  movimientos,
  saldoDisponible,
}: {
  contratoId: string;
  movimientos: MovimientoGarantia[];
  saldoDisponible: number;
}) {
  const [state, formAction, pending] = useActionState<GarantiaFormState, FormData>(
    registrarMovimientoGarantia.bind(null, contratoId),
    { error: null }
  );
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  async function onEliminar(id: string) {
    setEliminandoId(id);
    await eliminarMovimientoGarantia(contratoId, id);
    setEliminandoId(null);
  }

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Garantía</h2>
        <span className="text-lg font-semibold text-white">
          Saldo disponible: {clp(saldoDisponible)}
        </span>
      </div>

      {movimientos.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-xl bg-burgundy-strong">
          <table className="w-full">
            <thead className="border-b border-white/15">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Motivo
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15">
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-sm text-white/80">{formatearFecha(m.fecha)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {TIPO_LABEL[m.tipo_movimiento]}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">{clp(Number(m.monto))}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{m.motivo ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEliminar(m.id)}
                      disabled={eliminandoId === m.id}
                      aria-label="Eliminar movimiento"
                      title="Eliminar movimiento"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-300 transition-colors hover:bg-white/15 hover:text-red-200 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl bg-burgundy-strong p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Registrar movimiento</h3>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-white">Tipo</span>
            <SelectStyled name="tipo_movimiento" defaultValue="recepcion" required>
              <option value="recepcion">Recepción</option>
              <option value="retencion">Retención</option>
              <option value="devolucion">Devolución</option>
            </SelectStyled>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-white">Monto</span>
            <input name="monto" type="number" min="1" step="1" required className={ui.input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-white">Fecha</span>
            <input name="fecha" type="date" required className={ui.input} />
          </label>
          <label className="flex flex-1 min-w-[12rem] flex-col gap-1 text-sm">
            <span className="font-medium text-white">Motivo (opcional)</span>
            <input name="motivo" className={ui.input} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Registrar"}
          </button>
          {state.error && (
            <p className="w-full text-sm text-amber-200" role="alert">
              {state.error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
