-- =============================================================
-- 0030_solicitudes_pago_excede_saldo.sql
-- El arrendatario puede informar un pago mayor al saldo pendiente del cargo
-- (no se bloquea — puede ser un abono adelantado o un error a corregir).
-- Se marca para que el propietario/admin la revise con más cuidado al
-- aprobar. El saldo se guarda como snapshot al momento de crear la
-- solicitud (el saldo real del cargo puede cambiar después).
-- =============================================================

alter table public.solicitudes_pago
  add column excede_saldo boolean not null default false,
  add column saldo_pendiente_al_crear numeric(14, 2);
