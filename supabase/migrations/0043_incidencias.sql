-- =============================================================
-- 0043_incidencias.sql
-- Módulo Incidencias: registro de incidencias de mantención/arreglos
-- por propiedad, con proveedor y seguimiento (reportada → agendada →
-- en_proceso → resuelta/cancelada). Multitenant (empresa_id) + RLS
-- solo admin, igual al resto del sistema. No modifica tablas existentes.
--
-- Última modificación: 2026-08-17
-- Notas de diseño:
--   - `propiedad_id` es OBLIGATORIO (toda incidencia se imputa a un inmueble).
--   - `contrato_id` es opcional: puede ocurrir en una propiedad vacante,
--     sin contrato vigente.
--   - `gasto_id` (nullable) registra el gasto generado manualmente desde la
--     incidencia una vez resuelta (vínculo 1:1, no un proceso batch como el
--     de Gastos → Liquidaciones); mientras sea null, la incidencia se puede
--     eliminar sin restricción.
-- =============================================================

create type public.estado_incidencia as enum (
  'reportada',
  'agendada',
  'en_proceso',
  'resuelta',
  'cancelada'
);

create table public.incidencias (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references public.empresas(id) on delete restrict,
  propiedad_id       uuid not null references public.propiedades(id) on delete restrict,
  contrato_id        uuid references public.contratos(id) on delete set null,
  titulo             text not null,
  descripcion        text,
  estado             public.estado_incidencia not null default 'reportada',
  proveedor_nombre   text,
  proveedor_contacto text,
  fecha_reportada    date not null,
  fecha_agendada     date,
  fecha_resuelta     date,
  costo              numeric(14, 2),
  gasto_id           uuid references public.gastos(id) on delete set null,
  observaciones      text,
  creado_por         uuid,
  creado_por_email   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_incidencias_empresa on public.incidencias(empresa_id);
create index idx_incidencias_propiedad on public.incidencias(propiedad_id);
create index idx_incidencias_estado on public.incidencias(empresa_id, estado);

create trigger trg_incidencias_updated
  before update on public.incidencias
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.incidencias enable row level security;

create policy "incidencias_select_admin" on public.incidencias for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "incidencias_insert_admin" on public.incidencias for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "incidencias_update_admin" on public.incidencias for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "incidencias_delete_admin" on public.incidencias for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
