/**
 * Etiqueta descriptiva única de una propiedad, usada en TODOS los selectores y
 * tablas del sistema (gastos, documentos, contratos, cobros, reportes).
 * Formato: Calle Número · Depto/Unidad. El código interno (`codigo_interno`)
 * NO se muestra — es un identificador técnico, no un dato para el usuario final;
 * solo se usa como respaldo si la propiedad no tiene dirección cargada.
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
  const partes = [calle || null, unidad].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : p.codigo_interno ?? "—";
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
