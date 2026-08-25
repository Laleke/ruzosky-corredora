import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Inyectado por Serwist en build: lista de assets a precachear.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // false: el SW nuevo espera la orden del cliente (banner "Actualizar")
  // en vez de tomar control en silencio con la pestaña ya abierta.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** Payload que envía el servidor en `notificarAdmins` (features/notificaciones). */
type PushPayload = { titulo: string; cuerpo: string; url: string; tag?: string };

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushPayload = { titulo: "RZK Prop", cuerpo: "", url: "/dashboard" };
  try {
    payload = { ...payload, ...(event.data.json() as Partial<PushPayload>) };
  } catch {
    // Si el payload no es JSON, al menos mostrar el texto crudo en vez de nada.
    payload.cuerpo = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.titulo, {
      body: payload.cuerpo,
      icon: "/icons/icon-192.png",
      // Android ignora el color del badge y usa solo el canal alfa como
      // silueta para el ícono de la barra de estado — icon-192 es opaco de
      // borde a borde (fondo burdeo sólido), así que esa silueta terminaba
      // siendo un cuadrado blanco relleno (el ícono "en blanco" reportado).
      // icon-badge-mono.png es transparente salvo la casita, generado con
      // sharp a partir del logo real (ver notas en el script de esa sesión).
      // El "?v=" es cache-busting: la caché de imágenes del SW (CacheFirst,
      // ver defaultCache de @serwist/next) guarda por URL exacta — sin esto,
      // un cambio al archivo no se refleja hasta que expire esa caché.
      // Subir el número cada vez que se reemplace este archivo.
      badge: "/icons/icon-badge-mono.png?v=3",
      data: { url: payload.url },
      // Mismo tag = la notificación nueva reemplaza a la anterior, para no
      // apilar un aviso por cada pago informado.
      tag: payload.tag,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data as { url?: string } | null)?.url ?? "/";

  event.waitUntil(
    (async () => {
      // Si la app ya está abierta se reutiliza esa ventana; abrir una nueva
      // dejaría dos instancias de la PWA compitiendo.
      const abiertas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existente = abiertas.find((c) => c.url.includes(destino));
      if (existente) {
        await existente.focus();
        return;
      }
      await self.clients.openWindow(destino);
    })()
  );
});
