"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { ui } from "@/components/ui";
import {
  guardarConfigNotificacionCobroContrato,
  quitarOverrideNotificacionCobro,
  type ConfigNotificacionCobroFormState,
} from "./config-notificaciones-cobro-actions";
import type { ConfigNotificacionCobro } from "./config-notificaciones-cobro-queries";

const initial: ConfigNotificacionCobroFormState = { error: null };

/**
 * Override de aviso de cobro por email para ESTE contrato puntual — si no
 * existe, rige el default de la empresa (Configuración > Avisos de cobro).
 */
export function ConfigNotificacionCobroContrato({
  contratoId,
  override,
}: {
  contratoId: string;
  override: ConfigNotificacionCobro | null;
}) {
  const [editando, setEditando] = useState(false);
  const [quitando, startQuitar] = useTransition();
  const guardarAction = guardarConfigNotificacionCobroContrato.bind(null, contratoId);
  const [state, formAction, pending] = useActionState(guardarAction, initial);

  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      enviado.current = false;
      setEditando(false);
    }
  }, [pending, state.error]);

  if (!editando) {
    return (
      <div className="rounded-xl bg-burgundy-strong p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Aviso de cobro por email</h3>
            {override ? (
              <p className="mt-1 text-sm text-white/70">
                Override propio: {override.dias_antes ? `${override.dias_antes} día(s) antes` : "sin aviso antes"},{" "}
                {override.dias_despues ? `${override.dias_despues} día(s) después de vencido` : "sin aviso de vencido"}
                {!override.activo && " (inactivo)"}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/70">
                Usa el default de la empresa (Configuración → Avisos de cobro).
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              {override ? "Editar override" : "Personalizar para este contrato"}
            </button>
            {override && (
              <button
                type="button"
                disabled={quitando}
                onClick={() => startQuitar(() => quitarOverrideNotificacionCobro(contratoId))}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50"
              >
                {quitando ? "Quitando…" : "Quitar override"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl bg-burgundy-strong p-5">
      <h3 className="text-sm font-semibold text-white">Aviso de cobro por email — este contrato</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-white">Días antes del vencimiento</span>
          <input
            name="dias_antes"
            type="number"
            min={1}
            defaultValue={override?.dias_antes ?? ""}
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-white">Días después de vencido</span>
          <input
            name="dias_despues"
            type="number"
            min={1}
            defaultValue={override?.dias_despues ?? ""}
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-white">Hora de envío</span>
          <input
            name="hora_envio"
            type="time"
            defaultValue={override?.hora_envio?.slice(0, 5) ?? "09:00"}
            className={ui.input}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={override?.activo ?? true}
          className="h-4 w-4"
        />
        Activo
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          onClick={() => {
            enviado.current = true;
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar override"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
