import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type {
  Liquidacion,
  LiquidacionDetalle,
  LiquidacionConPropietario,
  PreviewLiquidacion,
  LineaLiquidacion,
  LineaGasto,
} from "./types";

/** Primer día del mes siguiente al período (para acotar gastos por fecha). */
function inicioMesSiguiente(periodo: string): string {
  const y = parseInt(periodo.slice(0, 4), 10);
  const m = parseInt(periodo.slice(5, 7), 10); // 1-12
  return m >= 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

/**
 * Cuotas descontables del propietario, pendientes de asociar a una
 * liquidación del período. Se parte desde `gasto_obligaciones` (usa el
 * índice `idx_gasto_obligaciones_por_descontar`: propiedad + responsable)
 * en vez de `gasto_obligaciones_cuotas`, para filtrar por propiedad/fecha a
 * nivel de BD; el filtro de estado/liquidación de cada cuota se hace en JS
 * (arreglo chico por obligación, igual que el resto de reportes/queries.ts).
 * Condiciones: obligación con responsable='propietario' de una propiedad del
 * propietario, gasto anterior al mes del período, y cuota 'pendiente' sin
 * liquidacion_id. El propietario_id de la obligación (foto al crearla) puede
 * ser null (propiedad sin dueño explícito en ese momento) — se incluye igual.
 */
async function gastosDescontables(
  supabase: DB,
  propietarioId: string,
  propiedadIds: string[],
  periodo: string
): Promise<LineaGasto[]> {
  if (propiedadIds.length === 0) return [];
  const { data } = await supabase
    .from("gasto_obligaciones")
    .select(
      "gasto_id, propietario_id, fecha_gasto, gastos(categoria, descripcion), gasto_obligaciones_cuotas(id, monto, estado, liquidacion_id)"
    )
    .eq("responsable", "propietario")
    .in("propiedad_id", propiedadIds)
    .lt("fecha_gasto", inicioMesSiguiente(periodo));

  type ObligacionRow = {
    gasto_id: string;
    propietario_id: string | null;
    fecha_gasto: string;
    gastos: { categoria: string; descripcion: string } | null;
    gasto_obligaciones_cuotas: {
      id: string;
      monto: number;
      estado: string;
      liquidacion_id: string | null;
    }[];
  };

  const lineas: LineaGasto[] = [];
  for (const o of (data ?? []) as unknown as ObligacionRow[]) {
    if (o.propietario_id != null && o.propietario_id !== propietarioId) continue;
    for (const c of o.gasto_obligaciones_cuotas ?? []) {
      if (c.estado !== "pendiente" || c.liquidacion_id != null) continue;
      lineas.push({
        cuota_id: c.id,
        gasto_id: o.gasto_id,
        categoria: o.gastos?.categoria ?? "otro",
        descripcion: o.gastos?.descripcion ?? "",
        fecha: o.fecha_gasto,
        monto: Number(c.monto),
      });
    }
  }
  return lineas.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

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
    gastos: [],
    subtotal_ingresos: 0,
    subtotal_descuentos: 0,
    subtotal_gastos: 0,
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

  // Gastos descontables del propietario (independientes de que haya contratos).
  const gastos = await gastosDescontables(
    supabase,
    propietarioId,
    propiedadIds,
    periodo
  );
  const subtotal_gastos = r2(gastos.reduce((a, g) => a + g.monto, 0));

  const { data: contratos } = await supabase
    .from("contratos")
    .select(
      "id, propiedad_id, canon_monto, cobra_administracion, administracion_monto, administracion_porcentaje, tipo_comision, comision_monto, corretaje_liquidado"
    )
    .in("propiedad_id", propiedadIds)
    .eq("activo", true);
  if (!contratos || contratos.length === 0) {
    // Sin contratos no hay ingresos ni comisiones, pero pueden existir gastos.
    return {
      ...vacio,
      gastos,
      subtotal_gastos,
      total_liquidacion: r2(-subtotal_gastos),
    };
  }

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

    // Corretaje: se cobra una sola vez por contrato (mientras no esté liquidado).
    if (c.tipo_comision && !c.corretaje_liquidado) {
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
    gastos,
    subtotal_ingresos,
    subtotal_descuentos,
    subtotal_gastos,
    total_liquidacion: r2(subtotal_ingresos - subtotal_descuentos - subtotal_gastos),
  };
}

/** Cuotas efectivamente descontadas en una liquidación (para el detalle). */
export async function getGastosDeLiquidacion(
  liquidacionId: string
): Promise<LineaGasto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gasto_obligaciones_cuotas")
    .select(
      "id, monto, gasto_obligaciones(gasto_id, fecha_gasto, gastos(categoria, descripcion))"
    )
    .eq("liquidacion_id", liquidacionId);

  type Row = {
    id: string;
    monto: number;
    gasto_obligaciones: {
      gasto_id: string;
      fecha_gasto: string;
      gastos: { categoria: string; descripcion: string } | null;
    } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((c) => c.gasto_obligaciones)
    .map((c) => ({
      cuota_id: c.id,
      gasto_id: c.gasto_obligaciones!.gasto_id,
      categoria: c.gasto_obligaciones!.gastos?.categoria ?? "otro",
      descripcion: c.gasto_obligaciones!.gastos?.descripcion ?? "",
      fecha: c.gasto_obligaciones!.fecha_gasto,
      monto: Number(c.monto),
    }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

export type PendienteLiquidar = {
  propietarioId: string;
  propietarioNombre: string;
  totalEstimado: number;
};

/**
 * Propietarios con movimientos en el período (ingresos, comisiones o gastos
 * descontables) que aún no tienen una liquidación generada para ese período.
 * Evalúa a todos los propietarios activos en paralelo (ver comentario dentro).
 */
export async function listPendientesLiquidar(
  periodo: string
): Promise<PendienteLiquidar[]> {
  const supabase = await createClient();
  const { data: propietarios } = await supabase
    .from("propietarios")
    .select("id, tipo_persona, nombre, apellido, razon_social")
    .eq("activo", true);
  if (!propietarios || propietarios.length === 0) return [];

  // Antes se recorría un propietario a la vez (await secuencial) — con ~6
  // consultas por propietario dentro de calcularLiquidacion, ya no es
  // aceptable ni con una cantidad moderada de propietarios (el dashboard
  // quedaba visiblemente colgado). En paralelo, el costo real es el del
  // propietario más lento, no la suma de todos.
  const resultados = await Promise.all(
    propietarios.map(async (p) => {
      const existe = await existeLiquidacion(p.id, periodo);
      if (existe) return null;
      const preview = await calcularLiquidacion(supabase, p.id, periodo);
      const hayMovimientos =
        preview.ingresos.length > 0 ||
        preview.descuentos.length > 0 ||
        preview.gastos.length > 0;
      if (!hayMovimientos) return null;
      return {
        propietarioId: p.id,
        propietarioNombre: nombrePropietario(p),
        totalEstimado: preview.total_liquidacion,
      };
    })
  );
  return resultados.filter((r): r is PendienteLiquidar => r !== null);
}

/** true si ya existe una liquidación (no anulada) para ese propietario y período. */
export async function existeLiquidacion(
  propietarioId: string,
  periodo: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("liquidaciones")
    .select("id")
    .eq("propietario_id", propietarioId)
    .eq("periodo", periodo)
    .neq("estado", "anulada")
    .limit(1);
  return !!data && data.length > 0;
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
