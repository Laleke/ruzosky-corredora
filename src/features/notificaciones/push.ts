import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  titulo: string;
  cuerpo: string;
  /** Ruta a abrir al tocar la notificación. */
  url: string;
  /** Mismo tag = reemplaza el aviso anterior en vez de apilarlo. */
  tag?: string;
};

/**
 * Las claves VAPID identifican al servidor ante el navegador. Si no están
 * configuradas, el push simplemente no se envía: es una función accesoria y no
 * puede impedir que se registre una solicitud de pago.
 */
function vapidConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

let vapidListo = false;

function configurarVapid(): void {
  if (vapidListo) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:soporte@rzkprop.cl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidListo = true;
}

/**
 * Envía una notificación push a todos los admin de la empresa.
 *
 * Nunca lanza: se llama desde flujos de negocio (informar un pago) donde una
 * falla de notificación no debe abortar la operación ni mostrarle un error al
 * arrendatario. Los problemas se registran en consola y se sigue.
 *
 * Las suscripciones que el navegador ya invalidó (404/410) se borran, para que
 * no se acumulen endpoints muertos que hagan lento cada envío.
 */
export async function notificarAdmins(
  empresaId: string,
  payload: PushPayload
): Promise<void> {
  if (!vapidConfigurado()) {
    console.warn("[push] VAPID sin configurar: no se envía la notificación.");
    return;
  }

  try {
    configurarVapid();
    const admin = createAdminClient();

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("rol", "admin");

    const ids = (admins ?? []).map((p) => p.id);
    if (ids.length === 0) return;

    const { data: suscripciones } = await admin
      .from("push_suscripciones")
      .select("endpoint, p256dh, auth")
      .in("profile_id", ids);

    if (!suscripciones || suscripciones.length === 0) return;

    const cuerpo = JSON.stringify(payload);
    const muertas: string[] = [];

    await Promise.all(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            cuerpo
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            muertas.push(s.endpoint);
            return;
          }
          console.error("[push] no se pudo enviar", { endpoint: s.endpoint, status });
        }
      })
    );

    if (muertas.length > 0) {
      await admin.from("push_suscripciones").delete().in("endpoint", muertas);
    }
  } catch (error) {
    console.error("[push] error inesperado al notificar", error);
  }
}
