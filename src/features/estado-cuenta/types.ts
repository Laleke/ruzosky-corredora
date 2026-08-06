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
  /** Clave del destino de pago al que corresponde este cargo (ver `DestinoPago`). */
  destino_clave: string;
};

/** Datos bancarios donde el arrendatario debe transferir. */
export type CuentaBancaria = {
  banco: string | null;
  tipo_cuenta: string | null;
  numero_cuenta: string | null;
  titular_nombre: string | null;
  rut_titular: string | null;
  email_pagos: string | null;
};

/**
 * Cuenta de destino con el subtotal que le corresponde. Normalmente hay una
 * sola (la corredora); hay más de una cuando el arrendatario tiene cargos de
 * contratos con `pago_directo_propietario` distinto, o de propiedades de
 * propietarios distintos.
 */
export type DestinoPago = {
  clave: string;
  /** Nombre de a quién se le transfiere: la corredora o el propietario. */
  titulo: string;
  cuenta: CuentaBancaria;
  /** Propiedades cuyos cargos se pagan a esta cuenta. */
  propiedades: string[];
  subtotal: number;
  /** false si faltan banco o número de cuenta — el bloque no se puede mostrar. */
  completa: boolean;
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
  /** Cuentas donde transferir, con su subtotal. Vacío si no hay cargos. */
  destinos: DestinoPago[];
  /** Deuda vencida total. Los cargos por vencer no entran al informe. */
  total: number;
  /** Mora del cargo más antiguo — encabeza el resumen del informe. */
  dias_mora_maxima: number;
  /** Fecha de emisión del informe (YYYY-MM-DD). */
  emitido: string;
};

/** Fila del listado de arrendatarios en mora (los únicos con informe que enviar). */
export type ArrendatarioConDeuda = {
  id: string;
  nombre: string;
  rut: string;
  telefono: string | null;
  /** Propiedades con cargos vencidos. */
  propiedades: string[];
  /** Deuda vencida: lo que sale en el informe. */
  total_vencido: number;
  /** Saldo aún no vencido — contexto interno para el admin, no va al informe. */
  total_por_vencer: number;
  cargos_morosos: number;
  dias_mora_maxima: number;
};
