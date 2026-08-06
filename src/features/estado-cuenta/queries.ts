import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import type { Database } from "@/types/database.types";
import type { Cargo } from "@/features/cobros/types";
import { diasMora } from "./mora";
import type { ArrendatarioConDeuda, CargoDeuda, EstadoCuenta } from "./types";

type DB = SupabaseClient<Database>;

type PersonaRow = {
  id: string;
  rut: string;
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
};

function nombrePersona(p: PersonaRow): string {
  return p.tipo_persona === "persona_juridica"
    ? p.razon_social ?? "—"
    : [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type CargoRow = Cargo & {
  contratos: {
    numero_contrato: string | null;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  } | null;
};

const SELECT_CARGO_DEUDA =
  "*, contratos(numero_contrato, propiedades(codigo_interno, direccion, numero, departamento))";

function mapCargo(c: CargoRow, hoy: string): CargoDeuda {
  return {
    ...c,
    propiedad_label: etiquetaPropiedad(c.contratos?.propiedades),
    numero_contrato: c.contratos?.numero_contrato ?? null,
    saldo: Number(c.saldo_pendiente),
    dias_mora: diasMora(c.fecha_vencimiento, hoy),
  };
}

/** Contratos en los que participa un arrendatario. */
async function contratosDeArrendatario(db: DB, arrendatarioId: string): Promise<string[]> {
  const { data } = await db
    .from("contratos_arrendatarios")
    .select("contrato_id")
    .eq("arrendatario_id", arrendatarioId);
  return (data ?? []).map((r) => r.contrato_id);
}

/**
 * Estado de cuenta completo de un arrendatario: TODOS sus cargos con saldo
 * pendiente (no solo los vencidos — los por vencer también se informan, pero
 * quedan marcados aparte), más los datos de la corredora para la sección de
 * pago.
 *
 * `db` se recibe por parámetro para poder reutilizar esta misma función desde
 * la página pública `/e/[token]`, que corre con el cliente service_role (no
 * hay sesión que RLS pueda evaluar) — ver `estadoCuentaPorToken`.
 */
export async function estadoCuentaDeArrendatario(
  arrendatarioId: string,
  db?: DB
): Promise<EstadoCuenta | null> {
  const supabase = db ?? ((await createClient()) as DB);
  const hoy = hoyISO();

  const { data: arrendatario } = await supabase
    .from("arrendatarios")
    .select("id, rut, tipo_persona, nombre, apellido, razon_social, email, telefono, empresa_id")
    .eq("id", arrendatarioId)
    .single();
  if (!arrendatario) return null;

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", arrendatario.empresa_id)
    .single();
  if (!empresa) return null;

  const contratoIds = await contratosDeArrendatario(supabase, arrendatarioId);

  let cargos: CargoDeuda[] = [];
  if (contratoIds.length > 0) {
    const { data } = await supabase
      .from("cargos")
      .select(SELECT_CARGO_DEUDA)
      .in("contrato_id", contratoIds)
      .gt("saldo_pendiente", 0)
      .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
    cargos = ((data ?? []) as unknown as CargoRow[]).map((c) => mapCargo(c, hoy));
  }

  const total = cargos.reduce((acc, c) => acc + c.saldo, 0);
  const total_vencido = cargos
    .filter((c) => c.dias_mora > 0)
    .reduce((acc, c) => acc + c.saldo, 0);

  return {
    arrendatario: {
      id: arrendatario.id,
      nombre: nombrePersona(arrendatario as PersonaRow),
      rut: arrendatario.rut,
      email: arrendatario.email,
      telefono: arrendatario.telefono,
    },
    empresa,
    cargos,
    total,
    total_vencido,
    dias_mora_maxima: cargos.reduce((max, c) => Math.max(max, c.dias_mora), 0),
    emitido: hoy,
  };
}

/**
 * Arrendatarios con al menos un cargo pendiente — punto de entrada del módulo.
 * Una sola pasada sobre los cargos con saldo (RLS de admin ya acota a la
 * empresa), en vez de N+1 consultas por arrendatario.
 */
export async function arrendatariosConDeuda(): Promise<ArrendatarioConDeuda[]> {
  const supabase = await createClient();
  const hoy = hoyISO();

  const { data: cargosData, error } = await supabase
    .from("cargos")
    .select(SELECT_CARGO_DEUDA)
    .gt("saldo_pendiente", 0);
  if (error) throw new Error(error.message);

  const cargos = ((cargosData ?? []) as unknown as CargoRow[]).map((c) => mapCargo(c, hoy));
  if (cargos.length === 0) return [];

  // contrato -> arrendatarios (un contrato puede tener más de uno).
  const { data: vinculos } = await supabase
    .from("contratos_arrendatarios")
    .select("contrato_id, arrendatario_id")
    .in("contrato_id", [...new Set(cargos.map((c) => c.contrato_id))]);

  const arrendatariosPorContrato = new Map<string, string[]>();
  for (const v of vinculos ?? []) {
    const arr = arrendatariosPorContrato.get(v.contrato_id) ?? [];
    arr.push(v.arrendatario_id);
    arrendatariosPorContrato.set(v.contrato_id, arr);
  }

  const ids = [...new Set((vinculos ?? []).map((v) => v.arrendatario_id))];
  if (ids.length === 0) return [];

  const { data: personas } = await supabase
    .from("arrendatarios")
    .select("id, rut, tipo_persona, nombre, apellido, razon_social, email, telefono")
    .in("id", ids);

  const acumulado = new Map<string, ArrendatarioConDeuda>();
  for (const p of (personas ?? []) as PersonaRow[]) {
    acumulado.set(p.id, {
      id: p.id,
      nombre: nombrePersona(p),
      rut: p.rut,
      telefono: p.telefono,
      propiedades: [],
      total: 0,
      total_vencido: 0,
      cargos_pendientes: 0,
      dias_mora_maxima: 0,
    });
  }

  for (const c of cargos) {
    for (const arrendatarioId of arrendatariosPorContrato.get(c.contrato_id) ?? []) {
      const fila = acumulado.get(arrendatarioId);
      if (!fila) continue;
      fila.total += c.saldo;
      if (c.dias_mora > 0) fila.total_vencido += c.saldo;
      fila.cargos_pendientes += 1;
      fila.dias_mora_maxima = Math.max(fila.dias_mora_maxima, c.dias_mora);
      if (!fila.propiedades.includes(c.propiedad_label)) fila.propiedades.push(c.propiedad_label);
    }
  }

  return [...acumulado.values()]
    .filter((f) => f.cargos_pendientes > 0)
    .sort((a, b) => b.total_vencido - a.total_vencido || b.total - a.total);
}

/** Link vigente (no revocado ni expirado) de un arrendatario, si tiene uno. */
export async function linkVigenteDeArrendatario(arrendatarioId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("estado_cuenta_links")
    .select("token, expira_en")
    .eq("arrendatario_id", arrendatarioId)
    .eq("revocado", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  if (data.expira_en && Date.parse(data.expira_en) < Date.now()) return null;
  return data.token;
}
