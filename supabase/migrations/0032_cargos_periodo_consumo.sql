-- =============================================================
-- 0032_cargos_periodo_consumo.sql
-- Cargos "desfazados" (gasto_comun, luz, agua, internet): el período de
-- consumo real (ej. boleta de luz 06/06–06/07) no coincide con el mes en
-- que se cobra/vence (`periodo` sigue siendo el mes de cobro, no cambia).
-- Se guarda como fechas estructuradas (no texto libre en observaciones,
-- para no depender de que alguien lo escriba bien cada vez).
-- =============================================================

alter table public.cargos
  add column fecha_consumo_desde date,
  add column fecha_consumo_hasta date;
