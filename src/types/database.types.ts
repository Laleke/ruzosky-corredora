export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      arrendatarios: {
        Row: {
          activo: boolean
          apellido: string | null
          comuna: string | null
          created_at: string
          direccion: string | null
          email: string | null
          empresa_id: string
          estado_invitacion: Database["public"]["Enums"]["estado_invitacion"]
          id: string
          invitado_en: string | null
          invitado_por: string | null
          nombre: string | null
          numero: string | null
          profile_id: string | null
          razon_social: string | null
          region: string | null
          rut: string
          telefono: string | null
          tipo_persona: Database["public"]["Enums"]["tipo_persona"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id: string
          estado_invitacion?: Database["public"]["Enums"]["estado_invitacion"]
          id?: string
          invitado_en?: string | null
          invitado_por?: string | null
          nombre?: string | null
          numero?: string | null
          profile_id?: string | null
          razon_social?: string | null
          region?: string | null
          rut: string
          telefono?: string | null
          tipo_persona?: Database["public"]["Enums"]["tipo_persona"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id?: string
          estado_invitacion?: Database["public"]["Enums"]["estado_invitacion"]
          id?: string
          invitado_en?: string | null
          invitado_por?: string | null
          nombre?: string | null
          numero?: string | null
          profile_id?: string | null
          razon_social?: string | null
          region?: string | null
          rut?: string
          telefono?: string | null
          tipo_persona?: Database["public"]["Enums"]["tipo_persona"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arrendatarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrendatarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          created_at: string
          datos: Json | null
          empresa_id: string
          entidad_id: string | null
          entidad_tipo: string
          id: string
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          datos?: Json | null
          empresa_id: string
          entidad_id?: string | null
          entidad_tipo: string
          id?: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          datos?: Json | null
          empresa_id?: string
          entidad_id?: string | null
          entidad_tipo?: string
          id?: string
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          contrato_id: string
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_cargo"]
          fecha_consumo_desde: string | null
          fecha_consumo_hasta: string | null
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          monto: number
          nombre: string | null
          observaciones: string | null
          pago_directo_servicio: boolean
          periodo: string
          saldo_pendiente: number
          tipo_cargo: Database["public"]["Enums"]["tipo_cargo"]
          updated_at: string
        }
        Insert: {
          contrato_id: string
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_cargo"]
          fecha_consumo_desde?: string | null
          fecha_consumo_hasta?: string | null
          fecha_emision: string
          fecha_vencimiento?: string | null
          id?: string
          monto: number
          nombre?: string | null
          observaciones?: string | null
          pago_directo_servicio?: boolean
          periodo: string
          saldo_pendiente: number
          tipo_cargo?: Database["public"]["Enums"]["tipo_cargo"]
          updated_at?: string
        }
        Update: {
          contrato_id?: string
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_cargo"]
          fecha_consumo_desde?: string | null
          fecha_consumo_hasta?: string | null
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          monto?: number
          nombre?: string | null
          observaciones?: string | null
          pago_directo_servicio?: boolean
          periodo?: string
          saldo_pendiente?: number
          tipo_cargo?: Database["public"]["Enums"]["tipo_cargo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_notificaciones_cobro: {
        Row: {
          activo: boolean
          contrato_id: string | null
          created_at: string
          dias_antes: number | null
          dias_despues: number | null
          empresa_id: string
          hora_envio: string
          id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contrato_id?: string | null
          created_at?: string
          dias_antes?: number | null
          dias_despues?: number | null
          empresa_id: string
          hora_envio?: string
          id?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contrato_id?: string | null
          created_at?: string
          dias_antes?: number | null
          dias_despues?: number | null
          empresa_id?: string
          hora_envio?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_notificaciones_cobro_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_notificaciones_cobro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_garantias: {
        Row: {
          contrato_id: string
          creado_por: string | null
          creado_por_email: string | null
          created_at: string
          empresa_id: string
          fecha: string
          id: string
          monto: number
          motivo: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_garantia"]
          updated_at: string
        }
        Insert: {
          contrato_id: string
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          empresa_id: string
          fecha: string
          id?: string
          monto: number
          motivo?: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_garantia"]
          updated_at?: string
        }
        Update: {
          contrato_id?: string
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          empresa_id?: string
          fecha?: string
          id?: string
          monto?: number
          motivo?: string | null
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento_garantia"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_garantias_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_garantias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          activo: boolean
          administracion_monto: number | null
          administracion_porcentaje: number | null
          canon_actual: number | null
          canon_moneda: Database["public"]["Enums"]["moneda"]
          canon_monto: number
          canon_uf_base: number | null
          cobra_administracion: boolean
          comision_monto: number | null
          corretaje_liquidado: boolean
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_contrato"]
          fecha_firma: string | null
          fecha_inicio: string
          fecha_proximo_reajuste: string | null
          fecha_termino: string | null
          id: string
          numero_contrato: string | null
          observaciones: string | null
          pago_directo_propietario: boolean
          periodicidad_reajuste_meses: number | null
          propiedad_id: string
          reajuste_tipo: Database["public"]["Enums"]["reajuste_tipo"]
          tipo_comision: Database["public"]["Enums"]["tipo_comision"] | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          administracion_monto?: number | null
          administracion_porcentaje?: number | null
          canon_actual?: number | null
          canon_moneda?: Database["public"]["Enums"]["moneda"]
          canon_monto: number
          canon_uf_base?: number | null
          cobra_administracion?: boolean
          comision_monto?: number | null
          corretaje_liquidado?: boolean
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_contrato"]
          fecha_firma?: string | null
          fecha_inicio: string
          fecha_proximo_reajuste?: string | null
          fecha_termino?: string | null
          id?: string
          numero_contrato?: string | null
          observaciones?: string | null
          pago_directo_propietario?: boolean
          periodicidad_reajuste_meses?: number | null
          propiedad_id: string
          reajuste_tipo?: Database["public"]["Enums"]["reajuste_tipo"]
          tipo_comision?: Database["public"]["Enums"]["tipo_comision"] | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          administracion_monto?: number | null
          administracion_porcentaje?: number | null
          canon_actual?: number | null
          canon_moneda?: Database["public"]["Enums"]["moneda"]
          canon_monto?: number
          canon_uf_base?: number | null
          cobra_administracion?: boolean
          comision_monto?: number | null
          corretaje_liquidado?: boolean
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_contrato"]
          fecha_firma?: string | null
          fecha_inicio?: string
          fecha_proximo_reajuste?: string | null
          fecha_termino?: string | null
          id?: string
          numero_contrato?: string | null
          observaciones?: string | null
          pago_directo_propietario?: boolean
          periodicidad_reajuste_meses?: number | null
          propiedad_id?: string
          reajuste_tipo?: Database["public"]["Enums"]["reajuste_tipo"]
          tipo_comision?: Database["public"]["Enums"]["tipo_comision"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_arrendatarios: {
        Row: {
          arrendatario_id: string
          contrato_id: string
          created_at: string
          empresa_id: string
          id: string
        }
        Insert: {
          arrendatario_id: string
          contrato_id: string
          created_at?: string
          empresa_id: string
          id?: string
        }
        Update: {
          arrendatario_id?: string
          contrato_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_arrendatarios_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_arrendatarios_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_arrendatarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_versiones: {
        Row: {
          created_at: string
          documento_id: string
          empresa_id: string
          id: string
          mime_type: string | null
          nombre_archivo: string
          storage_path: string
          subido_por: string | null
          subido_por_email: string | null
          tamano_bytes: number
          version: number
        }
        Insert: {
          created_at?: string
          documento_id: string
          empresa_id: string
          id?: string
          mime_type?: string | null
          nombre_archivo: string
          storage_path: string
          subido_por?: string | null
          subido_por_email?: string | null
          tamano_bytes?: number
          version: number
        }
        Update: {
          created_at?: string
          documento_id?: string
          empresa_id?: string
          id?: string
          mime_type?: string | null
          nombre_archivo?: string
          storage_path?: string
          subido_por?: string | null
          subido_por_email?: string | null
          tamano_bytes?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documento_versiones_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versiones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arrendatario_id: string | null
          categoria: Database["public"]["Enums"]["categoria_documento"]
          contrato_id: string | null
          created_at: string
          empresa_id: string
          fecha_documento: string | null
          id: string
          nombre: string
          observaciones: string | null
          propiedad_id: string | null
          propietario_id: string | null
          subido_por: string | null
          subido_por_email: string | null
          updated_at: string
          version_actual: number
        }
        Insert: {
          arrendatario_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_documento"]
          contrato_id?: string | null
          created_at?: string
          empresa_id: string
          fecha_documento?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          propiedad_id?: string | null
          propietario_id?: string | null
          subido_por?: string | null
          subido_por_email?: string | null
          updated_at?: string
          version_actual?: number
        }
        Update: {
          arrendatario_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_documento"]
          contrato_id?: string | null
          created_at?: string
          empresa_id?: string
          fecha_documento?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          propiedad_id?: string | null
          propietario_id?: string | null
          subido_por?: string | null
          subido_por_email?: string | null
          updated_at?: string
          version_actual?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "propietarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activa: boolean
          banco: string | null
          created_at: string
          email_pagos: string | null
          id: string
          nombre: string
          numero_cuenta: string | null
          rut: string | null
          rut_titular: string | null
          tipo_cuenta: string | null
          titular_nombre: string | null
        }
        Insert: {
          activa?: boolean
          banco?: string | null
          created_at?: string
          email_pagos?: string | null
          id?: string
          nombre: string
          numero_cuenta?: string | null
          rut?: string | null
          rut_titular?: string | null
          tipo_cuenta?: string | null
          titular_nombre?: string | null
        }
        Update: {
          activa?: boolean
          banco?: string | null
          created_at?: string
          email_pagos?: string | null
          id?: string
          nombre?: string
          numero_cuenta?: string | null
          rut?: string | null
          rut_titular?: string | null
          tipo_cuenta?: string | null
          titular_nombre?: string | null
        }
        Relationships: []
      }
      estado_cuenta_links: {
        Row: {
          arrendatario_id: string
          creado_por: string | null
          created_at: string
          empresa_id: string
          expira_en: string | null
          id: string
          revocado: boolean
          token: string
        }
        Insert: {
          arrendatario_id: string
          creado_por?: string | null
          created_at?: string
          empresa_id: string
          expira_en?: string | null
          id?: string
          revocado?: boolean
          token: string
        }
        Update: {
          arrendatario_id?: string
          creado_por?: string | null
          created_at?: string
          empresa_id?: string
          expira_en?: string | null
          id?: string
          revocado?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "estado_cuenta_links_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_cuenta_links_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_cuenta_links_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      gasto_obligaciones: {
        Row: {
          created_at: string
          empresa_id: string
          fecha_gasto: string
          gasto_id: string
          id: string
          monto_calculado: number
          propiedad_id: string
          propietario_id: string | null
          responsable: Database["public"]["Enums"]["responsable_gasto"]
          tipo_monto: Database["public"]["Enums"]["tipo_monto_obligacion"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          fecha_gasto: string
          gasto_id: string
          id?: string
          monto_calculado: number
          propiedad_id: string
          propietario_id?: string | null
          responsable: Database["public"]["Enums"]["responsable_gasto"]
          tipo_monto: Database["public"]["Enums"]["tipo_monto_obligacion"]
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          fecha_gasto?: string
          gasto_id?: string
          id?: string
          monto_calculado?: number
          propiedad_id?: string
          propietario_id?: string | null
          responsable?: Database["public"]["Enums"]["responsable_gasto"]
          tipo_monto?: Database["public"]["Enums"]["tipo_monto_obligacion"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "gasto_obligaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "propietarios"
            referencedColumns: ["id"]
          },
        ]
      }
      gasto_obligaciones_cuotas: {
        Row: {
          created_at: string
          documento_id: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_gasto"]
          fecha_vencimiento: string | null
          id: string
          liquidacion_id: string | null
          monto: number
          numero_cuota: number
          obligacion_id: string
          observaciones: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento_id?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_gasto"]
          fecha_vencimiento?: string | null
          id?: string
          liquidacion_id?: string | null
          monto: number
          numero_cuota?: number
          obligacion_id: string
          observaciones?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento_id?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_gasto"]
          fecha_vencimiento?: string | null
          id?: string
          liquidacion_id?: string | null
          monto?: number
          numero_cuota?: number
          obligacion_id?: string
          observaciones?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gasto_obligaciones_cuotas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_cuotas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_cuotas_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_obligaciones_cuotas_obligacion_id_fkey"
            columns: ["obligacion_id"]
            isOneToOne: false
            referencedRelation: "gasto_obligaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          arrendatario_id: string | null
          categoria: Database["public"]["Enums"]["categoria_gasto"]
          contrato_id: string | null
          creado_por: string | null
          creado_por_email: string | null
          created_at: string
          descontar_de_liquidacion: boolean
          descripcion: string
          documento_id: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_gasto"]
          fecha: string
          id: string
          liquidacion_id: string | null
          monto: number
          observaciones: string | null
          propiedad_id: string
          propietario_id: string | null
          responsable_pago: Database["public"]["Enums"]["responsable_gasto"]
          updated_at: string
        }
        Insert: {
          arrendatario_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_gasto"]
          contrato_id?: string | null
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          descontar_de_liquidacion?: boolean
          descripcion: string
          documento_id?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_gasto"]
          fecha: string
          id?: string
          liquidacion_id?: string | null
          monto: number
          observaciones?: string | null
          propiedad_id: string
          propietario_id?: string | null
          responsable_pago: Database["public"]["Enums"]["responsable_gasto"]
          updated_at?: string
        }
        Update: {
          arrendatario_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_gasto"]
          contrato_id?: string | null
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          descontar_de_liquidacion?: boolean
          descripcion?: string
          documento_id?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_gasto"]
          fecha?: string
          id?: string
          liquidacion_id?: string | null
          monto?: number
          observaciones?: string | null
          propiedad_id?: string
          propietario_id?: string | null
          responsable_pago?: Database["public"]["Enums"]["responsable_gasto"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "propietarios"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          contrato_id: string | null
          costo: number | null
          creado_por: string | null
          creado_por_email: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_incidencia"]
          fecha_agendada: string | null
          fecha_reportada: string
          fecha_resuelta: string | null
          gasto_id: string | null
          id: string
          observaciones: string | null
          propiedad_id: string
          proveedor_contacto: string | null
          proveedor_nombre: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          contrato_id?: string | null
          costo?: number | null
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_incidencia"]
          fecha_agendada?: string | null
          fecha_reportada: string
          fecha_resuelta?: string | null
          gasto_id?: string | null
          id?: string
          observaciones?: string | null
          propiedad_id: string
          proveedor_contacto?: string | null
          proveedor_nombre?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          contrato_id?: string | null
          costo?: number | null
          creado_por?: string | null
          creado_por_email?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_incidencia"]
          fecha_agendada?: string | null
          fecha_reportada?: string
          fecha_resuelta?: string | null
          gasto_id?: string | null
          id?: string
          observaciones?: string | null
          propiedad_id?: string
          proveedor_contacto?: string | null
          proveedor_nombre?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidacion_detalles: {
        Row: {
          concepto: string
          created_at: string
          empresa_id: string
          id: string
          liquidacion_id: string
          monto: number
          observacion: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: Database["public"]["Enums"]["tipo_detalle_liquidacion"]
        }
        Insert: {
          concepto: string
          created_at?: string
          empresa_id: string
          id?: string
          liquidacion_id: string
          monto: number
          observacion?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: Database["public"]["Enums"]["tipo_detalle_liquidacion"]
        }
        Update: {
          concepto?: string
          created_at?: string
          empresa_id?: string
          id?: string
          liquidacion_id?: string
          monto?: number
          observacion?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_detalle_liquidacion"]
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_detalles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_detalles_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidaciones: {
        Row: {
          comprobante_url: string | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_liquidacion"]
          fecha_generacion: string
          fecha_pago: string | null
          id: string
          numero: string | null
          observaciones: string | null
          pago_observacion: string | null
          periodo: string
          propietario_id: string
          subtotal_descuentos: number
          subtotal_ingresos: number
          total_liquidacion: number
          updated_at: string
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_liquidacion"]
          fecha_generacion: string
          fecha_pago?: string | null
          id?: string
          numero?: string | null
          observaciones?: string | null
          pago_observacion?: string | null
          periodo: string
          propietario_id: string
          subtotal_descuentos?: number
          subtotal_ingresos?: number
          total_liquidacion?: number
          updated_at?: string
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_liquidacion"]
          fecha_generacion?: string
          fecha_pago?: string | null
          id?: string
          numero?: string | null
          observaciones?: string | null
          pago_observacion?: string | null
          periodo?: string
          propietario_id?: string
          subtotal_descuentos?: number
          subtotal_ingresos?: number
          total_liquidacion?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "propietarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_cobro_log: {
        Row: {
          arrendatario_id: string
          cargo_id: string
          email_destino: string
          empresa_id: string
          enviado_en: string
          error_detalle: string | null
          estado: string
          id: string
          tipo: string
        }
        Insert: {
          arrendatario_id: string
          cargo_id: string
          email_destino: string
          empresa_id: string
          enviado_en?: string
          error_detalle?: string | null
          estado: string
          id?: string
          tipo: string
        }
        Update: {
          arrendatario_id?: string
          cargo_id?: string
          email_destino?: string
          empresa_id?: string
          enviado_en?: string
          error_detalle?: string | null
          estado?: string
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_cobro_log_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_cobro_log_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_cobro_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          cargo_id: string
          created_at: string
          documento_id: string | null
          empresa_id: string
          fecha_pago: string
          id: string
          medio_pago: Database["public"]["Enums"]["medio_pago"] | null
          monto_pagado: number
          observaciones: string | null
          referencia: string | null
        }
        Insert: {
          cargo_id: string
          created_at?: string
          documento_id?: string | null
          empresa_id: string
          fecha_pago: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto_pagado: number
          observaciones?: string | null
          referencia?: string | null
        }
        Update: {
          cargo_id?: string
          created_at?: string
          documento_id?: string | null
          empresa_id?: string
          fecha_pago?: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto_pagado?: number
          observaciones?: string | null
          referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          nombre: string | null
          password_set: boolean
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa_id: string
          id: string
          nombre?: string | null
          password_set?: boolean
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          nombre?: string | null
          password_set?: boolean
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      propiedades: {
        Row: {
          activo: boolean
          banos: number | null
          bodegas: number | null
          codigo_interno: string | null
          comuna: string | null
          created_at: string
          departamento: string | null
          direccion: string | null
          dormitorios: number | null
          empresa_id: string
          estacionamientos: number | null
          estado: Database["public"]["Enums"]["estado_propiedad"]
          fecha_adquisicion: string | null
          gasto_comun_estimado: number | null
          id: string
          moneda: Database["public"]["Enums"]["moneda"]
          numero: string | null
          observaciones: string | null
          publicada: boolean
          region: string | null
          rol_sii: string | null
          superficie_total_m2: number | null
          superficie_util_m2: number | null
          tipo: Database["public"]["Enums"]["tipo_propiedad"]
          updated_at: string
          valor_referencial_arriendo: number | null
        }
        Insert: {
          activo?: boolean
          banos?: number | null
          bodegas?: number | null
          codigo_interno?: string | null
          comuna?: string | null
          created_at?: string
          departamento?: string | null
          direccion?: string | null
          dormitorios?: number | null
          empresa_id: string
          estacionamientos?: number | null
          estado?: Database["public"]["Enums"]["estado_propiedad"]
          fecha_adquisicion?: string | null
          gasto_comun_estimado?: number | null
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          numero?: string | null
          observaciones?: string | null
          publicada?: boolean
          region?: string | null
          rol_sii?: string | null
          superficie_total_m2?: number | null
          superficie_util_m2?: number | null
          tipo?: Database["public"]["Enums"]["tipo_propiedad"]
          updated_at?: string
          valor_referencial_arriendo?: number | null
        }
        Update: {
          activo?: boolean
          banos?: number | null
          bodegas?: number | null
          codigo_interno?: string | null
          comuna?: string | null
          created_at?: string
          departamento?: string | null
          direccion?: string | null
          dormitorios?: number | null
          empresa_id?: string
          estacionamientos?: number | null
          estado?: Database["public"]["Enums"]["estado_propiedad"]
          fecha_adquisicion?: string | null
          gasto_comun_estimado?: number | null
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          numero?: string | null
          observaciones?: string | null
          publicada?: boolean
          region?: string | null
          rol_sii?: string | null
          superficie_total_m2?: number | null
          superficie_util_m2?: number | null
          tipo?: Database["public"]["Enums"]["tipo_propiedad"]
          updated_at?: string
          valor_referencial_arriendo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propiedades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      propietarios: {
        Row: {
          activo: boolean
          apellido: string | null
          banco: string | null
          comuna: string | null
          created_at: string
          direccion: string | null
          email: string | null
          empresa_id: string
          estado_invitacion: Database["public"]["Enums"]["estado_invitacion"]
          id: string
          invitado_en: string | null
          invitado_por: string | null
          nombre: string | null
          numero: string | null
          numero_cuenta: string | null
          profile_id: string | null
          razon_social: string | null
          region: string | null
          rut: string
          rut_titular: string | null
          telefono: string | null
          tipo_cuenta:
            | Database["public"]["Enums"]["tipo_cuenta_bancaria"]
            | null
          tipo_persona: Database["public"]["Enums"]["tipo_persona"]
          titular_cuenta: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido?: string | null
          banco?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id: string
          estado_invitacion?: Database["public"]["Enums"]["estado_invitacion"]
          id?: string
          invitado_en?: string | null
          invitado_por?: string | null
          nombre?: string | null
          numero?: string | null
          numero_cuenta?: string | null
          profile_id?: string | null
          razon_social?: string | null
          region?: string | null
          rut: string
          rut_titular?: string | null
          telefono?: string | null
          tipo_cuenta?:
            | Database["public"]["Enums"]["tipo_cuenta_bancaria"]
            | null
          tipo_persona?: Database["public"]["Enums"]["tipo_persona"]
          titular_cuenta?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido?: string | null
          banco?: string | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          empresa_id?: string
          estado_invitacion?: Database["public"]["Enums"]["estado_invitacion"]
          id?: string
          invitado_en?: string | null
          invitado_por?: string | null
          nombre?: string | null
          numero?: string | null
          numero_cuenta?: string | null
          profile_id?: string | null
          razon_social?: string | null
          region?: string | null
          rut?: string
          rut_titular?: string | null
          telefono?: string | null
          tipo_cuenta?:
            | Database["public"]["Enums"]["tipo_cuenta_bancaria"]
            | null
          tipo_persona?: Database["public"]["Enums"]["tipo_persona"]
          titular_cuenta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propietarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propietarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      propietarios_propiedades: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          porcentaje_participacion: number
          propiedad_id: string
          propietario_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          porcentaje_participacion?: number
          propiedad_id: string
          propietario_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          porcentaje_participacion?: number
          propiedad_id?: string
          propietario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "propietarios_propiedades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propietarios_propiedades_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propietarios_propiedades_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "propietarios"
            referencedColumns: ["id"]
          },
        ]
      }
      push_suscripciones: {
        Row: {
          auth: string
          created_at: string
          empresa_id: string
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          empresa_id: string
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          empresa_id?: string
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_suscripciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_suscripciones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorios: {
        Row: {
          activo: boolean
          created_at: string
          dia_mes_aviso: number
          empresa_id: string
          id: string
          nombre: string | null
          tipo_cargo: Database["public"]["Enums"]["tipo_cargo"]
          ultima_notificacion_en: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_mes_aviso: number
          empresa_id: string
          id?: string
          nombre?: string | null
          tipo_cargo: Database["public"]["Enums"]["tipo_cargo"]
          ultima_notificacion_en?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_mes_aviso?: number
          empresa_id?: string
          id?: string
          nombre?: string | null
          tipo_cargo?: Database["public"]["Enums"]["tipo_cargo"]
          ultima_notificacion_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_pago: {
        Row: {
          arrendatario_id: string
          cargo_id: string
          comprobante_mime_type: string | null
          comprobante_nombre_archivo: string | null
          comprobante_storage_path: string | null
          comprobante_tamano_bytes: number | null
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["estado_solicitud_pago"]
          excede_saldo: boolean
          fecha_pago: string
          id: string
          medio_pago: Database["public"]["Enums"]["medio_pago"] | null
          monto: number
          motivo_rechazo: string | null
          observaciones: string | null
          pago_id: string | null
          referencia: string | null
          revisado_en: string | null
          revisado_por: string | null
          saldo_pendiente_al_crear: number | null
        }
        Insert: {
          arrendatario_id: string
          cargo_id: string
          comprobante_mime_type?: string | null
          comprobante_nombre_archivo?: string | null
          comprobante_storage_path?: string | null
          comprobante_tamano_bytes?: number | null
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["estado_solicitud_pago"]
          excede_saldo?: boolean
          fecha_pago: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto: number
          motivo_rechazo?: string | null
          observaciones?: string | null
          pago_id?: string | null
          referencia?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          saldo_pendiente_al_crear?: number | null
        }
        Update: {
          arrendatario_id?: string
          cargo_id?: string
          comprobante_mime_type?: string | null
          comprobante_nombre_archivo?: string | null
          comprobante_storage_path?: string | null
          comprobante_tamano_bytes?: number | null
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["estado_solicitud_pago"]
          excede_saldo?: boolean
          fecha_pago?: string
          id?: string
          medio_pago?: Database["public"]["Enums"]["medio_pago"] | null
          monto?: number
          motivo_rechazo?: string | null
          observaciones?: string | null
          pago_id?: string | null
          referencia?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          saldo_pendiente_al_crear?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_pago_arrendatario_id_fkey"
            columns: ["arrendatario_id"]
            isOneToOne: false
            referencedRelation: "arrendatarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_pago_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      arrendatario_tiene_contrato_en_propiedad: {
        Args: { p_propiedad_id: string }
        Returns: boolean
      }
      arrendatario_ve_propietario: {
        Args: { p_propietario_id: string }
        Returns: boolean
      }
      auth_empresa_id: { Args: never; Returns: string }
      auth_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      propiedad_de_contrato: {
        Args: { p_contrato_id: string }
        Returns: string
      }
    }
    Enums: {
      categoria_documento:
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
        | "otro"
      categoria_gasto:
        | "mantencion"
        | "reparacion"
        | "servicios"
        | "gastos_comunes"
        | "contribuciones"
        | "seguro"
        | "comision"
        | "legal"
        | "administracion"
        | "otro"
      estado_cargo: "pendiente" | "parcial" | "pagado" | "vencido"
      estado_contrato:
        | "borrador"
        | "vigente"
        | "vencido"
        | "terminado"
        | "renovado"
      estado_gasto: "pendiente" | "pagado" | "anulado"
      estado_incidencia:
        | "reportada"
        | "agendada"
        | "en_proceso"
        | "resuelta"
        | "cancelada"
      estado_invitacion: "sin_invitar" | "invitado" | "activo"
      estado_liquidacion: "pendiente" | "pagada" | "anulada"
      estado_propiedad:
        | "disponible"
        | "reservada"
        | "arrendada"
        | "mantencion"
        | "inactiva"
      estado_solicitud_pago: "pendiente" | "aprobada" | "rechazada"
      medio_pago: "transferencia" | "efectivo" | "cheque" | "tarjeta" | "otro"
      moneda: "CLP" | "UF"
      reajuste_tipo: "sin_reajuste" | "IPC" | "UF"
      responsable_gasto: "propietario" | "arrendatario" | "corredora"
      rol_usuario: "admin" | "propietario" | "arrendatario"
      tipo_cargo:
        | "arriendo"
        | "gasto_comun"
        | "administracion"
        | "multa"
        | "ajuste"
        | "otro"
        | "luz"
        | "agua"
        | "internet"
      tipo_comision: "porcentaje" | "monto_fijo"
      tipo_cuenta_bancaria: "corriente" | "vista" | "ahorro" | "rut"
      tipo_detalle_liquidacion: "ingreso" | "descuento"
      tipo_monto_obligacion: "porcentaje" | "monto_fijo"
      tipo_movimiento_garantia: "recepcion" | "retencion" | "devolucion"
      tipo_persona: "persona_natural" | "persona_juridica"
      tipo_propiedad:
        | "departamento"
        | "casa"
        | "oficina"
        | "local_comercial"
        | "bodega"
        | "estacionamiento"
        | "terreno"
        | "otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_documento: [
        "contrato",
        "anexo",
        "inventario",
        "acta_entrega",
        "acta_recepcion",
        "liquidacion",
        "comprobante_pago",
        "factura",
        "boleta",
        "gasto",
        "mantencion",
        "otro",
      ],
      categoria_gasto: [
        "mantencion",
        "reparacion",
        "servicios",
        "gastos_comunes",
        "contribuciones",
        "seguro",
        "comision",
        "legal",
        "administracion",
        "otro",
      ],
      estado_cargo: ["pendiente", "parcial", "pagado", "vencido"],
      estado_contrato: [
        "borrador",
        "vigente",
        "vencido",
        "terminado",
        "renovado",
      ],
      estado_gasto: ["pendiente", "pagado", "anulado"],
      estado_incidencia: [
        "reportada",
        "agendada",
        "en_proceso",
        "resuelta",
        "cancelada",
      ],
      estado_invitacion: ["sin_invitar", "invitado", "activo"],
      estado_liquidacion: ["pendiente", "pagada", "anulada"],
      estado_propiedad: [
        "disponible",
        "reservada",
        "arrendada",
        "mantencion",
        "inactiva",
      ],
      estado_solicitud_pago: ["pendiente", "aprobada", "rechazada"],
      medio_pago: ["transferencia", "efectivo", "cheque", "tarjeta", "otro"],
      moneda: ["CLP", "UF"],
      reajuste_tipo: ["sin_reajuste", "IPC", "UF"],
      responsable_gasto: ["propietario", "arrendatario", "corredora"],
      rol_usuario: ["admin", "propietario", "arrendatario"],
      tipo_cargo: [
        "arriendo",
        "gasto_comun",
        "administracion",
        "multa",
        "ajuste",
        "otro",
        "luz",
        "agua",
        "internet",
      ],
      tipo_comision: ["porcentaje", "monto_fijo"],
      tipo_cuenta_bancaria: ["corriente", "vista", "ahorro", "rut"],
      tipo_detalle_liquidacion: ["ingreso", "descuento"],
      tipo_monto_obligacion: ["porcentaje", "monto_fijo"],
      tipo_movimiento_garantia: ["recepcion", "retencion", "devolucion"],
      tipo_persona: ["persona_natural", "persona_juridica"],
      tipo_propiedad: [
        "departamento",
        "casa",
        "oficina",
        "local_comercial",
        "bodega",
        "estacionamiento",
        "terreno",
        "otro",
      ],
    },
  },
} as const


// -----------------------------------------------------------------
// Alias de conveniencia para los enums (usados en todo el código en
// vez de referenciar Database["public"]["Enums"][...] cada vez).
// Regenerar a mano tras cada `npm run types:gen` si cambia algún enum.
// -----------------------------------------------------------------
export type RolUsuario = Database["public"]["Enums"]["rol_usuario"];
export type TipoPersona = Database["public"]["Enums"]["tipo_persona"];
export type TipoCuentaBancaria = Database["public"]["Enums"]["tipo_cuenta_bancaria"];
export type TipoPropiedad = Database["public"]["Enums"]["tipo_propiedad"];
export type EstadoPropiedad = Database["public"]["Enums"]["estado_propiedad"];
export type Moneda = Database["public"]["Enums"]["moneda"];
export type ReajusteTipo = Database["public"]["Enums"]["reajuste_tipo"];
export type TipoComision = Database["public"]["Enums"]["tipo_comision"];
export type EstadoContrato = Database["public"]["Enums"]["estado_contrato"];
export type TipoCargo = Database["public"]["Enums"]["tipo_cargo"];
export type EstadoCargo = Database["public"]["Enums"]["estado_cargo"];
export type MedioPago = Database["public"]["Enums"]["medio_pago"];
export type EstadoLiquidacion = Database["public"]["Enums"]["estado_liquidacion"];
export type TipoDetalleLiquidacion = Database["public"]["Enums"]["tipo_detalle_liquidacion"];
export type CategoriaDocumento = Database["public"]["Enums"]["categoria_documento"];
export type CategoriaGasto = Database["public"]["Enums"]["categoria_gasto"];
export type EstadoGasto = Database["public"]["Enums"]["estado_gasto"];
export type ResponsableGasto = Database["public"]["Enums"]["responsable_gasto"];
export type EstadoInvitacion = Database["public"]["Enums"]["estado_invitacion"];
export type EstadoSolicitudPago = Database["public"]["Enums"]["estado_solicitud_pago"];
export type EstadoIncidencia = Database["public"]["Enums"]["estado_incidencia"];
export type TipoMovimientoGarantia = Database["public"]["Enums"]["tipo_movimiento_garantia"];
export type TipoMontoObligacion = Database["public"]["Enums"]["tipo_monto_obligacion"];
