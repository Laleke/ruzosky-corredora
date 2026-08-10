"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { usePush } from "./use-push";

const CLAVE_CERRADO = "rzk:push-banner-cerrado";

/**
 * Invita a activar las notificaciones apenas se entra, sin que el admin tenga
 * que saber que existe la pantalla de Configuración. Reaparece en cada sesión
 * nueva (decisión explícita: los admin casi nunca van a buscarlo por su
 * cuenta) — pero si lo cierran, no vuelve a insistir DENTRO de esa misma
 * sesión de pestaña (`sessionStorage`, se limpia solo al abrir una nueva).
 *
 * El navegador exige un clic del usuario para pedir permiso de notificaciones
 * — no hay forma de que el popup nativo aparezca solo al cargar la página, es
 * una restricción de todos los navegadores modernos contra el spam de
 * permisos. Este banner es lo más cerca que se puede llegar: aparece solo,
 * pero el paso final (el popup nativo) sigue necesitando ese clic.
 */
export function BannerNotificaciones() {
  const { estado, pending, activar } = usePush();
  const [cerrado, setCerrado] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(CLAVE_CERRADO) === "1"
  );

  // Nada que ofrecer: sin soporte o ya bloqueado a nivel de navegador, insistir
  // no cambia nada — solo se puede resolver desde los ajustes del navegador.
  if (estado !== "inactivo" || cerrado) return null;

  function cerrar() {
    sessionStorage.setItem(CLAVE_CERRADO, "1");
    setCerrado(true);
  }

  return (
    <div className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 bg-burgundy px-4 py-2.5 text-white sm:px-6">
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <Bell size={16} className="shrink-0" />
        <span className="truncate">
          Activa las notificaciones para enterarte al instante cuando informen un pago.
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={activar}
          disabled={pending}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Activando…" : "Activar"}
        </button>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
