"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Info, Pencil, Trash2 } from "lucide-react";
import { ui } from "@/components/ui";
import { SelectStyled } from "@/components/select-styled";
import { MoneyInput } from "@/components/money-input";
import { formatearFecha } from "@/lib/fecha";
import { editarPago, eliminarPago, type CobroFormState } from "./actions";
import { MEDIOS_PAGO, MEDIO_PAGO_LABEL } from "./constants";
import { ComprobantePago } from "./comprobante-pago";
import type { Pago } from "./types";

function monto(n: number): string {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

/** Tarjeta de un pago con edición en línea (mismo patrón que Arrendatarios/Cargo). */
export function PagoItem({
  pago,
  cargoId,
  contratoId,
  empresaId,
  tipoCargo,
  periodo,
}: {
  pago: Pago;
  cargoId: string;
  contratoId: string;
  empresaId: string;
  tipoCargo: string;
  periodo: string;
}) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(
    editarPago.bind(null, pago.id, cargoId),
    { error: null } as CobroFormState
  );
  const enviado = useRef(false);

  // editarPago no redirige (a diferencia de otros módulos, que vuelven a la
  // misma URL y así resetean `editando` solos) — hay que cerrar el modo
  // edición manualmente tras un guardado exitoso.
  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      enviado.current = false;
      setEditando(false);
    }
  }, [pending, state.error]);

  return (
    <div className={ui.listCard}>
      {!editando && (
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-white/60">{formatearFecha(pago.fecha_pago)}</p>
            <p className="text-lg font-semibold text-white">{monto(pago.monto_pagado)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label="Editar pago"
              title="Editar pago"
              className={ui.listCardIconBtn}
            >
              <Pencil size={16} />
            </button>
            <form action={eliminarPago.bind(null, pago.id, cargoId)}>
              <button
                type="submit"
                aria-label="Eliminar pago"
                title="Eliminar pago"
                className={ui.listCardIconBtn}
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <form action={formAction} className={editando ? "flex flex-col gap-3" : "contents"}>
        {editando ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-white/60">Monto</label>
                <MoneyInput name="monto_pagado" defaultValue={pago.monto_pagado} className={ui.input} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Fecha</label>
                <input
                  type="date"
                  name="fecha_pago"
                  defaultValue={pago.fecha_pago}
                  className={ui.input}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">Medio de pago</label>
              <SelectStyled name="medio_pago" defaultValue={pago.medio_pago ?? "transferencia"}>
                {MEDIOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </SelectStyled>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">Referencia</label>
              <input name="referencia" defaultValue={pago.referencia ?? ""} className={ui.input} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">Observaciones</label>
              <textarea
                name="observaciones"
                defaultValue={pago.observaciones ?? ""}
                rows={2}
                className={ui.input}
              />
            </div>

            {state.error && <p className="text-xs text-amber-200">{state.error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                onClick={() => {
                  enviado.current = true;
                }}
                disabled={pending}
                className={ui.btnPrimary}
              >
                {pending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={pending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <details className="group min-w-0">
            <summary className={ui.listCardDisclosure}>
              <Info size={14} />
              <span className="group-open:hidden">Ver más información</span>
              <span className="hidden group-open:inline">Ocultar información</span>
            </summary>
            <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/80">
              <span>
                Medio: {pago.medio_pago ? MEDIO_PAGO_LABEL[pago.medio_pago] ?? pago.medio_pago : "—"}
              </span>
              <span>Referencia: {pago.referencia ?? "—"}</span>
              {pago.observaciones && <span>Observaciones: {pago.observaciones}</span>}
              <div className="mt-0.5">
                <ComprobantePago
                  pagoId={pago.id}
                  cargoId={cargoId}
                  contratoId={contratoId}
                  empresaId={empresaId}
                  tieneComprobante={Boolean(pago.documento_id)}
                  tipoCargo={tipoCargo}
                  periodo={periodo}
                />
              </div>
            </div>
          </details>
        )}
      </form>
    </div>
  );
}
