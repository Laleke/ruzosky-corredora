import { NextRequest, NextResponse } from "next/server";
import { procesarNotificacionesCobro } from "@/features/notificaciones/notificaciones-cobro-envio";
import { emailConfigurado } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Cron diario (ver vercel.json) — avisa por email al arrendatario sobre un
 * cargo pendiente, N días antes de su vencimiento y/o N días después, según
 * la configuración de `config_notificaciones_cobro`.
 *
 * Igual que /api/cron/recordatorios: sin sesión de usuario, el gate de
 * seguridad es el header `Authorization: Bearer CRON_SECRET`.
 *
 * [DEUDA] El plan Vercel actual (Hobby) solo permite 1 ejecución de cron al
 * día, así que `hora_envio` configurada por el admin es orientativa: el
 * correo en la práctica sale a la hora fija en que corre este cron (ver
 * `vercel.json`), no a la hora exacta guardada. Corrección: subir a un plan
 * con cron más frecuente y filtrar candidatos por `hora_envio` real.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!emailConfigurado()) {
    return NextResponse.json({ error: "Resend sin configurar (RESEND_API_KEY/RESEND_FROM)." });
  }

  const hoyISO = new Date().toISOString().slice(0, 10);
  const resultado = await procesarNotificacionesCobro(hoyISO);

  return NextResponse.json(resultado);
}
