/**
 * Tipos de la base de datos Supabase.
 *
 * Definidos a mano según la migración `0001_tenancy_auth.sql`.
 * Una vez conectado el proyecto, regenerar con `npm run types:gen`
 * (sobrescribe este archivo con el esquema real).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RolUsuario = "admin" | "propietario" | "arrendatario";
export type TipoPersona = "persona_natural" | "persona_juridica";
export type TipoCuentaBancaria = "corriente" | "vista" | "ahorro" | "rut";
export type TipoPropiedad =
  | "departamento"
  | "casa"
  | "oficina"
  | "local_comercial"
  | "bodega"
  | "estacionamiento"
  | "terreno"
  | "otro";
export type EstadoPropiedad =
  | "disponible"
  | "reservada"
  | "arrendada"
  | "mantencion"
  | "inactiva";
export type Moneda = "CLP" | "UF";
export type ReajusteTipo = "sin_reajuste" | "IPC" | "UF";
export type TipoComision = "porcentaje" | "monto_fijo";
export type EstadoContrato =
  | "borrador"
  | "vigente"
  | "vencido"
  | "terminado"
  | "renovado";

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nombre: string;
          rut: string | null;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          rut?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          rut?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          empresa_id: string;
          nombre: string | null;
          email: string | null;
          rol: RolUsuario;
          created_at: string;
        };
        Insert: {
          id: string;
          empresa_id: string;
          nombre?: string | null;
          email?: string | null;
          rol?: RolUsuario;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nombre?: string | null;
          email?: string | null;
          rol?: RolUsuario;
          created_at?: string;
        };
        Relationships: [];
      };
      propietarios: {
        Row: {
          id: string;
          empresa_id: string;
          tipo_persona: TipoPersona;
          rut: string;
          nombre: string | null;
          apellido: string | null;
          razon_social: string | null;
          email: string | null;
          telefono: string | null;
          direccion: string | null;
          comuna: string | null;
          region: string | null;
          banco: string | null;
          tipo_cuenta: TipoCuentaBancaria | null;
          numero_cuenta: string | null;
          titular_cuenta: string | null;
          rut_titular: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo_persona?: TipoPersona;
          rut: string;
          nombre?: string | null;
          apellido?: string | null;
          razon_social?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          banco?: string | null;
          tipo_cuenta?: TipoCuentaBancaria | null;
          numero_cuenta?: string | null;
          titular_cuenta?: string | null;
          rut_titular?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          tipo_persona?: TipoPersona;
          rut?: string;
          nombre?: string | null;
          apellido?: string | null;
          razon_social?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          banco?: string | null;
          tipo_cuenta?: TipoCuentaBancaria | null;
          numero_cuenta?: string | null;
          titular_cuenta?: string | null;
          rut_titular?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      arrendatarios: {
        Row: {
          id: string;
          empresa_id: string;
          tipo_persona: TipoPersona;
          rut: string;
          nombre: string | null;
          apellido: string | null;
          razon_social: string | null;
          email: string | null;
          telefono: string | null;
          direccion: string | null;
          comuna: string | null;
          region: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo_persona?: TipoPersona;
          rut: string;
          nombre?: string | null;
          apellido?: string | null;
          razon_social?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          tipo_persona?: TipoPersona;
          rut?: string;
          nombre?: string | null;
          apellido?: string | null;
          razon_social?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      propiedades: {
        Row: {
          id: string;
          empresa_id: string;
          codigo_interno: string | null;
          tipo: TipoPropiedad;
          direccion: string;
          numero: string | null;
          departamento: string | null;
          comuna: string | null;
          region: string | null;
          rol_sii: string | null;
          dormitorios: number | null;
          banos: number | null;
          superficie_util_m2: number | null;
          superficie_total_m2: number | null;
          estacionamientos: number | null;
          bodegas: number | null;
          estado: EstadoPropiedad;
          moneda: Moneda;
          valor_referencial_arriendo: number | null;
          gasto_comun_estimado: number | null;
          fecha_adquisicion: string | null;
          observaciones: string | null;
          publicada: boolean;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          codigo_interno?: string | null;
          tipo?: TipoPropiedad;
          direccion: string;
          numero?: string | null;
          departamento?: string | null;
          comuna?: string | null;
          region?: string | null;
          rol_sii?: string | null;
          dormitorios?: number | null;
          banos?: number | null;
          superficie_util_m2?: number | null;
          superficie_total_m2?: number | null;
          estacionamientos?: number | null;
          bodegas?: number | null;
          estado?: EstadoPropiedad;
          moneda?: Moneda;
          valor_referencial_arriendo?: number | null;
          gasto_comun_estimado?: number | null;
          fecha_adquisicion?: string | null;
          observaciones?: string | null;
          publicada?: boolean;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          codigo_interno?: string | null;
          tipo?: TipoPropiedad;
          direccion?: string;
          numero?: string | null;
          departamento?: string | null;
          comuna?: string | null;
          region?: string | null;
          rol_sii?: string | null;
          dormitorios?: number | null;
          banos?: number | null;
          superficie_util_m2?: number | null;
          superficie_total_m2?: number | null;
          estacionamientos?: number | null;
          bodegas?: number | null;
          estado?: EstadoPropiedad;
          moneda?: Moneda;
          valor_referencial_arriendo?: number | null;
          gasto_comun_estimado?: number | null;
          fecha_adquisicion?: string | null;
          observaciones?: string | null;
          publicada?: boolean;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      propietarios_propiedades: {
        Row: {
          id: string;
          empresa_id: string;
          propietario_id: string;
          propiedad_id: string;
          porcentaje_participacion: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propietario_id: string;
          propiedad_id: string;
          porcentaje_participacion?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          propietario_id?: string;
          propiedad_id?: string;
          porcentaje_participacion?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      contratos: {
        Row: {
          id: string;
          empresa_id: string;
          numero_contrato: string | null;
          propiedad_id: string;
          fecha_firma: string | null;
          fecha_inicio: string;
          fecha_termino: string | null;
          canon_monto: number;
          canon_moneda: Moneda;
          reajuste_tipo: ReajusteTipo;
          periodicidad_reajuste_meses: number | null;
          tipo_comision: TipoComision | null;
          comision_monto: number | null;
          cobra_administracion: boolean;
          administracion_monto: number | null;
          administracion_porcentaje: number | null;
          estado: EstadoContrato;
          observaciones: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          numero_contrato?: string | null;
          propiedad_id: string;
          fecha_firma?: string | null;
          fecha_inicio: string;
          fecha_termino?: string | null;
          canon_monto: number;
          canon_moneda?: Moneda;
          reajuste_tipo?: ReajusteTipo;
          periodicidad_reajuste_meses?: number | null;
          tipo_comision?: TipoComision | null;
          comision_monto?: number | null;
          cobra_administracion?: boolean;
          administracion_monto?: number | null;
          administracion_porcentaje?: number | null;
          estado?: EstadoContrato;
          observaciones?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          numero_contrato?: string | null;
          propiedad_id?: string;
          fecha_firma?: string | null;
          fecha_inicio?: string;
          fecha_termino?: string | null;
          canon_monto?: number;
          canon_moneda?: Moneda;
          reajuste_tipo?: ReajusteTipo;
          periodicidad_reajuste_meses?: number | null;
          tipo_comision?: TipoComision | null;
          comision_monto?: number | null;
          cobra_administracion?: boolean;
          administracion_monto?: number | null;
          administracion_porcentaje?: number | null;
          estado?: EstadoContrato;
          observaciones?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contratos_arrendatarios: {
        Row: {
          id: string;
          empresa_id: string;
          contrato_id: string;
          arrendatario_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          contrato_id: string;
          arrendatario_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          contrato_id?: string;
          arrendatario_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_empresa_id: { Args: Record<string, never>; Returns: string };
      auth_rol: { Args: Record<string, never>; Returns: RolUsuario };
    };
    Enums: {
      rol_usuario: RolUsuario;
      tipo_persona: TipoPersona;
      tipo_cuenta_bancaria: TipoCuentaBancaria;
      tipo_propiedad: TipoPropiedad;
      estado_propiedad: EstadoPropiedad;
      moneda: Moneda;
      reajuste_tipo: ReajusteTipo;
      tipo_comision: TipoComision;
      estado_contrato: EstadoContrato;
    };
  };
};
