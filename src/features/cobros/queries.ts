import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { etiquetaContrato } from "@/lib/propiedad";
import type { Database } from "@/types/database.types";
import type { Cargo, CargoConContexto, FiltrosCargos, Pago } from "./types";

type DB = SupabaseClient<Database>;

/**
 * Propiedad y arrendatario no son columnas directas de `cargos` (viven en el
 * contrato); se resuelven al conjunto de contratos que cumplen el criterio.
 * null = sin filtro; [] = criterio sin contratos (resultado vacío).
 */
async function resolverContratoScope(
  supabase: DB,
  filtros: FiltrosCargos
): Promise<string[] | null> {
  const conjuntos: string[][] = [];

  if (filtros.propiedadId) {
    const { data } = await supabase
      .from("contratos")
      .select("id")
      .eq("propiedad_id", filtros.propiedadId);
    conjuntos.push((data ?? []).map((r) => r.id));
  }

  if (filtros.arrendatarioId) {
    const { data } = await supabase
      .from("contratos_arrendatarios")
      .select("contrato_id")
      .eq("arrendatario_id", filtros.arrendatarioId);
    conjuntos.push((data ?? []).map((r) => r.contrato_id));
  }

  if (conjuntos.length === 0) return null;
  return conjuntos.reduce((acc, set) => acc.filter((id) => set.includes(id)));
}

export async function listCargos(
  filtros: FiltrosCargos = {}
): Promise<CargoConContexto[]> {
  const supabase = await createClient();

  const scope = await resolverContratoScope(supabase, filtros);
  if (scope && scope.length === 0) return [];

  let q = supabase
    .from("cargos")
    .select("*, contratos(numero_contrato, propiedades(direccion))")
    .order("periodo", { ascending: false });

  if (scope) q = q.in("contrato_id", scope);
  if (filtros.periodo) q = q.eq("periodo", `${filtros.periodo}-01`);
  if (filtros.venceDesde) q = q.gte("fecha_vencimiento", filtros.venceDesde);
  if (filtros.venceHasta) q = q.lte("fecha_vencimiento", filtros.venceHasta);
  if (filtros.estado && filtros.estado !== "vencido") {
    q = q.eq("estado", filtros.estado);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  type Row = Cargo & {
    contratos: {
      numero_contrato: string | null;
      propiedades: { direccion: string } | null;
    } | null;
  };

  let filas = ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    numero_contrato: c.contratos?.numero_contrato ?? null,
    propiedad_direccion: c.contratos?.propiedades?.direccion ?? "—",
  }));

  // "Vencido" es derivado (saldo pendiente + fecha de vencimiento pasada), no una columna.
  if (filtros.estado === "vencido") {
    const hoy = new Date().toISOString().slice(0, 10);
    filas = filas.filter(
      (c) =>
        Number(c.saldo_pendiente) > 0 &&
        !!c.fecha_vencimiento &&
        c.fecha_vencimiento < hoy
    );
  }

  return filas;
}

export type ContratoSinArriendo = { contratoId: string; label: string };

/**
 * Contratos vigentes/renovados que aún no tienen un cargo de arriendo
 * generado para el período dado. Base del indicador "cobros pendientes".
 */
export async function listContratosSinArriendo(
  periodo: string
): Promise<ContratoSinArriendo[]> {
  const supabase = await createClient();
  const { data: contratos } = await supabase
    .from("contratos")
    .select(
      "id, numero_contrato, propiedades(codigo_interno, direccion, numero, departamento)"
    )
    .in("estado", ["vigente", "renovado"])
    .eq("activo", true);
  if (!contratos || contratos.length === 0) return [];

  const { data: cargos } = await supabase
    .from("cargos")
    .select("contrato_id")
    .eq("periodo", periodo)
    .eq("tipo_cargo", "arriendo");
  const conArriendo = new Set((cargos ?? []).map((c) => c.contrato_id));

  type Row = {
    id: string;
    numero_contrato: string | null;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  };

  return (contratos as unknown as Row[])
    .filter((c) => !conArriendo.has(c.id))
    .map((c) => ({
      contratoId: c.id,
      label: etiquetaContrato(c.numero_contrato, c.propiedades),
    }));
}

export async function getCargo(id: string): Promise<CargoConContexto | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cargos")
    .select("*, contratos(numero_contrato, propiedades(direccion))")
    .eq("id", id)
    .single();

  if (!data) return null;

  type Row = Cargo & {
    contratos: {
      numero_contrato: string | null;
      propiedades: { direccion: string } | null;
    } | null;
  };
  const c = data as unknown as Row;
  return {
    ...c,
    numero_contrato: c.contratos?.numero_contrato ?? null,
    propiedad_direccion: c.contratos?.propiedades?.direccion ?? "—",
  };
}

export async function getPagosDeCargo(cargoId: string): Promise<Pago[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("cargo_id", cargoId)
    .order("fecha_pago", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
