-- =============================================================
-- 0045_gasto_obligaciones.sql
-- Gastos Fase 2: responsabilidad compartida + pago en cuotas.
-- Modelo de dos niveles sobre `gastos` (cabecera, sin cambios):
--   gasto_obligaciones        -> quién paga y qué proporción/monto.
--   gasto_obligaciones_cuotas -> en qué partes se cobra esa obligación,
--                                cada una con su propio estado y
--                                asociación a liquidación.
--
-- No modifica ni elimina columnas de `gastos`. Las columnas legacy
-- (`responsable_pago`, `descontar_de_liquidacion`, `liquidacion_id` en
-- `gastos`) quedan deprecadas — el código deja de escribirlas/leerlas,
-- pero se eliminan recién en una migración de limpieza posterior, tras
-- validar este cambio en producción.
--
-- Alcance: esta fase solo cubre la asociación a Liquidaciones de
-- propietario (lo que ya existe). La asociación a un cobro/cargo de
-- arrendatario queda fuera a propósito, para no diseñar sobre un
-- modelo no confirmado.
--
-- Backfill: cada gasto existente genera 1 obligación (100%, responsable
-- = responsable_pago actual) con 1 cuota (monto total, mismo estado y
-- liquidacion_id que tenía el gasto).
--
-- Última modificación: 2026-08-26
-- =============================================================

begin;

create type public.tipo_monto_obligacion as enum ('porcentaje', 'monto_fijo');

-- ----- gasto_obligaciones ------------------------------------
-- Una fila por responsable involucrado en el gasto (máx. 1 por
-- responsable y gasto). propiedad_id / propietario_id / fecha_gasto son
-- una FOTO tomada de `gastos` al crear la obligación: permiten filtrar
-- "cuotas descontables de un propietario en un período" sin encadenar
-- dos joins en la query caliente de liquidaciones. Se recalculan solo
-- cuando se reescribe el reparto completo (gasto "libre", ver regla de
-- edición documentada en PROYECTO.md).
create table public.gasto_obligaciones (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete restrict,
  gasto_id         uuid not null references public.gastos(id) on delete cascade,
  responsable      public.responsable_gasto not null,
  tipo_monto       public.tipo_monto_obligacion not null,
  -- Si tipo_monto = 'porcentaje': valor en 0-100 (dos decimales).
  -- Si tipo_monto = 'monto_fijo': valor en CLP, > 0.
  valor            numeric(14, 2) not null check (valor > 0),
  -- Monto resuelto en CLP (si es porcentaje, = gastos.monto * valor / 100).
  -- Se guarda calculado para no repetir la conversión en cada query y
  -- porque es lo que efectivamente se reparte en cuotas.
  monto_calculado  numeric(14, 2) not null check (monto_calculado > 0),
  propiedad_id     uuid not null references public.propiedades(id) on delete restrict,
  propietario_id   uuid references public.propietarios(id) on delete set null,
  fecha_gasto      date not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_gasto_obligaciones_pct
    check (tipo_monto <> 'porcentaje' or valor <= 100)
);

-- Un responsable no puede aparecer dos veces en el mismo gasto.
create unique index uq_gasto_obligaciones_gasto_responsable
  on public.gasto_obligaciones(gasto_id, responsable);

create index idx_gasto_obligaciones_empresa on public.gasto_obligaciones(empresa_id);
create index idx_gasto_obligaciones_gasto on public.gasto_obligaciones(gasto_id);
-- Acelera "cuotas descontables de un propietario": filtra por propiedad
-- + responsable sin tocar `gastos`.
create index idx_gasto_obligaciones_por_descontar
  on public.gasto_obligaciones(propiedad_id, propietario_id)
  where responsable = 'propietario';

create trigger trg_gasto_obligaciones_updated
  before update on public.gasto_obligaciones
  for each row execute function public.set_updated_at();

-- ----- gasto_obligaciones_cuotas -------------------------------
create table public.gasto_obligaciones_cuotas (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references public.empresas(id) on delete restrict,
  obligacion_id      uuid not null references public.gasto_obligaciones(id) on delete cascade,
  numero_cuota       integer not null default 1 check (numero_cuota > 0),
  monto              numeric(14, 2) not null check (monto > 0),
  fecha_vencimiento  date,
  estado             public.estado_gasto not null default 'pendiente',
  -- Liquidación de propietario donde se descontó esta cuota específica
  -- (null = pendiente de asociar). Reemplaza a gastos.liquidacion_id.
  liquidacion_id     uuid references public.liquidaciones(id) on delete set null,
  -- Comprobante propio de esta cuota (puede diferir del comprobante del
  -- gasto cabecera si cada cuota se paga con boleta separada).
  documento_id       uuid references public.documentos(id) on delete set null,
  observaciones      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index uq_cuotas_obligacion_numero
  on public.gasto_obligaciones_cuotas(obligacion_id, numero_cuota);

create index idx_cuotas_empresa on public.gasto_obligaciones_cuotas(empresa_id);
create index idx_cuotas_obligacion on public.gasto_obligaciones_cuotas(obligacion_id);
create index idx_cuotas_liquidacion on public.gasto_obligaciones_cuotas(liquidacion_id);
-- Acelera "cuotas pendientes y no reclamadas" (equivalente a
-- idx_gastos_por_descontar de 0016, ahora a nivel de cuota).
create index idx_cuotas_pendientes
  on public.gasto_obligaciones_cuotas(obligacion_id)
  where estado = 'pendiente' and liquidacion_id is null;

create trigger trg_cuotas_updated
  before update on public.gasto_obligaciones_cuotas
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa (igual patrón que 0016) ----
-- Ninguna policy consulta otra tabla con RLS propia (solo
-- auth_empresa_id()/auth_rol(), ambas security definer): no hay riesgo
-- de recursión como el documentado en 0028/0035.
alter table public.gasto_obligaciones enable row level security;

create policy "gasto_obligaciones_select_admin" on public.gasto_obligaciones
  for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gasto_obligaciones_insert_admin" on public.gasto_obligaciones
  for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gasto_obligaciones_update_admin" on public.gasto_obligaciones
  for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gasto_obligaciones_delete_admin" on public.gasto_obligaciones
  for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.gasto_obligaciones_cuotas enable row level security;

create policy "cuotas_select_admin" on public.gasto_obligaciones_cuotas
  for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cuotas_insert_admin" on public.gasto_obligaciones_cuotas
  for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cuotas_update_admin" on public.gasto_obligaciones_cuotas
  for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "cuotas_delete_admin" on public.gasto_obligaciones_cuotas
  for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- ----- Backfill: 1 obligación (100%) + 1 cuota por gasto existente ----
insert into public.gasto_obligaciones
  (id, empresa_id, gasto_id, responsable, tipo_monto, valor, monto_calculado,
   propiedad_id, propietario_id, fecha_gasto, created_at, updated_at)
select
  gen_random_uuid(), g.empresa_id, g.id, g.responsable_pago,
  'porcentaje', 100, g.monto,
  g.propiedad_id, g.propietario_id, g.fecha, g.created_at, g.updated_at
from public.gastos g;

insert into public.gasto_obligaciones_cuotas
  (id, empresa_id, obligacion_id, numero_cuota, monto, fecha_vencimiento,
   estado, liquidacion_id, documento_id, created_at, updated_at)
select
  gen_random_uuid(), o.empresa_id, o.id, 1, g.monto, g.fecha,
  g.estado, g.liquidacion_id, g.documento_id, g.created_at, g.updated_at
from public.gasto_obligaciones o
join public.gastos g on g.id = o.gasto_id;

commit;
