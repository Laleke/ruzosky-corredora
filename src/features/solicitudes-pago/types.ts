import type { Database } from "@/types/database.types";

export type SolicitudPago = Database["public"]["Tables"]["solicitudes_pago"]["Row"];
export type EstadoSolicitudPago = Database["public"]["Enums"]["estado_solicitud_pago"];

/** Solicitud con datos de contexto para listados (propietario/admin). */
export type SolicitudConContexto = SolicitudPago & {
  numero_contrato: string | null;
  propiedad_direccion: string;
  periodo: string;
  arrendatario_nombre: string;
};

export type SolicitudFormState = { error: string | null };
