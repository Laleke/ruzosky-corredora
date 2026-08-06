import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import type { Database } from "@/types/database.types";
import type { Cargo } from "@/features/cobros/types";
import { diasMora } from "./mora";
import type {
  ArrendatarioConDeuda,
  CargoDeuda,
  CuentaBancaria,
  DestinoPago,
  Empresa,
  EstadoCuenta,
} from "./types";

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

/** Solo lo necesario para armar el nombre: sirve para arrendatarios y propietarios. */
type PersonaNombrable = {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
};

function nombrePersona(p: PersonaNombrable): string {
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
    pago_directo_propietario: boolean;
    propiedad_id: string;
    propiedades: {
      codigo_interno: string | null;
      direccion: string | null;
      numero: string | null;
      departamento: string | null;
    } | null;
  } | null;
};

const SELECT_CARGO_DEUDA =
  "*, contratos(numero_contrato, pago_directo_propietario, propiedad_id, propiedades(codigo_interno, direccion, numero, departamento))";

/** Clave del destino: la corredora, o el propietario de esa propiedad. */
function claveDestino(c: CargoRow): string {
  return c.contratos?.pago_directo_propietario && c.contratos.propiedad_id
    ? `propiedad:${c.contratos.propiedad_id}`
    : DESTINO_CORREDORA;
}

const DESTINO_CORREDORA = "corredora";

function mapCargo(c: CargoRow, hoy: string): CargoDeuda {
  return {
    ...c,
    propiedad_label: etiquetaPropiedad(c.contratos?.propiedades),
    numero_contrato: c.contratos?.numero_contrato ?? null,
    saldo: Number(c.saldo_pendiente),
    dias_mora: diasMora(c.fecha_vencimiento, hoy),
    destino_clave: claveDestino(c),
  };
}

function cuentaCompleta(c: CuentaBancaria): boolean {
  return Boolean(c.banco && c.numero_cuenta);
}

/**
 * Agrupa los cargos por la cuenta donde hay que transferir. Para los contratos
 * marcados `pago_directo_propietario` busca los datos bancarios del propietario
 * de esa propiedad; en copropiedad toma al de mayor participación, que es el
 * criterio determinista más razonable sin pedirle al usuario que elija una
 * cuenta de cobro por propiedad.
 */
