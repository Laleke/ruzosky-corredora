import type { Database } from "@/types/database.types";

export type Cargo = Database["public"]["Tables"]["cargos"]["Row"];
export type Pago = Database["public"]["Tables"]["pagos"]["Row"];

/** Cargo con datos del contrato/propiedad para listado. */
export type CargoConContexto = Cargo & {
  numero_contrato: string | null;
  propiedad_direccion: string;
};

export type FiltrosCargos = {
  propiedadId?: string;
  arrendatarioId?: string;
  estado?: "pendiente" | "parcial" | "pagado" | "vencido";
  periodo?: string;
  venceDesde?: string;
  venceHasta?: string;
};
