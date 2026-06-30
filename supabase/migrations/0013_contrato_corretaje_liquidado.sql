-- =============================================================
-- 0013_contrato_corretaje_liquidado.sql  (Entregable 3)
-- Control de corretaje: se liquida una sola vez por contrato.
-- =============================================================

alter table public.contratos
  add column if not exists corretaje_liquidado boolean not null default false;
