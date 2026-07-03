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
export type TipoCargo =
  | "arriendo"
  | "gasto_comun"
  | "administracion"
  | "luz"
  | "agua"
  | "internet"
  | "multa"
  | "ajuste"
  | "otro";
export type EstadoCargo = "pendiente" | "parcial" | "pagado" | "vencido";
export type MedioPago =
  | "transferencia"
  | "efectivo"
  | "cheque"
  | "tarjeta"
  | "otro";
export type EstadoLiquidacion = "pendiente" | "pagada" | "anulada";
export type TipoDetalleLiquidacion = "ingreso" | "descuento";
export type CategoriaGasto =
  | "mantencion"
  | "reparacion"
  | "servicios"
  | "gastos_comunes"
  | "contribuciones"
  | "seguro"
  | "comision"
  | "legal"
  | "administracion"
  | "otro";
export type EstadoGasto = "pendiente" | "pagado" | "anulado";
export type ResponsableGasto = "propietario" | "arrendatario" | "corredora";
export type CategoriaDocumento =
  | "contrato"
  | "anexo"
  | "inventario"
  | "acta_entrega"
  | "acta_recepcion"
  | "liquidacion"
  | "comprobante_pago"
  | "factura"
  | "boleta"
  | "gasto"
  | "mantencion"
  | "otro";

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
          numero: string | null;
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
          numero?: string | null;
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
          numero?: string | null;
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
          numero: string | null;
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
          numero?: string | null;
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
          numero?: string | null;
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
          direccion: string | null;
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
          direccion?: string | null;
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
          direccion?: string | null;
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
          corretaje_liquidado: boolean;
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
          corretaje_liquidado?: boolean;
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
          corretaje_liquidado?: boolean;
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
      cargos: {
        Row: {
          id: string;
          empresa_id: string;
          contrato_id: string;
          periodo: string;
          tipo_cargo: TipoCargo;
          fecha_emision: string;
          fecha_vencimiento: string | null;
          monto: number;
          estado: EstadoCargo;
          saldo_pendiente: number;
          observaciones: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          contrato_id: string;
          periodo: string;
          tipo_cargo?: TipoCargo;
          fecha_emision: string;
          fecha_vencimiento?: string | null;
          monto: number;
          estado?: EstadoCargo;
          saldo_pendiente: number;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          contrato_id?: string;
          periodo?: string;
          tipo_cargo?: TipoCargo;
          fecha_emision?: string;
          fecha_vencimiento?: string | null;
          monto?: number;
          estado?: EstadoCargo;
          saldo_pendiente?: number;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pagos: {
        Row: {
          id: string;
          empresa_id: string;
          cargo_id: string;
          fecha_pago: string;
          monto_pagado: number;
          medio_pago: MedioPago | null;
          referencia: string | null;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cargo_id: string;
          fecha_pago: string;
          monto_pagado: number;
          medio_pago?: MedioPago | null;
          referencia?: string | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          cargo_id?: string;
          fecha_pago?: string;
          monto_pagado?: number;
          medio_pago?: MedioPago | null;
          referencia?: string | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      liquidaciones: {
        Row: {
          id: string;
          empresa_id: string;
          propietario_id: string;
          periodo: string;
          fecha_generacion: string;
          subtotal_ingresos: number;
          subtotal_descuentos: number;
          total_liquidacion: number;
          estado: EstadoLiquidacion;
          observaciones: string | null;
          fecha_pago: string | null;
          pago_observacion: string | null;
          comprobante_url: string | null;
          numero: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propietario_id: string;
          periodo: string;
          fecha_generacion: string;
          subtotal_ingresos?: number;
          subtotal_descuentos?: number;
          total_liquidacion?: number;
          estado?: EstadoLiquidacion;
          observaciones?: string | null;
          fecha_pago?: string | null;
          pago_observacion?: string | null;
          comprobante_url?: string | null;
          numero?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          propietario_id?: string;
          periodo?: string;
          fecha_generacion?: string;
          subtotal_ingresos?: number;
          subtotal_descuentos?: number;
          total_liquidacion?: number;
          estado?: EstadoLiquidacion;
          observaciones?: string | null;
          fecha_pago?: string | null;
          pago_observacion?: string | null;
          comprobante_url?: string | null;
          numero?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      liquidacion_detalles: {
        Row: {
          id: string;
          empresa_id: string;
          liquidacion_id: string;
          tipo: TipoDetalleLiquidacion;
          concepto: string;
          referencia_tipo: string | null;
          referencia_id: string | null;
          observacion: string | null;
          monto: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          liquidacion_id: string;
          tipo: TipoDetalleLiquidacion;
          concepto: string;
          referencia_tipo?: string | null;
          referencia_id?: string | null;
          observacion?: string | null;
          monto: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          liquidacion_id?: string;
          tipo?: TipoDetalleLiquidacion;
          concepto?: string;
          referencia_tipo?: string | null;
          referencia_id?: string | null;
          observacion?: string | null;
          monto?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      auditoria: {
        Row: {
          id: string;
          empresa_id: string;
          usuario_id: string | null;
          usuario_email: string | null;
          accion: string;
          entidad_tipo: string;
          entidad_id: string | null;
          datos: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          usuario_id?: string | null;
          usuario_email?: string | null;
          accion: string;
          entidad_tipo: string;
          entidad_id?: string | null;
          datos?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          usuario_id?: string | null;
          usuario_email?: string | null;
          accion?: string;
          entidad_tipo?: string;
          entidad_id?: string | null;
          datos?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          empresa_id: string;
          nombre: string;
          categoria: CategoriaDocumento;
          propietario_id: string | null;
          arrendatario_id: string | null;
          propiedad_id: string | null;
          contrato_id: string | null;
          observaciones: string | null;
          fecha_documento: string | null;
          version_actual: number;
          subido_por: string | null;
          subido_por_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nombre: string;
          categoria: CategoriaDocumento;
          propietario_id?: string | null;
          arrendatario_id?: string | null;
          propiedad_id?: string | null;
          contrato_id?: string | null;
          observaciones?: string | null;
          fecha_documento?: string | null;
          version_actual?: number;
          subido_por?: string | null;
          subido_por_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          nombre?: string;
          categoria?: CategoriaDocumento;
          propietario_id?: string | null;
          arrendatario_id?: string | null;
          propiedad_id?: string | null;
          contrato_id?: string | null;
          observaciones?: string | null;
          fecha_documento?: string | null;
          version_actual?: number;
          subido_por?: string | null;
          subido_por_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documento_versiones: {
        Row: {
          id: string;
          empresa_id: string;
          documento_id: string;
          version: number;
          storage_path: string;
          nombre_archivo: string;
          tamano_bytes: number;
          mime_type: string | null;
          subido_por: string | null;
          subido_por_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          documento_id: string;
          version: number;
          storage_path: string;
          nombre_archivo: string;
          tamano_bytes?: number;
          mime_type?: string | null;
          subido_por?: string | null;
          subido_por_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          documento_id?: string;
          version?: number;
          storage_path?: string;
          nombre_archivo?: string;
          tamano_bytes?: number;
          mime_type?: string | null;
          subido_por?: string | null;
          subido_por_email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      gastos: {
        Row: {
          id: string;
          empresa_id: string;
          propiedad_id: string;
          contrato_id: string | null;
          propietario_id: string | null;
          arrendatario_id: string | null;
          liquidacion_id: string | null;
          documento_id: string | null;
          categoria: CategoriaGasto;
          descripcion: string;
          monto: number;
          fecha: string;
          estado: EstadoGasto;
          responsable_pago: ResponsableGasto;
          descontar_de_liquidacion: boolean;
          observaciones: string | null;
          creado_por: string | null;
          creado_por_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propiedad_id: string;
          contrato_id?: string | null;
          propietario_id?: string | null;
          arrendatario_id?: string | null;
          liquidacion_id?: string | null;
          documento_id?: string | null;
          categoria: CategoriaGasto;
          descripcion: string;
          monto: number;
          fecha: string;
          estado?: EstadoGasto;
          responsable_pago: ResponsableGasto;
          descontar_de_liquidacion?: boolean;
          observaciones?: string | null;
          creado_por?: string | null;
          creado_por_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          propiedad_id?: string;
          contrato_id?: string | null;
          propietario_id?: string | null;
          arrendatario_id?: string | null;
          liquidacion_id?: string | null;
          documento_id?: string | null;
          categoria?: CategoriaGasto;
          descripcion?: string;
          monto?: number;
          fecha?: string;
          estado?: EstadoGasto;
          responsable_pago?: ResponsableGasto;
          descontar_de_liquidacion?: boolean;
          observaciones?: string | null;
          creado_por?: string | null;
          creado_por_email?: string | null;
          created_at?: string;
          updated_at?: string;
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
      tipo_cargo: TipoCargo;
      estado_cargo: EstadoCargo;
      medio_pago: MedioPago;
      estado_liquidacion: EstadoLiquidacion;
      tipo_detalle_liquidacion: TipoDetalleLiquidacion;
      categoria_documento: CategoriaDocumento;
      categoria_gasto: CategoriaGasto;
      estado_gasto: EstadoGasto;
      responsable_gasto: ResponsableGasto;
    };
  };
};
