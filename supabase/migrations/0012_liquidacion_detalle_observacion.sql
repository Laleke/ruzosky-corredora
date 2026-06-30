-- =============================================================
-- 0012_liquidacion_detalle_observacion.sql  (Entregable 1)
-- Observación opcional por línea de detalle (para ajustes manuales).
-- =============================================================

alter table public.liquidacion_detalles
  add column if not exists observacion text;
