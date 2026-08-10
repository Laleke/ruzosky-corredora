"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { ui } from "@/components/ui";
import { usePush } from "./use-push";

/** Panel completo de Configuración: activa/desactiva push en este dispositivo. */
export function ActivarNotificaciones() {
  const { estado, pending, error, activar, desactivar } = usePush();

  return (
    <div className={`${ui.card} flex flex-col gap-3 p-5`}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Notificaciones de pagos informados</h2>
        <p className="mt-1 text-sm text-muted">
          Recibe un aviso en este dispositivo cuando un arrendatario informe un pago, sin tener
          que entrar a revisar.
        </p>
      </div>

      {estado === "no-soportado" && (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-muted">
          Este navegador no admite notificaciones push, o falta configurar las claves VAPID del
          servidor. En iPhone hay que instalar la app en la pantalla de inicio para que funcionen.
        </p>
      )}

      {estado === "bloqueado" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Bloqueaste las notificaciones para este sitio. Habilítalas en los ajustes del navegador
          y vuelve a intentar.
        </p>
      )}

      {estado === "activo" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <BellRing size={16} /> Activas en este dispositivo
          </span>
          <button
            type="button"
            onClick={desactivar}
            disabled={pending}
            className={ui.btnSecondary}
          >
            <BellOff size={16} /> {pending ? "Desactivando…" : "Desactivar"}
          </button>
        </div>
      )}

      {estado === "inactivo" && (
        <div>
          <button type="button" onClick={activar} disabled={pending} className={ui.btnPrimary}>
            <Bell size={16} /> {pending ? "Activando…" : "Activar notificaciones"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
