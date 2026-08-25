import { createClient } from "@/lib/supabase/server";
import type { Recordatorio, RecordatorioConFaltantes } from "./types";

/**
 * Contratos vigentes/renovados activos a los que les falta el cargo de
 * `tipoCargo` en el período dado. Mismo patrón que
 * `listContratosSinArriendo` (src/features/cobros/queries.ts), generalizado
 * a cualquier tipo de cargo.
 */
async function listContratosFaltantes(
  tipoCargo: Recordatorio["tipo_cargo"],
  periodo: string
): Promise<{ contratoId: string; propiedadDireccion: string }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contratos")
    .select("id, propiedades(direccion, numero, departamento)")
    .in("estado", ["vigente", "renovado"])
    .eq("activo", true);

  type Row = {
    id: string;
    propiedades: {
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  };
  const contratos = (data ?? []) as unknown as Row[];
  if (contratos.length === 0) return [];

  const { data: cargos } = await supabase
    .from("cargos")
    .select("contrato_id")
    .eq("periodo", periodo)
    .eq("tipo_cargo", tipoCargo);
  const conCargo = new Set((cargos ?? []).map((c) => c.contrato_id));

  return contratos
    .filter((c) => !conCargo.has(c.id))
    .map((c) => {
      const p = c.propiedades;
      const calle = p ? [p.direccion, p.numero].filter(Boolean).join(" ") : null;
      const unidad = p?.departamento ? `Depto/Unidad ${p.departamento}` : null;
      return {
        contratoId: c.id,
        propiedadDireccion: [calle, unidad].filter(Boolean).join(" · ") || "—",
      };
    });
}

/** Todos los recordatorios de la empresa, con las propiedades que actualmente
 *  les faltan el cargo del mes en curso — "validando los que faltan solamente". */
export async function listRecordatorios(): Promise<RecordatorioConFaltantes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recordatorios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return [];

  const hoy = new Date();
  const periodoActual = `${hoy.toISOString().slice(0, 7)}-01`;

  return Promise.all(
    data.map(async (r) => ({
      ...r,
      faltantes: await listContratosFaltantes(r.tipo_cargo, periodoActual),
    }))
  );
}
