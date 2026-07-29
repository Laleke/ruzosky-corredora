-- =============================================================
-- 0022_contrato_canon_uf_base.sql
-- Canon fijo en UF para contratos con reajuste_tipo = 'UF'. Permite
-- recalcular canon_actual automáticamente contra el valor de UF vigente
-- (fuente: mindicador.cl), en vez de actualizarlo a mano cada trimestre.
-- canon_uf_base se calcula UNA vez como canon_monto / UF a la fecha real
-- de origen del contrato (puede no coincidir con fecha_inicio si el
-- contrato es continuación de uno anterior — ver observaciones).
-- =============================================================

alter table public.contratos
  add column if not exists canon_uf_base numeric(10, 4);
