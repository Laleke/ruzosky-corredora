import type { Database } from "@/types/database.types";

export type Recordatorio = Database["public"]["Tables"]["recordatorios"]["Row"];

/** Recordatorio con las propiedades a las que aún les falta el cargo de este mes. */
export type RecordatorioConFaltantes = Recordatorio & {
  faltantes: { contratoId: string; propiedadDireccion: string }[];
};

export type RecordatorioFormState = { error: string | null };
