import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email";
import { sumarDias, formatearFecha } from "@/lib/fecha";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { tokenEstadoCuentaVigente } from "@/features/estado-cuenta/token-queries";

type TipoAviso = "antes_vencimiento" | "vencido";

type CargoRow = {
  id: string;
  empresa_id: string;
  contrato_id: string;
  tipo_cargo: string;
  monto: number;
  fecha_vencimiento: string;
};

type ConfigRow = {
  empresa_id: string;
  contrato_id: string | null;
  dias_antes: number | null;
  dias_despues: number | null;
  activo: boolean;
};

type ArrendatarioDestino = {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
};

function sitioUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function nombreDestino(a: ArrendatarioDestino): string {
  return a.razon_social || [a.nombre, a.apellido].filter(Boolean).join(" ") || "arrendatario/a";
}

function construirHtml(params: {
  nombre: string;
  tipo: TipoAviso;
  etiquetaCargo: string;
  monto: number;
  fechaVencimiento: string;
  url: string;
}): { subject: string; html: string } {
  const montoTexto = `$${Math.round(params.monto).toLocaleString("es-CL")}`;
  const fechaTexto = formatearFecha(params.fechaVencimiento);

  if (params.tipo === "antes_vencimiento") {
    return {
      subject: `Recordatorio: ${params.etiquetaCargo} vence el ${fechaTexto}`,
      html: `
        <p>Hola ${params.nombre},</p>
        <p>Te recordamos que tu cobro de <strong>${params.etiquetaCargo}</strong> por
        <strong>${montoTexto}</strong> vence el <strong>${fechaTexto}</strong>.</p>
        <p><a href="${params.url}">Ver estado de cuenta</a></p>
      `.trim(),
    };
  }

  return {
    subject: `${params.etiquetaCargo} vencido — regulariza tu cobro`,
    html: `
      <p>Hola ${params.nombre},</p>
      <p>Tu cobro de <strong>${params.etiquetaCargo}</strong> por
      <strong>${montoTexto}</strong>, con vencimiento el <strong>${fechaTexto}</strong>,
      se encuentra pendiente.</p>
      <p><a href="${params.url}">Ver estado de cuenta y cómo regularizar</a></p>
    `.trim(),
  };
}

export type ResultadoNotificacionesCobro = {
  cargosConAviso: number;
  enviados: number;
  errores: number;
  detalle: { cargoId: string; tipo: TipoAviso; email: string; ok: boolean; error?: string }[];
};

/**
 * Evalúa los cargos pendientes/parciales de todas las empresas y envía el
 * aviso por email al arrendatario cuando corresponde (N días antes del
 * vencimiento, o N días después de vencido), según la config efectiva del
 * contrato (override propio o, si no tiene, el default de su empresa).
 *
 * Idempotente vía `notificaciones_cobro_log`: un mismo (cargo, arrendatario,
 * tipo) marcado 'enviado' no se vuelve a mandar aunque el cron se ejecute más
 * de una vez el mismo día o el aviso siga vigente varios días.
 */
