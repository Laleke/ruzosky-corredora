import type { EstadoIncidencia } from "@/types/database.types";
import type { badge } from "@/components/ui";

type Tone = Parameters<typeof badge>[0];

export const ESTADOS_INCIDENCIA: { value: EstadoIncidencia; label: string; tone: Tone }[] = [
  { value: "reportada", label: "Reportada", tone: "neutral" },
  { value: "agendada", label: "Agendada", tone: "info" },
  { value: "en_proceso", label: "En proceso", tone: "warning" },
  { value: "resuelta", label: "Resuelta", tone: "success" },
  { value: "cancelada", label: "Cancelada", tone: "danger" },
];

export const ESTADO_INCIDENCIA: Record<EstadoIncidencia, { label: string; tone: Tone }> =
  Object.fromEntries(
    ESTADOS_INCIDENCIA.map((e) => [e.value, { label: e.label, tone: e.tone }])
  ) as Record<EstadoIncidencia, { label: string; tone: Tone }>;

export function clp(n: number | null | undefined): string {
  return `$${Math.round(Number(n ?? 0)).toLocaleString("es-CL")}`;
}
