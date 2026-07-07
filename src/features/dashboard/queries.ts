import { createClient } from "@/lib/supabase/server";
import { listPendientesLiquidar } from "@/features/liquidaciones/queries";
import { listContratosSinArriendo } from "@/features/cobros/queries";

export type DashboardStats = {
  propiedadesTotal: number;
  propiedadesArrendadas: number;
  contratosVigentes: number;
  deudaPendiente: number;
  cargosMorosos: number;
};

/** Métricas para el dashboard. Conteos y sumas acotados al tenant por RLS. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    propiedadesTotal,
    propiedadesArrendadas,
    contratosVigentes,
    cargos,
  ] = await Promise.all([
    supabase
      .from("propiedades")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("propiedades")
      .select("*", { count: "exact", head: true })
      .eq("estado", "arrendada"),
    supabase
      .from("contratos")
      .select("*", { count: "exact", head: true })
      .in("estado", ["vigente", "renovado"])
      .eq("activo", true),
    supabase
      .from("cargos")
      .select("saldo_pendiente, fecha_vencimiento")
      .gt("saldo_pendiente", 0),
  ]);

  const filas = cargos.data ?? [];
  const deudaPendiente = filas.reduce(
    (acc, c) => acc + Number(c.saldo_pendiente),
    0
  );
  const cargosMorosos = filas.filter(
    (c) => c.fecha_vencimiento && c.fecha_vencimiento < hoy
  ).length;

  return {
    propiedadesTotal: propiedadesTotal.count ?? 0,
    propiedadesArrendadas: propiedadesArrendadas.count ?? 0,
    contratosVigentes: contratosVigentes.count ?? 0,
    deudaPendiente,
    cargosMorosos,
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
  const hoy = new Date().toISOString().slice(0, 10);
  const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    liquidacionesPendientes,
    cobrosPendientes,
    gastosPorLiquidar,
    comprobantesPendientes,
    contratosPorVencer,
  ] = await Promise.all([
    listPendientesLiquidar(`${periodoActual}-01`),
    listContratosSinArriendo(`${periodoActual}-01`),
    supabase
      .from("gastos")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente")
      .eq("descontar_de_liquidacion", true)
      .is("liquidacion_id", null),
    supabase
      .from("gastos")
      .select("*", { count: "exact", head: true })
      .eq("estado", "pagado")
      .is("documento_id", null),
    supabase
      .from("contratos")
      .select("*", { count: "exact", head: true })
      .in("estado", ["vigente", "renovado"])
      .eq("activo", true)
      .gte("fecha_termino", hoy)
      .lte("fecha_termino", en30dias),
  ]);

  return [
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
  ];
}