async function resolverDestinos(
  db: DB,
  cargos: CargoDeuda[],
  empresa: Empresa
): Promise<DestinoPago[]> {
  const propiedadPorClave = new Map<string, string>();
  for (const c of cargos) {
    if (c.destino_clave !== DESTINO_CORREDORA) {
      propiedadPorClave.set(c.destino_clave, c.destino_clave.replace("propiedad:", ""));
    }
  }

  // Propietario (mayor participación) de cada propiedad que cobra directo.
  const cuentaPorClave = new Map<string, { titulo: string; cuenta: CuentaBancaria }>();
  if (propiedadPorClave.size > 0) {
    const { data } = await db
      .from("propietarios_propiedades")
      .select(
        "propiedad_id, porcentaje_participacion, propietarios(tipo_persona, nombre, apellido, razon_social, banco, tipo_cuenta, numero_cuenta, rut_titular, email)"
      )
      .in("propiedad_id", [...propiedadPorClave.values()]);

    type Fila = {
      propiedad_id: string;
      porcentaje_participacion: number;
      propietarios: {
        tipo_persona: string;
        nombre: string | null;
        apellido: string | null;
        razon_social: string | null;
        banco: string | null;
        tipo_cuenta: string | null;
        numero_cuenta: string | null;
        rut_titular: string | null;
        email: string | null;
      } | null;
    };

    const mejorPorPropiedad = new Map<string, Fila>();
    for (const fila of (data ?? []) as unknown as Fila[]) {
      if (!fila.propietarios) continue;
      const actual = mejorPorPropiedad.get(fila.propiedad_id);
      if (!actual || Number(fila.porcentaje_participacion) > Number(actual.porcentaje_participacion)) {
        mejorPorPropiedad.set(fila.propiedad_id, fila);
      }
    }

    for (const [clave, propiedadId] of propiedadPorClave) {
      const fila = mejorPorPropiedad.get(propiedadId);
      const p = fila?.propietarios;
      cuentaPorClave.set(clave, {
        titulo: p ? nombrePersona(p) : "Propietario",
        cuenta: {
          banco: p?.banco ?? null,
          tipo_cuenta: p?.tipo_cuenta ?? null,
          numero_cuenta: p?.numero_cuenta ?? null,
          titular_nombre: p ? nombrePersona(p) : null,
          rut_titular: p?.rut_titular ?? null,
          email_pagos: p?.email ?? null,
        },
      });
    }
  }

  const destinos = new Map<string, DestinoPago>();
  for (const c of cargos) {
    let destino = destinos.get(c.destino_clave);
    if (!destino) {
      const resuelto = cuentaPorClave.get(c.destino_clave);
      const cuenta: CuentaBancaria = resuelto?.cuenta ?? {
        banco: empresa.banco,
        tipo_cuenta: empresa.tipo_cuenta,
        numero_cuenta: empresa.numero_cuenta,
        titular_nombre: empresa.titular_nombre,
        rut_titular: empresa.rut_titular,
        email_pagos: empresa.email_pagos,
      };
      destino = {
        clave: c.destino_clave,
        titulo: resuelto?.titulo ?? empresa.nombre,
        cuenta,
        propiedades: [],
        subtotal: 0,
        completa: cuentaCompleta(cuenta),
      };
      destinos.set(c.destino_clave, destino);
    }
    destino.subtotal += c.saldo;
    if (!destino.propiedades.includes(c.propiedad_label)) {
      destino.propiedades.push(c.propiedad_label);
    }
  }

  return [...destinos.values()].sort((a, b) => b.subtotal - a.subtotal);
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
 * Estado de cuenta de cobranza: SOLO los cargos vencidos con saldo pendiente,
 * más la cuenta donde transferir. Decisión de negocio (Eduardo, 2026-08-06):
 * el informe es un documento de cobranza, no un resumen de cuenta — un cargo
 * que todavía no vence no se reclama, y uno ya pagado no aparece nunca
 * (`saldo_pendiente > 0` lo excluye; con abono parcial se informa el resto).
 *
 * El filtro por vencimiento va en la consulta (`fecha_vencimiento < hoy`), que
 * además descarta los cargos sin fecha de vencimiento — sin fecha no hay mora
 * posible, mismo criterio que `diasMora`.
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
      .lt("fecha_vencimiento", hoy)
      .order("fecha_vencimiento", { ascending: true });
    cargos = ((data ?? []) as unknown as CargoRow[]).map((c) => mapCargo(c, hoy));
  }

  const total = cargos.reduce((acc, c) => acc + c.saldo, 0);
  const destinos = cargos.length > 0 ? await resolverDestinos(supabase, cargos, empresa) : [];

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
    destinos,
    total,
    dias_mora_maxima: cargos.reduce((max, c) => Math.max(max, c.dias_mora), 0),
    emitido: hoy,
  };
}

/**
 * Arrendatarios en mora — punto de entrada del módulo. Solo aparecen los que
 * tienen algún cargo vencido, porque son los únicos con un informe que enviar;
 * el saldo por vencer se acumula aparte como contexto para el admin.
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
      total_vencido: 0,
      total_por_vencer: 0,
      cargos_morosos: 0,
      dias_mora_maxima: 0,
    });
  }

  for (const c of cargos) {
    for (const arrendatarioId of arrendatariosPorContrato.get(c.contrato_id) ?? []) {
      const fila = acumulado.get(arrendatarioId);
      if (!fila) continue;
      // Los cargos por vencer se cuentan aparte: no van al informe, pero le
      // sirven al admin para saber qué se viene antes de llamar a cobrar.
      if (c.dias_mora > 0) {
        fila.total_vencido += c.saldo;
        fila.cargos_morosos += 1;
        fila.dias_mora_maxima = Math.max(fila.dias_mora_maxima, c.dias_mora);
        if (!fila.propiedades.includes(c.propiedad_label)) fila.propiedades.push(c.propiedad_label);
      } else {
        fila.total_por_vencer += c.saldo;
      }
    }
  }

  // Solo quien tiene mora: para el resto el informe saldría vacío.
  return [...acumulado.values()]
    .filter((f) => f.cargos_morosos > 0)
    .sort((a, b) => b.total_vencido - a.total_vencido);
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
