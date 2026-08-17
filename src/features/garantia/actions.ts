"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import type { TipoMovimientoGarantia } from "@/types/database.types";
import { listMovimientosGarantia, saldoGarantiaDisponible } from "./queries";

export type GarantiaFormState = { error: string | null };

const TIPOS: TipoMovimientoGarantia[] = ["recepcion", "retencion", "devolucion"];

function limpiar(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function registrarMovimientoGarantia(
  contratoId: string,
  _prev: GarantiaFormState,
  fd: FormData
): Promise<GarantiaFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const tipo_movimiento = String(fd.get("tipo_movimiento") ?? "") as TipoMovimientoGarantia;
  if (!TIPOS.includes(tipo_movimiento)) return { error: "Tipo de movimiento inválido." };

  const monto = Number(fd.get("monto"));
  if (!Number.isFinite(monto) || monto <= 0)
    return { error: "El monto debe ser mayor a 0." };

  const fecha = limpiar(fd.get("fecha"));
  if (!fecha) return { error: "La fecha es obligatoria." };

  const motivo = limpiar(fd.get("motivo"));

  const supabase = await createClient();

  // La regla de "no exceder el saldo" se valida siempre contra el saldo real
  // recalculado en el servidor, nunca contra un valor que venga del cliente.
  if (tipo_movimiento !== "recepcion") {
    const movimientos = await listMovimientosGarantia(contratoId);
    const saldo = saldoGarantiaDisponible(movimientos);
    if (monto > saldo) {
      return {
        error: `El monto supera el saldo disponible ($${Math.round(saldo).toLocaleString("es-CL")}).`,
      };
    }
  }

  const { data: movimiento, error: dbError } = await supabase
    .from("contrato_garantias")
    .insert({
      empresa_id: profile.empresa_id,
      contrato_id: contratoId,
      tipo_movimiento,
      monto: Math.round(monto * 100) / 100,
      fecha,
      motivo,
      creado_por: profile.id,
      creado_por_email: profile.email,
    })
    .select("id")
    .single();

  if (dbError || !movimiento) return { error: "No se pudo registrar el movimiento." };

  await registrarAuditoria(
    supabase,
    profile,
    "garantia_movimiento_creado",
    "contrato_garantia",
    movimiento.id,
    { contrato_id: contratoId, tipo_movimiento, monto }
  );

  revalidatePath(`/contratos/${contratoId}`);
  return { error: null };
}

export async function eliminarMovimientoGarantia(
  contratoId: string,
  id: string
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("contrato_garantias").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el movimiento." };

  await registrarAuditoria(
    supabase,
    profile,
    "garantia_movimiento_eliminado",
    "contrato_garantia",
    id,
    { contrato_id: contratoId }
  );

  revalidatePath(`/contratos/${contratoId}`);
  return { error: null };
}
