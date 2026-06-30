-- =============================================================
-- 0011_liquidaciones.sql
-- Módulo Liquidaciones a propietarios + auditoría.
-- Multitenant (empresa_id) + RLS solo admin, igual al resto del sistema.
-- No modifica tablas existentes.
-- =============================================================

create type public.estado_liquidacion as enum ('pendiente', 'pagada', 'anulada');
create type public.tipo_detalle_liquidacion as enum ('ingreso', 'descuento');

-- ----- Liquidaciones -----------------------------------------
create table public.liquidaciones (
  id                   uuid primary key default gen_random_uuid(),
  empresa_id           uuid not null references public.empresas(id) on delete restrict,
  propietario_id       uuid not null references public.propietarios(id) on delete restrict,
  periodo              date not null,            -- primer día del mes liquidado
  fecha_generacion     date not null,
  subtotal_ingresos    numeric(14, 2) not null default 0,
  subtotal_descuentos  numeric(14, 2) not null default 0,
  total_liquidacion    numeric(14, 2) not null default 0,
  estado               public.estado_liquidacion not null default 'pendiente',
  observaciones        text,
  -- Registro de pago (entregable 6) + estructura para comprobante futuro.
  fecha_pago           date,
  pago_observacion     text,
  comprobante_url      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_liquidaciones_empresa on public.liquidaciones(empresa_id);
create index idx_liquidaciones_propietario on public.liquidaciones(propietario_id);
create index idx_liquidaciones_periodo on public.liquidaciones(empresa_id, periodo);

-- Evita liquidaciones duplicadas (propietario+periodo) salvo que estén anuladas.
create unique index uq_liquidacion_vigente
  on public.liquidaciones(empresa_id, propietario_id, periodo)
  where estado <> 'anulada';

create trigger trg_liquidaciones_updated
  before update on public.liquidaciones
  for each row execute function public.set_updated_at();

-- ----- Detalles de liquidación -------------------------------
create table public.liquidacion_detalles (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  liquidacion_id  uuid not null references public.liquidaciones(id) on delete cascade,
  tipo            public.tipo_detalle_liquidacion not null,
  concepto        text not null,
  referencia_tipo text,                 -- ej: 'cargo', 'contrato', 'manual'
  referencia_id   uuid,
  monto           numeric(14, 2) not null check (monto >= 0),
  created_at      timestamptz not null default now()
);

create index idx_liq_detalles_liquidacion on public.liquidacion_detalles(liquidacion_id);
create index idx_liq_detalles_empresa on public.liquidacion_detalles(empresa_id);

-- ----- Auditoría (genérica, multitenant) ---------------------
create table public.auditoria (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete restrict,
  usuario_id    uuid,
  usuario_email text,
  accion        text not null,
  entidad_tipo  text not null,
  entidad_id    uuid,
  datos         jsonb,
  created_at    timestamptz not null default now()
);

create index idx_auditoria_empresa on public.auditoria(empresa_id);
create index idx_auditoria_entidad on public.auditoria(empresa_id, entidad_tipo, entidad_id);

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.liquidaciones enable row level security;
create policy "liquidaciones_select_admin" on public.liquidaciones for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "liquidaciones_insert_admin" on public.liquidaciones for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "liquidaciones_update_admin" on public.liquidaciones for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.liquidacion_detalles enable row level security;
create policy "liq_detalles_select_admin" on public.liquidacion_detalles for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "liq_detalles_insert_admin" on public.liquidacion_detalles for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.auditoria enable row level security;
create policy "auditoria_select_admin" on public.auditoria for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "auditoria_insert_admin" on public.auditoria for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: la anulación es lógica (estado='anulada'). El cálculo de montos se
-- realiza en la capa de aplicación; los detalles dejan trazabilidad por línea.
