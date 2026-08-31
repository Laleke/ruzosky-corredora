"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Pencil } from "lucide-react";
import { ui } from "@/components/ui";
import {
  guardarConfigNotificacionCobroDefault,
  type ConfigNotificacionCobroFormState,
} from "./config-notificaciones-cobro-actions";
import type { ConfigNotificacionCobro } from "./config-notificaciones-cobro-queries";

const initial: ConfigNotificacionCobroFormState = { error: null };

/**
 * Config por defecto de la empresa: cuántos días antes del vencimiento se
 * avisa (informativo) y cuántos días después (vencido). Un contrato puntual
 * puede pisar este default desde su propia ficha.
 */
export function ConfigNotificacionesCobroForm({
  config,
}: {
  config: ConfigNotificacionCobro | null;
}) {
  const [editando, setEditando] = useState(!config);
  const [state, formAction, pending] = useActionState(
    guardarConfigNotificacionCobroDefault,
    initial
  );

  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      enviado.current = false;
      setEditando(false);
    }
  }, [pending, state.error]);

  if (!editando) {
    return (
      <div className={`${ui.card} flex flex-col gap-4 p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Avisos de cobro por email</h2>
            <p className="mt-1 text-sm text-muted">
              Se le envía al arrendatario un correo con el estado de su cobro.
            </p>
          </div>
          <button type="button" onClick={() => setEditando(true)} className={ui.btnSecondary}>
            <Pencil size={16} /> Editar
          </button>
        </div>

        {config ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Antes de vencer</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {config.dias_antes ? `${config.dias_antes} día(s) antes` : "Desactivado"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Vencido</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {config.dias_despues ? `${config.dias_despues} día(s) después` : "Desactivado"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Estado</dt>
              <dd className="mt-0.5 text-sm text-ink">{config.activo ? "Activo" : "Inactivo"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted">Sin configurar — no se envía ningún aviso todavía.</p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className={`${ui.card} flex flex-col gap-4 p-5`}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Avisos de cobro por email</h2>
        <p className="mt-1 text-sm text-muted">
          Aplica a todos los contratos, salvo que uno tenga su propia configuración (se define
          desde la ficha del contrato). El correo incluye un link al estado de cuenta del
          arrendatario. Deja un campo vacío para desactivar ese aviso.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Días antes del vencimiento</span>
          <input
            name="dias_antes"
            type="number"
            min={1}
            defaultValue={config?.dias_antes ?? 3}
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Días después de vencido</span>
          <input
            name="dias_despues"
            type="number"
            min={1}
            defaultValue={config?.dias_despues ?? 1}
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Hora de envío</span>
          <input
            name="hora_envio"
            type="time"
            defaultValue={config?.hora_envio?.slice(0, 5) ?? "09:00"}
            className={ui.input}
          />
        </label>
      </div>

      <p className="text-xs text-muted">
        El plan actual de Vercel corre el envío una vez al día — la hora es orientativa hasta
        que se suba a un plan con cron más frecuente.
      </p>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={config?.activo ?? true}
          className="h-4 w-4"
        />
        Activo
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
          className={ui.btnPrimary}
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {config && (
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={pending}
            className={ui.btnSecondary}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
