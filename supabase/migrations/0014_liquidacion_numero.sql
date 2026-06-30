-- =============================================================
-- 0014_liquidacion_numero.sql  (Entregable 5)
-- Numeración correlativa visible: LIQ-AAAA-000001, única por empresa.
-- =============================================================

alter table public.liquidaciones
  add column if not exists numero text;

create unique index if not exists uq_liquidacion_numero
  on public.liquidaciones(empresa_id, numero)
  where numero is not null;
