-- =============================================================
-- 0041_cargos_nombre.sql
-- Nombre opcional de un cargo (ej. "Luz departamento 907-A"), para que el
-- listado y la ficha de detalle puedan identificar el cobro por algo más
-- legible que "Tipo · Período" cuando el admin quiera darle un nombre propio.
-- No reemplaza la dirección de la propiedad, que se sigue mostrando siempre.
-- =============================================================

alter table public.cargos
  add column nombre text;
