import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarAdmins } from "@/features/notificaciones/push";
import { etiquetaTipoCargo } from "@/features/cobros/constants";

export const dynamic = "force-dynamic";

/**
 * Cron diario (ver vercel.json) — evalúa cada recordatorio activo cuyo
 * `dia_mes_aviso` ya llegó y, SOLO si sigue faltando el cargo de ese tipo
 * este mes para algún contrato activo, notifica por push a los admins de esa
 * empresa. `ultima_notificacion_en` evita mandar más de un push por día para
 * el mismo recordatorio.
 *
 * No hay sesión de usuario en un cron — el gate de seguridad es el header
 * `Authorization: Bearer CRON_SECRET` (ver README de Vercel Cron), no un rol
 * de admin como en el resto de las server actions.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const hoy = new Date();
  const hoyISO = hoy.toISOString().slice(0, 10);
  const diaHoy = hoy.getDate();
  const periodoActual = `${hoyISO.slice(0, 7)}-01`;

  const { data: recordatorios } = await admin
    .from("recordatorios")
    .select("id, empresa_id, tipo_cargo, nombre, dia_mes_aviso, ultima_notificacion_en")
    .eq("activo", true)
    .lte("dia_mes_aviso", diaHoy);

  let enviados = 0;
  let entregadasTotal = 0;
  const errores: { status?: number; mensaje?: string }[] = [];

  for (const r of recordatorios ?? []) {
    if (r.ultima_notificacion_en === hoyISO) continue;

    const { data: contratos } = await admin
      .from("contratos")
      .select("id")
      .eq("empresa_id", r.empresa_id)
      .in("estado", ["vigente", "renovado"])
      .eq("activo", true);

    if (!contratos || contratos.length === 0) continue;

    const { data: cargos } = await admin
      .from("cargos")
      .select("contrato_id")
      .eq("periodo", periodoActual)
      .eq("tipo_cargo", r.tipo_cargo)
      .in(
        "contrato_id",
        contratos.map((c) => c.id)
      );

    const conCargo = new Set((cargos ?? []).map((c) => c.contrato_id));
    const faltantes = contratos.filter((c) => !conCargo.has(c.id));
    if (faltantes.length === 0) continue;

    const etiqueta = etiquetaTipoCargo(r.tipo_cargo);
    const resultado = await notificarAdmins(r.empresa_id, {
      titulo: r.nombre || `Falta cargar ${etiqueta}`,
      cuerpo: `${faltantes.length} propiedad${faltantes.length === 1 ? "" : "es"} sin cargo de ${etiqueta} este mes.`,
      url: "/recordatorios",
      tag: `recordatorio-${r.id}`,
    });
    entregadasTotal += resultado.entregadas;
    errores.push(...resultado.errores.map(({ status, mensaje }) => ({ status, mensaje })));

    // Si no se entregó a nadie (sin suscripciones, o el envío falló), no se
    // marca como avisado — el próximo cron lo vuelve a intentar en vez de
    // darlo por hecho para el resto del día.
    if (resultado.entregadas === 0) continue;

    await admin
      .from("recordatorios")
      .update({ ultima_notificacion_en: hoyISO })
      .eq("id", r.id);
    enviados++;
  }

  return NextResponse.json({
    evaluados: recordatorios?.length ?? 0,
    enviados,
    entregadas: entregadasTotal,
    errores,
  });
}
