import type { Database, EstadoIncidencia } from "@/types/database.types";

export type Incidencia = Database["public"]["Tables"]["incidencias"]["Row"];

/** Incidencia con datos derivados para el listado/detalle. */
export type IncidenciaListado = Incidencia & {
  propiedad_label: string | null;
};

export type FiltrosIncidencias = {
  propiedadId?: string;
  estado?: EstadoIncidencia;
};
