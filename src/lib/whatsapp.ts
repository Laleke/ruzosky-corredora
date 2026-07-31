/** Link `wa.me` con mensaje precargado — wa.me acepta el número con o sin "+". */
export function linkWhatsApp(telefono: string, mensaje: string): string {
  const digitos = telefono.replace(/\D/g, "");
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeInvitacionPortal(link: string): string {
  return `Hola! Te invito a usar el portal de RZK Prop para ver tu información. Instala la app desde este link y sigue los pasos para crear tu cuenta:\n${link}`;
}
