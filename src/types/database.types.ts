/**
 * Tipos de la base de datos Supabase.
 *
 * Este archivo es un STUB temporal. Una vez creado el proyecto en Supabase y
 * aplicada la migración inicial, regenerar con:
 *
 *   npm run types:gen
 *
 * (requiere `supabase login` y `supabase link --project-ref <ref>`).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
