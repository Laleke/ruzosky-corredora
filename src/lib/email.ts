import { Resend } from "resend";

/**
 * RESEND_API_KEY / RESEND_FROM son accesorios: si no están configurados el
 * correo simplemente no se envía (igual criterio que VAPID en
 * src/features/notificaciones/push.ts) — no puede tumbar un flujo de negocio.
 */
export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

let cliente: Resend | null = null;

function getCliente(): Resend {
  if (!cliente) cliente = new Resend(process.env.RESEND_API_KEY!);
  return cliente;
}

export type ResultadoEmail = { enviado: boolean; error?: string };

/**
 * Envía un correo simple. Nunca lanza — devuelve el resultado real para que
 * el caller (ej. el cron de notificaciones de cobro) decida si registrar el
 * envío como exitoso antes de marcarlo como avisado.
 */
export async function enviarEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResultadoEmail> {
  if (!emailConfigurado()) {
    console.warn("[email] Resend sin configurar: no se envía el correo.");
    return { enviado: false, error: "Resend sin configurar." };
  }

  try {
    const { error } = await getCliente().emails.send({
      from: process.env.RESEND_FROM!,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[email] Resend rechazó el envío", error);
      return { enviado: false, error: error.message };
    }
    return { enviado: true };
  } catch (error) {
    console.error("[email] error inesperado al enviar", error);
    return { enviado: false, error: error instanceof Error ? error.message : String(error) };
  }
}
