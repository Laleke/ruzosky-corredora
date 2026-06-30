import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type {
  Liquidacion,
  LiquidacionDetalle,
  LiquidacionConPropietario,
  PreviewLiquidacion,
  LineaLiquidacion,
} from "./types";

type DB = SupabaseClient<Database>;

const TIPO_CARGO_LABEL: Record<string, string> = {
  arriendo: "Arriendo",
  gasto_comun: "Gasto común",
  administracion: "Administración",
  luz: "Luz",
  agua: "Agua",
  internet: "Internet",
  multa: "Multa",
  ajuste: "Ajuste",
  otro: "Otro",
};

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function nombrePropietario(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
} | null): string {
  if (!p) return "—";
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

/**
 * Calcula la liquidación de un propietario para un período (date YYYY-MM-01).
 * Ingresos: pagos efectivos sobre cargos del período, ponderados por % de
 * participación. Descuentos: comisión de administración (mensual) y de
 * corretaje (solo el mes de inicio del contrato).
 */
export async function calcularLiquidacion(
  supabase: DB,
  propietarioId: string,
  periodo: string
): Promise<PreviewLiquidacion> {
  const vacio: PreviewLiquidacion = {
    ingresos: [],
    descuentos: [],
    subtotal_ingresos: 0,
    subtotal_descuentos: 0,
    total_liquidacion: 0,
  };

  const { data: pps } = await supabase
    .from("propietarios_propiedades")
    .select("propiedad_id, porcentaje_participacion")
    .eq("propietario_id", propietarioId);
  if (!pps || pps.length === 0) return vacio;

  const pctPorPropiedad = new Map(
    pps.map((p) => [p.propiedad_id, Number(p.porcentaje_participacion)])
  );
  const propiedadIds = pps.map((p) => p.propiedad_id);

  const { data: contratos } = await supabase
    .from("contratos")
    .select(
      "id, propiedad_id, canon_monto, cobra_administracion, administracion_monto, administracion_porcentaje, tipo_comision, comision_monto, fecha_inicio"
    )
    .in("propiedad_id", propiedadIds)
    .eq("activo", true);
  if (!contratos || contratos.length === 0) return vacio;

  const contratoPorId = new Map(contratos.map((c) => [c.id, c]));
  const contratoIds = contratos.map((c) => c.id);

  const { data: cargos } = await supabase
    .from("cargos")
    .select("id, contrato_id, tipo_cargo, monto")
    .in("contrato_id", contratoIds)
    .eq("periodo", periodo);

  const cargoIds = (cargos ?? []).map((c) => c.id);
  const pagadoPorCargo = new Map<string, number>();
  if (cargoIds.length) {
    const { data: pagos } = await supabase
      .from("pagos")
      .select("cargo_id, monto_pagado")
      .in("cargo_id", cargoIds);
    for (const p of pagos ?? []) {
      pagadoPorCargo.set(
        p.cargo_id,
        (pagadoPorCargo.get(p.cargo_id) ?? 0) + Number(p.monto_pagado)
      );
    }
  }

  const ym = periodo.slice(0, 7);
  const ingresos: LineaLiquidacion[] = [];
  const descuentos: LineaLiquidacion[] = [];
  const arriendoPagadoPorContrato = new Map<string, number>();

  for (const cargo of cargos ?? []) {
    const pagado = pagadoPorCargo.get(cargo.id) ?? 0;
    if (cargo.tipo_cargo === "arriendo") {
      arriendoPagadoPorContrato.set(
        cargo.contrato_id,
        (arriendoPagadoPorContrato.get(cargo.contrato_id) ?? 0) + pagado
      );
    }
    if (pagado <= 0) continue;
    const contrato = contratoPorId.get(cargo.contrato_id);
    if (!contrato) continue;
    const pct = pctPorPropiedad.get(contrato.propiedad_id) ?? 0;
    const monto = r2((pagado * pct) / 100);
    if (monto <= 0) continue;
    ingresos.push({
      tipo: "ingreso",
      concepto: `${TIPO_CARGO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo} ${ym}`,
      referencia_tipo: "cargo",
      referencia_id: cargo.id,
      monto,
    });
  }

  for (const c of contratos) {
    const pct = pctPorPropiedad.get(c.propiedad_id) ?? 0;
    if (pct <= 0) continue;

    if (c.cobra_administracion) {
      const base = arriendoPagadoPorContrato.get(c.id) ?? 0;
      const raw =
        c.administracion_porcentaje != null
          ? (base * Number(c.administracion_porcentaje)) / 100
          : Number(c.administracion_monto ?? 0);
      const monto = r2((raw * pct) / 100);
      if (monto > 0) {
        descuentos.push({
          tipo: "descuento",
          concepto: "Comisión administración",
          referencia_tipo: "contrato",
          referencia_id: c.id,
          monto,
        });
      }
    }

    if (c.tipo_comision && c.fecha_inicio?.slice(0, 7) === ym) {
      const raw =
        c.tipo_comision === "porcentaje"
          ? (Number(c.canon_monto) * Number(c.comision_monto ?? 0)) / 100
          : Number(c.comision_monto ?? 0);
      const monto = r2((raw * pct) / 100);
      if (monto > 0) {
        descuentos.push({
          tipo: "descuento",
          concepto: "Comisión corretaje",
          referencia_tipo: "contrato",
          referencia_id: c.id,
          monto,
        });
      }
    }
  }

  const subtotal_ingresos = r2(ingresos.reduce((a, l) => a + l.monto, 0));
  const subtotal_descuentos = r2(descuentos.reduce((a, l) => a + l.monto, 0));
  return {
    ingresos,
    descuentos,
    subtotal_ingresos,
    subtotal_descuentos,
    total_liquidacion: r2(subtotal_ingresos - subtotal_descuentos),
  };
}

export async function listLiquidaciones(filtros?: {
  propietarioId?: string;
  estado?: string;
}): Promise<LiquidacionConPropietario[]> {
  const supabase = await createClient();
  let q = supabase
    .from("liquidaciones")
    .select(
      "*, propietarios(nombre, apellido, razon_social, tipo_persona)"
    )
    .order("periodo", { ascending: false });

  if (filtros?.propietarioId) q = q.eq("propietario_id", filtros.propietarioId);
  if (filtros?.estado)
    q = q.eq(
      "estado",
      filtros.estado as Database["public"]["Enums"]["estado_liquidacion"]
    );

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  type Row = Liquidacion & {
    propietarios: {
      nombre: string | null;
      apellido: string | null;
      razon_social: string | null;
      tipo_persona: string;
    } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((l) => ({
    ...l,
    propietario_nombre: nombrePropietario(l.propietarios),
  }));
}

export async function getLiquidacion(
  id: string
): Promise<LiquidacionConPropietario | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("liquidaciones")
    .select("*, propietarios(nombre, apellido, razon_social, tipo_persona, rut)")
    .eq("id", id)
    .single();
  if (!data) return null;

  type Row = Liquidacion & {
    propietarios: {
      nombre: string | null;
      apellido: string | null;
      razon_social: string | null;
      tipo_persona: string;
      rut: string;
    } | null;
  };
  const l = data as unknown as Row;
  return { ...l, propietario_nombre: nombrePropietario(l.propietarios) };
}

export async function getDetalles(
  liquidacionId: string
): Promise<LiquidacionDetalle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liquidacion_detalles")
    .select("*")
    .eq("liquidacion_id", liquidacionId)
    .order("tipo", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
