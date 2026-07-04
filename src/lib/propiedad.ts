/**
 * Etiqueta descriptiva única de una propiedad, usada en TODOS los selectores y
 * tablas del sistema (gastos, documentos, contratos, cobros, reportes).
 * Formato: Código · Calle Número · Depto/Unidad.
 * Motivo: un propietario puede tener varias propiedades en la misma dirección;
 * el código + número + unidad permiten distinguirlas rápidamente.
 */
export type PropiedadEtiquetable = {
  codigo_interno?: string | null;
  direccion?: string | null;
  numero?: string | null;
  departamento?: string | null;
};

export function etiquetaPropiedad(p: PropiedadEtiquetable | null | undefined): string {
  if (!p) return "—";
  const calle = [p.direccion, p.numero].filter(Boolean).join(" ");
  const unidad = p.departamento ? `Depto/Unidad ${p.departamento}` : null;
  return [p.codigo_interno, calle || null, unidad].filter(Boolean).join(" · ") || "—";
}

/** Etiqueta de contrato: N° · <etiqueta de su propiedad>. */
export function etiquetaContrato(
  numeroContrato: string | null | undefined,
  propiedad: PropiedadEtiquetable | null | undefined
): string {
  const numero = numeroContrato ?? "Contrato";
  const prop = etiquetaPropiedad(propiedad);
  return prop && prop !== "—" ? `${numero} · ${prop}` : numero;
}
