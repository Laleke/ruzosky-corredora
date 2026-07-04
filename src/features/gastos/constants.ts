import type {
  CategoriaGasto,
  EstadoGasto,
  ResponsableGasto,
} from "@/types/database.types";
import type { badge } from "@/components/ui";

type Tone = Parameters<typeof badge>[0];

export const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string }[] = [
  { value: "mantencion", label: "Mantención" },
  { value: "reparacion", label: "Reparación" },
  { value: "servicios", label: "Servicios (luz/agua/gas)" },
  { value: "gastos_comunes", label: "Gastos comunes" },
  { value: "contribuciones", label: "Contribuciones" },
  { value: "seguro", label: "Seguro" },
  { value: "comision", label: "Comisión" },
  { value: "legal", label: "Legal" },
  { value: "administracion", label: "Administración" },
  { value: "otro", label: "Otro" },
];

export const CATEGORIA_GASTO_LABEL: Record<CategoriaGasto, string> =
  Object.fromEntries(
    CATEGORIAS_GASTO.map((c) => [c.value, c.label])
  ) as Record<CategoriaGasto, string>;

export const ESTADOS_GASTO: {
  value: EstadoGasto;
  label: string;
  tone: Tone;
}[] = [
  { value: "pendiente", label: "Pendiente", tone: "warning" },
  { value: "pagado", label: "Pagado", tone: "success" },
  { value: "anulado", label: "Anulado", tone: "danger" },
];

export const ESTADO_GASTO: Record<EstadoGasto, { label: string; tone: Tone }> =
  Object.fromEntries(
    ESTADOS_GASTO.map((e) => [e.value, { label: e.label, tone: e.tone }])
  ) as Record<EstadoGasto, { label: string; tone: Tone }>;

export const RESPONSABLES_GASTO: {
  value: ResponsableGasto;
  label: string;
}[] = [
  { value: "propietario", label: "Propietario" },
  { value: "arrendatario", label: "Arrendatario" },
  { value: "corredora", label: "Corredora" },
];

export const RESPONSABLE_GASTO_LABEL: Record<ResponsableGasto, string> =
  Object.fromEntries(
    RESPONSABLES_GASTO.map((r) => [r.value, r.label])
  ) as Record<ResponsableGasto, string>;

export function clp(n: number | null | undefined): string {
  return `$${Math.round(Number(n ?? 0)).toLocaleString("es-CL")}`;
}
