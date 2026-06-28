-- =============================================================
-- 0008_propiedad_codigo_auto.sql
-- Permite guardar propiedades incompletas: la dirección deja de ser
-- obligatoria. El código interno se genera automáticamente en la app
-- (formato: 2 iniciales comuna + 1 inicial tipo + correlativo) y no se edita.
-- =============================================================

alter table public.propiedades
  alter column direccion drop not null;

-- NOTA: el código interno se genera en la capa de aplicación al crear la
-- propiedad (requiere comuna + tipo). Sigue siendo unique(empresa_id, codigo_interno).
