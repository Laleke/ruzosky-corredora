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
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_empresa_id: { Args: Record<string, never>; Returns: string };
      auth_rol: { Args: Record<string, never>; Returns: RolUsuario };
    };
    Enums: {
      rol_usuario: RolUsuario;
    };
  };
};
