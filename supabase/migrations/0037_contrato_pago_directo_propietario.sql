-- =============================================================
-- 0037_contrato_pago_directo_propietario.sql
-- Propósito: definir, por contrato, a qué cuenta transfiere el arrendatario.
--
-- Por defecto el arriendo se paga a la corredora, que después liquida al
-- propietario descontando comisión y administración (flujo de Liquidaciones).
-- En contratos donde la corredora solo administra, el arrendatario transfiere
-- directo al propietario: ahí este flag cambia la cuenta que muestra el
-- estado de cuenta (`empresas.*` vs. los datos bancarios del propietario de
-- la propiedad, que ya existen en `propietarios`).
--
-- `default false` preserva el comportamiento actual de los contratos vigentes
-- — ninguno cambia de destino de pago al aplicar esta migración.
-- Última modificación: 2026-08-03
-- =============================================================

alter table public.contratos
  add column if not exists pago_directo_propietario boolean not null default false;

comment on column public.contratos.pago_directo_propietario is
  'true = el arrendatario transfiere directo al propietario de la propiedad; false (default) = paga a la corredora, que luego liquida al propietario.';
