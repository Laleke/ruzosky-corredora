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

export type ResultadoNotificacion = {
  /** Envíos que el navegador aceptó (no implica que el usuario ya la vio). */
  entregadas: number;
  /** Suscripciones muertas (404/410), borradas de la base. */
  muertas: number;
  /** Otros fallos (ej. VAPID mal configurado del lado del servidor). */
  errores: { endpoint: string; status?: number; mensaje?: string }[];
};

/**
 * Envía una notificación push a todos los admin de la empresa.
 *
 * Nunca lanza: se llama desde flujos de negocio (informar un pago) donde una
 * falla de notificación no debe abortar la operación ni mostrarle un error al
 * arrendatario. Los problemas se registran en consola y se sigue — pero el
 * resultado real se devuelve para que un caller que sí necesite saber si se
 * entregó algo (ej. el cron de Recordatorios, antes de marcar "ya avisado")
 * no tenga que asumirlo.
 *
 * Las suscripciones que el navegador ya invalidó (404/410) se borran, para que
 * no se acumulen endpoints muertos que hagan lento cada envío.
 */
export async function notificarAdmins(
  empresaId: string,
  payload: PushPayload
): Promise<ResultadoNotificacion> {
  const vacio: ResultadoNotificacion = { entregadas: 0, muertas: 0, errores: [] };

  if (!vapidConfigurado()) {
    console.warn("[push] VAPID sin configurar: no se envía la notificación.");
    return vacio;
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
    if (ids.length === 0) return vacio;

    const { data: suscripciones } = await admin
      .from("push_suscripciones")
      .select("endpoint, p256dh, auth")
      .in("profile_id", ids);

    if (!suscripciones || suscripciones.length === 0) return vacio;

    const cuerpo = JSON.stringify(payload);
    const muertas: string[] = [];
    const errores: ResultadoNotificacion["errores"] = [];
    let entregadas = 0;

    await Promise.all(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            cuerpo
          );
          entregadas++;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            muertas.push(s.endpoint);
            return;
          }
          const mensaje = (error as { body?: string; message?: string }).body
            ?? (error as { message?: string }).message;
          console.error("[push] no se pudo enviar", { endpoint: s.endpoint, status, mensaje });
          errores.push({ endpoint: s.endpoint, status, mensaje });
        }
      })
    );

    if (muertas.length > 0) {
      await admin.from("push_suscripciones").delete().in("endpoint", muertas);
    }

    return { entregadas, muertas: muertas.length, errores };
  } catch (error) {
    console.error("[push] error inesperado al notificar", error);
    return vacio;
  }
}
