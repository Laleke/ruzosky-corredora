import { createClient } from "@/lib/supabase/server";

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
