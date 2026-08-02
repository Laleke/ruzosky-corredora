import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Cargo, CargoConContexto, FiltrosCargos, Pago } from "./types";
import { TIPOS_DESFAZADOS } from "./constants";

type DB = SupabaseClient<Database>;

/**
 * El arriendo se paga por adelantado: el período que corresponde tener
 * generado (y por el que se avisa si falta) es siempre el mes SIGUIENTE
 * al actual, no el mes calendario en curso — ese ya debió cobrarse antes
 * de que empezara. No aplica a Liquidaciones (que revisan lo ya cobrado).
 */
/**
 * El aviso de "arriendo sin generar" (y la Generación asistida) solo tiene
 * sentido a partir del día 21 de cada mes — antes de eso todavía hay tiempo
 * de sobra para generar el arriendo del mes siguiente y el aviso solo
 * generaría ruido. Regla explícita de Eduardo (2026-07-31).
 */
export function debeAvisarGeneracionAsistida(hoy: Date = new Date()): boolean {
  return hoy.getDate() >= 21;
}

export function periodoArriendoVigente(hoy: Date = new Date()): string {
  // Aritmética de meses pura (sin pasar por toISOString/UTC): construir la
  // fecha del 1° del mes siguiente y convertirla a ISO puede retroceder un
  // día (y por lo tanto un mes) si el proceso corre en una zona horaria con
  // offset negativo respecto a UTC — justo lo que pasó acá.
  const totalMeses = hoy.getFullYear() * 12 + hoy.getMonth() + 1;
  const anio = Math.floor(totalMeses / 12);
  const mes = (totalMeses % 12) + 1;
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

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

/** true si el llamador no fijó ningún filtro — activa el acotado por defecto. */
function sinFiltros(filtros: FiltrosCargos): boolean {
  return !(
    filtros.propiedadId ||
    filtros.arrendatarioId ||
    filtros.estado ||
    filtros.periodo ||
    filtros.venceDesde ||
    filtros.venceHasta
  );
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
  // Sin filtros del usuario: acotar a deuda viva + período actual, en vez de
  // traer el historial completo de cargos (incluidos los ya pagados hace
  // años) en cada carga de la página. Con filtros explícitos (estado, período,
  // etc.) se respeta lo que el usuario pidió, sin este acotado.
  if (sinFiltros(filtros)) {
    const periodoActualISO = `${new Date().toISOString().slice(0, 7)}-01`;
    q = q.or(`saldo_pendiente.gt.0,periodo.eq.${periodoActualISO}`);
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

export type ContratoSinArriendo = { contratoId: string; label: string; monto: number };

/**
 * Contratos vigentes/renovados que aún no tienen un cargo de arriendo
 * generado para el período dado. Base del indicador "cobros pendientes".
 * `monto` es el canon vigente (canon_actual, o el original si no hay
 * reajuste) — la deuda que se generará cuando se cree el cargo, todavía no
 * existe como cargo real.
 */
export async function listContratosSinArriendo(
  periodo: string
): Promise<ContratoSinArriendo[]> {
  const supabase = await createClient();
  const { data: contratos } = await supabase
    .from("contratos")
    .select(
      "id, numero_contrato, canon_monto, canon_actual, propiedades(codigo_interno, direccion, numero, departamento)"
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
    canon_monto: number;
    canon_actual: number | null;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  };

  return (contratos as unknown as Row[])
    .filter((c) => !conArriendo.has(c.id))
    .map((c) => {
      const p = c.propiedades;
      const calle = p ? [p.direccion, p.numero].filter(Boolean).join(" ") : null;
      const unidad = p?.departamento ? `Depto/Unidad ${p.departamento}` : null;
      return {
        contratoId: c.id,
        label: [calle, unidad].filter(Boolean).join(" · ") || "—",
        monto: Number(c.canon_actual ?? c.canon_monto),
      };
    });
}

export type ContratoConDesfazadoPendiente = {
  id: string;
  propiedad_direccion: string;
  fecha_termino: string;
};

/**
 * Contratos ya `terminado` que tuvieron alguna vez un cargo "desfazado"
 * (gasto_comun/luz/agua/internet — ver `constants.ts`) pero no tienen
 * ninguno generado para el mes de término en adelante. El consumo real de
 * esos servicios sigue corriendo hasta que el arrendatario se va, así que
 * casi siempre falta un último cargo por facturar — que hay que cobrar (o
 * descontar de la garantía) antes de devolverla. Se deja de avisar en
 * cuanto se genera ese último cargo (no hay botón de "marcar resuelto":
 * decisión explícita de Eduardo, 2026-07-31).
 */
export async function listContratosConDesfazadoPendiente(): Promise<
  ContratoConDesfazadoPendiente[]
> {
  const supabase = await createClient();
  const { data: terminados } = await supabase
    .from("contratos")
    .select("id, fecha_termino, propiedades(direccion)")
    .eq("estado", "terminado")
    .not("fecha_termino", "is", null);
  if (!terminados || terminados.length === 0) return [];

  const ids = terminados.map((c) => c.id);
  const { data: cargosDesfazados } = await supabase
    .from("cargos")
    .select("contrato_id, periodo")
    .in("contrato_id", ids)
    .in("tipo_cargo", TIPOS_DESFAZADOS);

  const periodosPorContrato = new Map<string, string[]>();
  for (const c of cargosDesfazados ?? []) {
    const arr = periodosPorContrato.get(c.contrato_id) ?? [];
    arr.push(c.periodo);
    periodosPorContrato.set(c.contrato_id, arr);
  }

  type Row = { id: string; fecha_termino: string; propiedades: { direccion: string | null } | null };

  return (terminados as unknown as Row[])
    .filter((c) => {
      const periodos = periodosPorContrato.get(c.id);
      if (!periodos || periodos.length === 0) return false; // nunca tuvo cargos desfazados: no aplica
      const mesTermino = c.fecha_termino.slice(0, 7);
      const yaTieneUltimo = periodos.some((p) => p.slice(0, 7) >= mesTermino);
      return !yaTieneUltimo;
    })
    .map((c) => ({
      id: c.id,
      propiedad_direccion: c.propiedades?.direccion ?? "—",
      fecha_termino: c.fecha_termino,
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
