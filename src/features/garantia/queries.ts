import { createClient } from "@/lib/supabase/server";
import type { MovimientoGarantia } from "./types";

export async function listMovimientosGarantia(
  contratoId: string
): Promise<MovimientoGarantia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contrato_garantias")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Saldo disponible de garantía: recepciones - retenciones - devoluciones. */
export function saldoGarantiaDisponible(movimientos: MovimientoGarantia[]): number {
  return movimientos.reduce((acc, m) => {
    if (m.tipo_movimiento === "recepcion") return acc + Number(m.monto);
    return acc - Number(m.monto);
  }, 0);
}
