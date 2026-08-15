import { createClient } from "@/lib/supabase/server";
import { listPendientesLiquidar } from "@/features/liquidaciones/queries";
import {
  listContratosSinArriendo,
  periodoArriendoVigente,
  debeAvisarGeneracionAsistida,
  listContratosConDesfazadoPendiente,
} from "@/features/cobros/queries";
import { listContratosConReajustePendiente } from "@/features/contratos/queries";
import { solicitudesPendientes } from "@/features/solicitudes-pago/queries";

export type DashboardStats = {
  propiedadesTotal: number;
  propiedadesArrendadas: number;
  deudaPendiente: number;
  cargosMorosos: number;
  pagosRecibidosMesMonto: number;
};

/** Métricas para el dashboard. Conteos y sumas acotados al tenant por RLS. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoy.slice(0, 7)}-01`;

  const [propiedadesTotal, propiedadesArrendadas, cargos, cargosDelPeriodo] = await Promise.all([
    supabase
      .from("propiedades")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("propiedades")
      .select("*", { count: "exact", head: true })
      .eq("estado", "arrendada"),
    supabase
      .from("cargos")
      .select("saldo_pendiente, fecha_vencimiento")
      .gt("saldo_pendiente", 0),
    // "Pagos recibidos" se mide por el período del cargo (no por la fecha en
    // que se registró el pago): el arriendo se paga por adelantado, así que
    // filtrar por fecha_pago dejaría afuera pagos hechos antes de que empiece
    // el mes que en realidad cubren.
    supabase.from("cargos").select("id").eq("periodo", inicioMes),
  ]);

  const filas = cargos.data ?? [];
  const deudaPendiente = filas.reduce(
    (acc, c) => acc + Number(c.saldo_pendiente),
    0
  );
  const cargosMorosos = filas.filter(
    (c) => c.fecha_vencimiento && c.fecha_vencimiento < hoy
  ).length;

  const idsCargosPeriodo = (cargosDelPeriodo.data ?? []).map((c) => c.id);
  const pagosPeriodo =
    idsCargosPeriodo.length > 0
      ? await supabase.from("pagos").select("monto_pagado").in("cargo_id", idsCargosPeriodo)
      : { data: [] as { monto_pagado: number }[] };
  const pagosRecibidosMesMonto = (pagosPeriodo.data ?? []).reduce(
    (acc, p) => acc + Number(p.monto_pagado),
    0
  );

  return {
    propiedadesTotal: propiedadesTotal.count ?? 0,
    propiedadesArrendadas: propiedadesArrendadas.count ?? 0,
    deudaPendiente,
    cargosMorosos,
    pagosRecibidosMesMonto,
  };
}

export type TareaPendiente = {
  key: string;
  label: string;
  cantidad: number;
  href: string;
  alerta: boolean;
};

/** Ítems del Dashboard Operativo que ya pueden calcularse con los datos actuales. */
export async function getTareasPendientes(): Promise<TareaPendiente[]> {
  const supabase = await createClient();
  const periodoActual = new Date().toISOString().slice(0, 7);
  // El arriendo se paga por adelantado: se avisa por el período siguiente, no el actual.
  const periodoArriendo = periodoArriendoVigente();
  const hoy = new Date().toISOString().slice(0, 10);
  const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // Instrumentación temporal (ver page.tsx del Dashboard): mide cada rama en
  // paralelo por separado para encontrar cuál es la lenta. Quitar junto con
  // el resto de los console.log de "[dashboard-timing]".
  const t0 = Date.now();
  function medir<T>(nombre: string, p: PromiseLike<T>): Promise<T> {
    return Promise.resolve(p).then((r) => {
      console.log(`[dashboard-timing] tareas.${nombre}: ${Date.now() - t0}ms`);
      return r;
    });
  }

  const [
    liquidacionesPendientes,
    cobrosPendientes,
    gastosPorLiquidar,
    comprobantesPendientes,
    contratosPorVencer,
    contratosConReajustePendiente,
    contratosConDesfazadoPendiente,
    solicitudesPagoPendientes,
  ] = await Promise.all([
    medir("listPendientesLiquidar", listPendientesLiquidar(`${periodoActual}-01`)),
    medir(
      "listContratosSinArriendo",
      debeAvisarGeneracionAsistida()
        ? listContratosSinArriendo(`${periodoArriendo}-01`)
        : Promise.resolve([])
    ),
    medir(
      "gastosPorLiquidar",
      supabase
        .from("gastos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pendiente")
        .eq("descontar_de_liquidacion", true)
        .is("liquidacion_id", null)
    ),
    medir(
      "comprobantesPendientes",
      supabase
        .from("gastos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pagado")
        .is("documento_id", null)
    ),
    medir(
      "contratosPorVencer",
      supabase
        .from("contratos")
        .select("*", { count: "exact", head: true })
        .in("estado", ["vigente", "renovado"])
        .eq("activo", true)
        .gte("fecha_termino", hoy)
        .lte("fecha_termino", en30dias)
    ),
    medir("listContratosConReajustePendiente", listContratosConReajustePendiente()),
    medir("listContratosConDesfazadoPendiente", listContratosConDesfazadoPendiente()),
    medir("solicitudesPendientes", solicitudesPendientes()),
  ]);

  return [
    {
      key: "solicitudes_pago",
      label: "Solicitudes de pago por aprobar",
      cantidad: solicitudesPagoPendientes.length,
      href: "/cobros/solicitudes",
      alerta: solicitudesPagoPendientes.length > 0,
    },
    {
      key: "liquidaciones",
      label: "Liquidaciones pendientes de generar",
      cantidad: liquidacionesPendientes.length,
      href: "/liquidaciones",
      alerta: liquidacionesPendientes.length > 0,
    },
    {
      key: "cobros",
      label: "Arriendos pendientes de generar",
      cantidad: cobrosPendientes.length,
      href: "/cobros",
      alerta: cobrosPendientes.length > 0,
    },
    {
      key: "gastos",
      label: "Gastos pendientes de liquidar",
      cantidad: gastosPorLiquidar.count ?? 0,
      href: "/gastos?estado=pendiente",
      alerta: false,
    },
    {
      key: "comprobantes",
      label: "Comprobantes de pago pendientes de adjuntar",
      cantidad: comprobantesPendientes.count ?? 0,
      href: "/gastos?estado=pagado",
      alerta: false,
    },
    {
      key: "contratos",
      label: "Contratos que vencen en 30 días",
      cantidad: contratosPorVencer.count ?? 0,
      href: "/contratos",
      alerta: (contratosPorVencer.count ?? 0) > 0,
    },
    {
      key: "reajustes",
      label: "Contratos con reajuste pendiente de revisar",
      cantidad: contratosConReajustePendiente.length,
      href: "/contratos",
      alerta: contratosConReajustePendiente.length > 0,
    },
    {
      key: "desfazados",
      label: "Contratos terminados con cargo desfazado sin generar (luz/GGCC/etc.)",
      cantidad: contratosConDesfazadoPendiente.length,
      href: "/cobros",
      alerta: contratosConDesfazadoPendiente.length > 0,
    },
  ];
}
