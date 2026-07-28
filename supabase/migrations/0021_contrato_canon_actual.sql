-- =============================================================
-- 0021_contrato_canon_actual.sql
-- canon_monto queda fijo como el monto original pactado en el contrato.
-- canon_actual es el monto vigente hoy (tras reajustes IPC/UF aplicados
-- manualmente) — la transferencia real a realizar cada período.
-- Se inicializa igual al canon_monto existente.
-- =============================================================

alter table public.contratos
  add column if not exists canon_actual numeric(14, 2);

update public.contratos
  set canon_actual = canon_monto
  where canon_actual is null;
