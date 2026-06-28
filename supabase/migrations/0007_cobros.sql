-- =============================================================
-- 0007_cobros.sql
-- Motor de cobros: cargos (deuda) + pagos (abonos).
-- La deuda existe antes del pago. Soporta pagos parciales.
-- Reajuste NO automático en MVP (se guarda info contractual aparte).
-- Multitenant (empresa_id) + RLS solo admin.
-- =============================================================

create type public.tipo_cargo as enum (
  'arriendo', 'gasto_comun', 'administracion', 'multa', 'ajuste', 'otro'
);
-- 'vencido' existe para uso futuro; el MVP lo deriva en lectura (no se almacena).
create type public.estado_cargo as enum (
  'pendiente', 'parcial', 'pagado', 'vencido'
);
create type public.medio_pago as enum (
  'transferencia', 'efectivo', 'cheque', 'tarjeta', 'otro'
);

-- ----- Tabla cargos (deuda) ----------------------------------
create table public.cargos (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete restrict,
  contrato_id       uuid not null references public.contratos(id) on delete restrict,
  -- Periodo del cargo: primer día del mes (ej: 2026-07-01).
  periodo           date not null,
  tipo_cargo        public.tipo_cargo not null default 'arriendo',
  fecha_emision     date not null,
  fecha_vencimiento date,
  monto             numeric(14, 2) not null check (monto > 0),
  estado            public.estado_cargo not null default 'pendiente',
  -- Saldo por cobrar; se recalcula al registrar/eliminar pagos.
  saldo_pendiente   numeric(14, 2) not null,
  observaciones     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Evita duplicar el mismo cargo (ej: dos arriendos del mismo mes).
  unique (contrato_id, periodo, tipo_cargo)
);

create index idx_cargos_empresa on public.cargos(empresa_id);
create index idx_cargos_contrato on public.cargos(contrato_id);
create index idx_cargos_estado on public.cargos(empresa_id, estado);

create trigger trg_cargos_updated
  before update on public.cargos
  for each row execute function public.set_updated_at();

-- ----- Tabla pagos (abonos) ----------------------------------
create table public.pagos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete restrict,
  cargo_id      uuid not null references public.cargos(id) on delete cascade,
  fecha_pago    date not null,
  monto_pagado  numeric(14, 2) not null check (monto_pagado > 0),
  medio_pago    public.medio_pago,
  referencia    text,
  observaciones text,
  created_at    timestamptz not null default now()
);

create index idx_pagos_empresa on public.pagos(empresa_id);
create index idx_pagos_cargo on public.pagos(cargo_id);

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.cargos enable row level security;

create policy "cargos_select_admin"
  on public.cargos for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cargos_insert_admin"
  on public.cargos for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cargos_update_admin"
  on public.cargos for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cargos_delete_admin"
  on public.cargos for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.pagos enable row level security;

create policy "pagos_select_admin"
  on public.pagos for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "pagos_insert_admin"
  on public.pagos for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "pagos_delete_admin"
  on public.pagos for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: saldo_pendiente y estado se recalculan en la capa de aplicación al
--       registrar/eliminar pagos (suma de abonos). 'vencido' se deriva en
--       lectura (fecha_vencimiento < hoy y saldo > 0), no se almacena en MVP.
