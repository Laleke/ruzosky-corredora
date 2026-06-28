import type { Database } from "@/types/database.types";

export type Contrato = Database["public"]["Tables"]["contratos"]["Row"];
export type ContratoInsert =
  Database["public"]["Tables"]["contratos"]["Insert"];

/** Contrato con datos resumidos de su propiedad (para listado). */
export type ContratoConPropiedad = Contrato & {
  propiedad_direccion: string;
  propiedad_codigo: string | null;
};

/** Arrendatario vinculado a un contrato. */
export type ArrendatarioVinculado = {
  vinculo_id: string;
  arrendatario_id: string;
  nombre: string;
  rut: string;
};
