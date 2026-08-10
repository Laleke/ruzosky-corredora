"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { ui } from "@/components/ui";
import { eliminarSuscripcionPush, guardarSuscripcionPush } from "./actions";

/**
 * La clave VAPID viaja en base64url y el navegador la pide como bytes. Se
 * construye sobre un `ArrayBuffer` explícito porque `pushManager.subscribe`
 * exige `ArrayBufferView<ArrayBuffer>` y no acepta el `ArrayBufferLike` que
 * infiere `Uint8Array.from`.
 */
function base64UrlABytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

type Estado = "cargando" | "no-soportado" | "bloqueado" | "activo" | "inactivo";

/**
 * Activa o desactiva las notificaciones push en ESTE dispositivo.
 *
 * El estado se lee del navegador (permiso + suscripción existente), no de la
 * base: un mismo usuario puede tener la app en el celular con notificaciones y
 * en el escritorio sin ellas.
 */
export function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claveVapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    async function revisar() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !claveVapid
      ) {
        setEstado("no-soportado");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("bloqueado");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    }
    revisar().catch(() => setEstado("no-soportado"));
  }, [claveVapid]);

  async function activar() {
    setPending(true);
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }

      // El SW lo registra @serwist/next; acá solo se espera a que esté listo.
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlABytes(claveVapid!),
      });

      const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
      const res = await guardarSuscripcionPush({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });

      if (res.error) {
        // Si el servidor no la guardó, dejar el navegador limpio: una
        // suscripción local sin fila en la base nunca recibiría nada.
        await sub.unsubscribe();
        setError(res.error);
        setEstado("inactivo");
        return;
      }
      setEstado("activo");
    } catch {
      setError("No se pudieron activar las notificaciones en este dispositivo.");
    } finally {
      setPending(false);
    }
  }

  async function desactivar() {
    setPending(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await eliminarSuscripcionPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch {
      setError("No se pudieron desactivar.");
    } finally {
      setPending(false);
    }
  }

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
