import { createClient } from "@/lib/supabase/server";
import { etiquetaPropiedad } from "@/lib/propiedad";
import type { Cargo, CargoConContexto, Pago } from "@/features/cobros/types";
import type { Contrato, ContratoConPropiedad } from "@/features/contratos/types";
import type { Propiedad } from "@/features/propiedades/types";
import type { Liquidacion, LiquidacionDetalle } from "@/features/liquidaciones/types";
import type { DocumentoListado } from "@/features/documentos/types";

type PropiedadResumen = {
  codigo_interno: string | null;
  direccion: string | null;
  numero: string | null;
  departamento: string | null;
} | null;

/**
 * Todas las funciones de este archivo NO filtran por usuario: dependen
 * enteramente de las políticas RLS `*_select_propietario`/`*_select_arrendatario`
 * (migración 0024) para devolver solo lo que le pertenece al profile logueado.
 */

export async function misPropiedades(): Promise<Propiedad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select("*")
    .order("codigo_interno");
  if (error) throw new Error(error.message);
  return data ?? [];
}

type ArrendatarioResumen = {
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
  tipo_persona: string;
};

function nombreArrendatario(a: ArrendatarioResumen | null): string {
  if (!a) return "—";
  return a.tipo_persona === "persona_juridica"
    ? a.razon_social ?? "—"
    : [a.nombre, a.apellido].filter(Boolean).join(" ") || "—";
}

export async function misContratos(): Promise<ContratoConPropiedad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos")
    .select(
      "*, propiedades(codigo_interno, direccion, numero, departamento), contratos_arrendatarios(arrendatarios(nombre, apellido, razon_social, tipo_persona))"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = Contrato & {
    propiedades: PropiedadResumen;
    contratos_arrendatarios: { arrendatarios: ArrendatarioResumen | null }[];
  };
  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    propiedad_direccion: c.propiedades?.direccion ?? "—",
    propiedad_label: etiquetaPropiedad(c.propiedades),
    arrendatarios_nombres: c.contratos_arrendatarios.map((v) => nombreArrendatario(v.arrendatarios)),
  }));
}

export async function miContrato(id: string): Promise<ContratoConPropiedad | null> {
  const contratos = await misContratos();
  return contratos.find((c) => c.id === id) ?? null;
}

export async function misCargos(): Promise<CargoConContexto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cargos")
    .select("*, contratos(numero_contrato, propiedades(direccion))")
    .order("periodo", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = Cargo & {
    contratos: { numero_contrato: string | null; propiedades: { direccion: string | null } | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((c) => ({
    ...c,
    numero_contrato: c.contratos?.numero_contrato ?? null,
    propiedad_direccion: c.contratos?.propiedades?.direccion ?? "—",
  }));
}

export async function miCargo(id: string): Promise<CargoConContexto | null> {
  const cargos = await misCargos();
  return cargos.find((c) => c.id === id) ?? null;
}

export async function misPagosDeCargo(cargoId: string): Promise<Pago[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("cargo_id", cargoId)
    .order("fecha_pago", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function misLiquidaciones(): Promise<Liquidacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("liquidaciones")
    .select("*")
    .order("periodo", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function miLiquidacion(
  id: string
): Promise<{ liquidacion: Liquidacion; detalles: LiquidacionDetalle[] } | null> {
  const supabase = await createClient();
  const { data: liquidacion } = await supabase
    .from("liquidaciones")
    .select("*")
    .eq("id", id)
    .single();
  if (!liquidacion) return null;

  const { data: detalles } = await supabase
    .from("liquidacion_detalles")
    .select("*")
    .eq("liquidacion_id", id)
    .order("created_at");

  return { liquidacion, detalles: detalles ?? [] };
}

export async function misDocumentos(): Promise<DocumentoListado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .select(
      `*,
       propiedades(codigo_interno, direccion, numero, departamento),
       contratos(numero_contrato),
       documento_versiones(id, version, nombre_archivo, tamano_bytes, mime_type)`
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = DocumentoListado & {
    propiedades: PropiedadResumen;
    contratos: { numero_contrato: string | null } | null;
    documento_versiones: {
      id: string;
      version: number;
      nombre_archivo: string;
      tamano_bytes: number;
      mime_type: string | null;
    }[];
  };

  return ((data ?? []) as unknown as Row[]).map((d) => {
    const actual = d.documento_versiones?.find((v) => v.version === d.version_actual) ?? null;
    return {
      ...d,
      propietario_nombre: null,
      arrendatario_nombre: null,
      propiedad_label: d.propiedades ? etiquetaPropiedad(d.propiedades) : null,
      contrato_numero: d.contratos?.numero_contrato ?? null,
      version_actual_id: actual?.id ?? null,
      version_nombre_archivo: actual?.nombre_archivo ?? null,
      version_tamano_bytes: actual?.tamano_bytes ?? null,
      version_mime: actual?.mime_type ?? null,
    };
  });
}

