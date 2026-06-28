/**
 * Clases de UI centralizadas (sistema de diseño Ruzosky: grafito + burdeo).
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

  // Encabezado de tabla y celdas
  th: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted",
  td: "px-4 py-3 text-sm text-ink",

  linkAction: "font-medium text-burgundy transition-colors hover:text-burgundy-strong",
} as const;

/** Badge de estado con tono semántico. */
export function badge(
  tone: "neutral" | "success" | "warning" | "danger" | "info" = "neutral"
): string {
  const tones: Record<string, string> = {
    neutral: "bg-stone-100 text-stone-600",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-burgundy-50 text-burgundy",
  };
  return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`;
}
