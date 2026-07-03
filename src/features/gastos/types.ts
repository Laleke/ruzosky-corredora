import type {
  Database,
  CategoriaGasto,
  EstadoGasto,
  ResponsableGasto,
} from "@/types/database.types";

export type Gasto = Database["public"]["Tables"]["gastos"]["Row"];

/** Gasto con datos derivados para el listado/detalle. */
export type GastoListado = Gasto & {
  propiedad_label: string | null;
  propietario_nombre: string | null;
  arrendatario_nombre: string | null;
  contrato_numero: string | null;
};

export type FiltrosGastos = {
  q?: string;
  categoria?: CategoriaGasto;
  estado?: EstadoGasto;
  responsable?: ResponsableGasto;
  propiedadId?: string;
  contratoId?: string;
  propietarioId?: string;
  desde?: string;
  hasta?: string;
};
