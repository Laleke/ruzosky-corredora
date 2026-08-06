import type { Database } from "@/types/database.types";
import type { Cargo } from "@/features/cobros/types";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];

/** Cargo pendiente con el contexto que necesita el informe (propiedad + mora). */
export type CargoDeuda = Cargo & {
  propiedad_label: string;
  numero_contrato: string | null;
  saldo: number;
  /** Días vencidos a la fecha del informe; 0 si aún no vence. */
  dias_mora: number;
};

/** Todo lo que necesita el documento de estado de cuenta, ya calculado. */
export type EstadoCuenta = {
  arrendatario: {
    id: string;
    nombre: string;
    rut: string;
    email: string | null;
    telefono: string | null;
  };
  empresa: Empresa;
  cargos: CargoDeuda[];
  total: number;
  total_vencido: number;
  /** Mora del cargo más antiguo — encabeza el resumen del informe. */
  dias_mora_maxima: number;
  /** Fecha de emisión del informe (YYYY-MM-DD). */
  emitido: string;
};

/** Fila del listado de arrendatarios con deuda. */
export type ArrendatarioConDeuda = {
  id: string;
  nombre: string;
  rut: string;
  telefono: string | null;
  propiedades: string[];
  total: number;
  total_vencido: number;
  cargos_pendientes: number;
  dias_mora_maxima: number;
};
