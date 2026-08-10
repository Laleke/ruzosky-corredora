"use client";

import { useEffect, useState } from "react";
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

export type EstadoPush = "cargando" | "no-soportado" | "bloqueado" | "activo" | "inactivo";

/**
 * Suscribir/desuscribir push en ESTE dispositivo — lógica compartida entre el
 * panel de Configuración y el banner que la ofrece al entrar.
 *
 * El estado se lee del navegador (permiso + suscripción existente), no de la
 * base: un mismo usuario puede tener la app en el celular con notificaciones y
 * en el escritorio sin ellas.
 */
export function usePush() {
  const [estado, setEstado] = useState<EstadoPush>("cargando");
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

  return { estado, pending, error, activar, desactivar };
}
