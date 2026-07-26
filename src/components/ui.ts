/**
 * Clases de UI centralizadas (sistema de diseño RZK Prop: grafito + burdeo).
 * Strings de Tailwind reutilizables, compatibles con server y client components.
 */

export const ui = {
  input:
    "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-burgundy focus:ring-2 focus:ring-burgundy/15",
  label: "text-sm font-medium text-ink",

  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-burgundy-strong disabled:pointer-events-none disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-50",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-stone-100 hover:text-ink",

  card: "rounded-xl border border-line bg-white shadow-sm",

  // Grid de tarjetas para listados (Propiedades, Propietarios, Arrendatarios, Contratos)
  cardGrid: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
  listCard:
    "flex flex-col gap-3 rounded-xl bg-burgundy p-5 shadow-sm transition hover:bg-burgundy-strong",
  // Icono de acción sobre listCard (editar, activar/desactivar)
  listCardIconBtn:
    "flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white",
  // Disclosure (<summary>) para info secundaria oculta tras un ícono
  listCardDisclosure:
    "flex cursor-pointer list-none items-center gap-1.5 text-xs text-white/70 [&::-webkit-details-marker]:hidden hover:text-white",

  // Encabezado de tabla y celdas
  th: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted",
  td: "px-4 py-3 text-sm text-ink",

  linkAction: "font-medium text-burgundy transition-colors hover:text-burgundy-strong",
} as const;

/** Badge de estado con tono semántico. */
export function badge(
  tone: "neutral" | "success" | "warning" | "danger" | "info" = "neutral"
): string {
  // Fondo sólido del color que antes era solo el texto; letra blanca.
  const tones: Record<string, string> = {
    neutral: "bg-stone-500 text-white",
    success: "bg-emerald-800 text-white",
    warning: "bg-amber-600 text-white",
    danger: "bg-red-600 text-white",
    info: "bg-sky-600 text-white",
  };
  return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`;
}