export async function procesarNotificacionesCobro(
  hoyISO: string
): Promise<ResultadoNotificacionesCobro> {
  const admin = createAdminClient();
  const resultado: ResultadoNotificacionesCobro = {
    cargosConAviso: 0,
    enviados: 0,
    errores: 0,
    detalle: [],
  };

  const { data: cargosData } = await admin
    .from("cargos")
    .select("id, empresa_id, contrato_id, tipo_cargo, monto, fecha_vencimiento")
    .in("estado", ["pendiente", "parcial"])
    .not("fecha_vencimiento", "is", null);
  const cargos = (cargosData ?? []) as unknown as CargoRow[];
  if (cargos.length === 0) return resultado;

  const empresaIds = Array.from(new Set(cargos.map((c) => c.empresa_id)));
  const { data: configsData } = await admin
    .from("config_notificaciones_cobro")
    .select("empresa_id, contrato_id, dias_antes, dias_despues, activo")
    .in("empresa_id", empresaIds);
  const configs = (configsData ?? []) as ConfigRow[];

  const defaultPorEmpresa = new Map<string, ConfigRow>();
  const overridePorContrato = new Map<string, ConfigRow>();
  for (const c of configs) {
    if (c.contrato_id) overridePorContrato.set(c.contrato_id, c);
    else defaultPorEmpresa.set(c.empresa_id, c);
  }

  function configEfectiva(cargo: CargoRow): ConfigRow | null {
    const override = overridePorContrato.get(cargo.contrato_id);
    if (override) return override.activo ? override : null;
    const def = defaultPorEmpresa.get(cargo.empresa_id);
    return def && def.activo ? def : null;
  }

  const candidatos: { cargo: CargoRow; tipo: TipoAviso }[] = [];
  for (const cargo of cargos) {
    const config = configEfectiva(cargo);
    if (!config) continue;

    if (config.dias_antes) {
      const desde = sumarDias(cargo.fecha_vencimiento, -config.dias_antes);
      if (hoyISO >= desde && hoyISO <= cargo.fecha_vencimiento) {
        candidatos.push({ cargo, tipo: "antes_vencimiento" });
      }
    }
    if (config.dias_despues) {
      const desde = sumarDias(cargo.fecha_vencimiento, config.dias_despues);
      if (hoyISO >= desde) {
        candidatos.push({ cargo, tipo: "vencido" });
      }
    }
  }
  if (candidatos.length === 0) return resultado;

  const cargoIds = Array.from(new Set(candidatos.map((c) => c.cargo.id)));
  const { data: logData } = await admin
    .from("notificaciones_cobro_log")
    .select("cargo_id, arrendatario_id, tipo")
    .in("cargo_id", cargoIds)
    .eq("estado", "enviado");
  const yaEnviados = new Set(
    (logData ?? []).map((r) => `${r.cargo_id}|${r.arrendatario_id}|${r.tipo}`)
  );

  const contratoIds = Array.from(new Set(candidatos.map((c) => c.cargo.contrato_id)));
  const { data: vinculosData } = await admin
    .from("contratos_arrendatarios")
    .select("contrato_id, arrendatarios(id, email, nombre, apellido, razon_social)")
    .in("contrato_id", contratoIds);
  type VinculoRow = { contrato_id: string; arrendatarios: ArrendatarioDestino | null };
  const vinculos = (vinculosData ?? []) as unknown as VinculoRow[];

  const arrendatariosPorContrato = new Map<string, ArrendatarioDestino[]>();
  for (const v of vinculos) {
    if (!v.arrendatarios?.email) continue;
    const lista = arrendatariosPorContrato.get(v.contrato_id) ?? [];
    lista.push(v.arrendatarios);
    arrendatariosPorContrato.set(v.contrato_id, lista);
  }

  for (const { cargo, tipo } of candidatos) {
    const destinatarios = arrendatariosPorContrato.get(cargo.contrato_id) ?? [];
    if (destinatarios.length > 0) resultado.cargosConAviso++;

    for (const arrendatario of destinatarios) {
      const clave = `${cargo.id}|${arrendatario.id}|${tipo}`;
      if (yaEnviados.has(clave)) continue;

      const token = await tokenEstadoCuentaVigente(admin, arrendatario.id, cargo.empresa_id);
      const { subject, html } = construirHtml({
        nombre: nombreDestino(arrendatario),
        tipo,
        etiquetaCargo: etiquetaTipoCargo(cargo.tipo_cargo),
        monto: cargo.monto,
        fechaVencimiento: cargo.fecha_vencimiento,
        url: `${sitioUrl()}/e/${token}`,
      });

      const envio = await enviarEmail({ to: arrendatario.email, subject, html });

      await admin.from("notificaciones_cobro_log").insert({
        empresa_id: cargo.empresa_id,
        cargo_id: cargo.id,
        arrendatario_id: arrendatario.id,
        tipo,
        email_destino: arrendatario.email,
        estado: envio.enviado ? "enviado" : "error",
        error_detalle: envio.error ?? null,
      });

      if (envio.enviado) resultado.enviados++;
      else resultado.errores++;
      resultado.detalle.push({
        cargoId: cargo.id,
        tipo,
        email: arrendatario.email,
        ok: envio.enviado,
        error: envio.error,
      });
    }
  }

  return resultado;
}
