-- =============================================================
-- 0038_cargo_pago_directo_servicio.sql
-- Propósito: distinguir, por cargo, si el arrendatario transfiere el dinero
-- (a la corredora o al propietario) o si paga directo a la empresa de
-- servicios (luz, agua, internet, gastos comunes del edificio).
--
-- Impacto en el estado de cuenta: los cargos de pago directo NO suman al total
-- a transferir — se informan en una sección aparte, porque exigirle una
-- transferencia por algo que ya pagó en la cuenta del servicio sería un error
-- de cobranza. El total transferible y el total de pagos directos se muestran
-- separados.
--
-- `default false` preserva el comportamiento actual: todos los cargos ya
-- existentes siguen contando como transferencia.
-- Última modificación: 2026-08-07
-- =============================================================

alter table public.cargos
  add column if not exists pago_directo_servicio boolean not null default false;

comment on column public.cargos.pago_directo_servicio is
  'true = el arrendatario paga este cargo directo a la empresa de servicios (no suma al total a transferir del estado de cuenta); false (default) = se le cobra y transfiere a la corredora/propietario.';
