-- =============================================================
-- 0016_gastos.sql
-- Módulo Gastos: fuente oficial de gastos del sistema.
-- Multitenant (empresa_id) + RLS solo admin, igual al resto del sistema.
-- No modifica tablas existentes.
--
-- Última modificación: 2026-07-03
-- Notas de diseño:
--   - `propiedad_id` es OBLIGATORIO (todo gasto se imputa a un inmueble).
--   - `contrato_id`, `propietario_id`, `arrendatario_id`, `liquidacion_id` y
--     `documento_id` son opcionales (trazabilidad y adjunto).
--   - `responsable_pago` define quién asume el gasto. Solo los gastos con
--     responsable 'propietario' (o `descontar_de_liquidacion = true`) afectan
--     la rentabilidad del propietario; los del arrendatario NO.
--   - Preparado para descuento automático en liquidaciones futuras:
--       `descontar_de_liquidacion` marca que debe restarse del pago al dueño;
--       `liquidacion_id` (null = pendiente) registra en qué liquidación se
--       aplicó, evitando duplicar el descuento.
--   - Los reportes financieros consumen esta tabla como única fuente de gastos.
-- =============================================================

create type public.categoria_gasto as enum (
  'mantencion',
  'reparacion',
  'servicios',       -- luz, agua, gas, internet
  'gastos_comunes',
  'contribuciones',
  'seguro',
  'comision',
  'legal',
  'administracion',
  'otro'
);

create type public.estado_gasto as enum ('pendiente', 'pagado', 'anulado');

create type public.responsable_gasto as enum (
  'propietario',
  'arrendatario',
  'corredora'
);

create table public.gastos (
  id                       uuid primary key default gen_random_uuid(),
  empresa_id               uuid not null references public.empresas(id) on delete restrict,
  propiedad_id             uuid not null references public.propiedades(id) on delete restrict,
  contrato_id              uuid references public.contratos(id) on delete set null,
  propietario_id           uuid references public.propietarios(id) on delete set null,
  arrendatario_id          uuid references public.arrendatarios(id) on delete set null,
  liquidacion_id           uuid references public.liquidaciones(id) on delete set null,
  documento_id             uuid references public.documentos(id) on delete set null,
  categoria                public.categoria_gasto not null,
  descripcion              text not null,
  monto                    numeric(14, 2) not null check (monto > 0),
  fecha                    date not null,
  estado                   public.estado_gasto not null default 'pendiente',
  responsable_pago         public.responsable_gasto not null,
  -- Debe descontarse de una liquidación del propietario (afecta rentabilidad).
  descontar_de_liquidacion boolean not null default false,
  observaciones            text,
  creado_por               uuid,
  creado_por_email         text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_gastos_empresa on public.gastos(empresa_id);
create index idx_gastos_propiedad on public.gastos(propiedad_id);
create index idx_gastos_contrato on public.gastos(contrato_id);
create index idx_gastos_propietario on public.gastos(propietario_id);
create index idx_gastos_liquidacion on public.gastos(liquidacion_id);
create index idx_gastos_fecha on public.gastos(empresa_id, fecha);
create index idx_gastos_estado on public.gastos(empresa_id, estado);
create index idx_gastos_categoria on public.gastos(empresa_id, categoria);
-- Acelera la búsqueda de gastos pendientes de descontar en liquidación.
create index idx_gastos_por_descontar on public.gastos(propietario_id)
  where descontar_de_liquidacion and liquidacion_id is null and estado <> 'anulado';

create trigger trg_gastos_updated
  before update on public.gastos
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.gastos enable row level security;

create policy "gastos_select_admin" on public.gastos for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gastos_insert_admin" on public.gastos for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gastos_update_admin" on public.gastos for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "gastos_delete_admin" on public.gastos for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
