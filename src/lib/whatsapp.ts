/** Link `wa.me` con mensaje precargado — wa.me acepta el número con o sin "+". */
export function linkWhatsApp(telefono: string, mensaje: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeInvitacionPortal(link: string): string {
  return `Hola! Te invito a usar el portal de RZK Prop para ver tu información. Instala la app desde este link y sigue los pasos para crear tu cuenta:\n${link}`;
}

/**
 * Mensaje de cobranza con el resumen de la deuda. `link` es opcional: si no se
 * generó un link público (o se prefiere adjuntar el PDF a mano), el mensaje
 * igual queda completo con el monto y la pregunta por la fecha de pago — que
 * es el objetivo real del envío.
 */
export function mensajeEstadoCuenta(opciones: {
  nombre: string;
  total: number;
  cantidadCargos: number;
  diasMora: number;
  propiedad: string | null;
  link?: string | null;
}): string {
  const { nombre, total, cantidadCargos, diasMora, propiedad, link } = opciones;
  const monto = `$${Math.round(total).toLocaleString("es-CL")}`;
  const primerNombre = nombre.split(" ")[0] || nombre;

  const lineas = [
    `Hola ${primerNombre}, te comparto el estado de cuenta${propiedad ? ` de ${propiedad}` : ""}.`,
    "",
    `Total pendiente: ${monto}`,
    `${cantidadCargos} ${cantidadCargos === 1 ? "cargo" : "cargos"}${
      diasMora > 0 ? ` · ${diasMora} ${diasMora === 1 ? "día" : "días"} de atraso` : ""
    }`,
  ];

  if (link) lineas.push("", `Detalle: ${link}`);

  lineas.push("", "¿Me confirmas cuándo podrías regularizarlo?");
  return lineas.join("\n");
}
