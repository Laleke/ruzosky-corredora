-- =============================================================
-- 0023_contrato_fecha_proximo_reajuste.sql
-- Fecha exacta del próximo reajuste a REVISAR (no a aplicar solo).
-- Reemplaza la idea de "cron ciego cada N meses": cada contrato tiene su
-- propia regla real (ver observaciones/contrato firmado), y al llegar la
-- fecha el admin decide aplicar o postergar — nunca se aplica automático
-- sin revisión, porque puede haber un arreglo informal con el arrendatario.
-- =============================================================

alter table public.contratos
  add column if not exists fecha_proximo_reajuste date;
