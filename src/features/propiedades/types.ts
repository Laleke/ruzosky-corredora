import type { Database } from "@/types/database.types";

export type Propiedad =
  Database["public"]["Tables"]["propiedades"]["Row"];
export type PropiedadInsert =
  Database["public"]["Tables"]["propiedades"]["Insert"];

export type PropietarioPropiedad =
  Database["public"]["Tables"]["propietarios_propiedades"]["Row"];

/** Asignación de propietario a una propiedad, con datos del propietario. */
export type PropietarioAsignado = {
  vinculo_id: string;
  propietario_id: string;
  porcentaje_participacion: number;
  nombre: string;
  rut: string;
};
