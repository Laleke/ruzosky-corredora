import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Inyectado por Serwist en build: lista de assets a precachear.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * `defaultCache` usa `NetworkFirst` SIN `networkTimeoutSeconds` para
 * navegación (HTML/RSC): si la conexión del celular se cuelga (red móvil
 * intermitente, típico en el uso real), Workbox espera esa respuesta para
 * siempre en vez de caer al cache — la app queda "pegada" en la pantalla
 * anterior (o en el `loading.tsx`) indefinidamente. Se antepone una copia de
 * esas mismas reglas con un timeout, para que a los 8s caiga al cache en vez
 * de colgarse. Van ANTES de `defaultCache` en el arreglo: Workbox usa la
 * primera regla que matchee.
 */
const NAVEGACION_CON_TIMEOUT: RuntimeCaching[] = [
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.rscPrefetch,
      networkTimeoutSeconds: 8,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.rsc,
      networkTimeoutSeconds: 8,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("Content-Type")?.includes("text/html") === true &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: PAGES_CACHE_NAME.html,
      networkTimeoutSeconds: 8,
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // false: el SW nuevo espera la orden del cliente (banner "Actualizar")
  // en vez de tomar control en silencio con la pestaña ya abierta.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...NAVEGACION_CON_TIMEOUT, ...defaultCache],
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
      badge: "/icons/icon-192.png",
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
