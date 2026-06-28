-- =============================================================
-- 0003_propiedades.sql
-- Módulo Propiedades. Multitenant (empresa_id) + RLS solo admin.
-- La relación con propietarios vive SOLO en la tabla puente (0004).
-- =============================================================

-- ----- Enums --------------------------------------------------
create type public.tipo_propiedad as enum (
  'departamento', 'casa', 'oficina', 'local_comercial',
  'bodega', 'estacionamiento', 'terreno', 'otro'
);

create type public.estado_propiedad as enum (
  'disponible', 'reservada', 'arrendada', 'mantencion', 'inactiva'
);

create type public.moneda as enum ('CLP', 'UF');

-- ----- Tabla propiedades -------------------------------------
create table public.propiedades (
  id                       uuid primary key default gen_random_uuid(),
  empresa_id               uuid not null references public.empresas(id) on delete restrict,
  -- Código interno editable (ej: RUZ-0001). Único por empresa cuando se define.
  codigo_interno           text,
  tipo                     public.tipo_propiedad not null default 'departamento',
  direccion                text not null,
  numero                   text,
  departamento             text,
  comuna                   text,
  region                   text,
  rol_sii                  text,
  dormitorios              integer,
  banos                    integer,
  superficie_util_m2       numeric(10, 2),
  superficie_total_m2      numeric(10, 2),
  estacionamientos         integer,
  bodegas                  integer,
  estado                   public.estado_propiedad not null default 'disponible',
  moneda                   public.moneda not null default 'CLP',
  -- Valor de referencia de la propiedad. El canon real vive en el contrato.
  valor_referencial_arriendo numeric(14, 2),
  gasto_comun_estimado     numeric(14, 2),
  fecha_adquisicion        date,
  observaciones            text,
  -- Disponible internamente (estado) vs publicada en portales externos.
  publicada                boolean not null default false,
  -- Soft-delete (distinto de estado='inactiva').
  activo                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (empresa_id, codigo_interno)
);

create index idx_propiedades_empresa on public.propiedades(empresa_id);
create index idx_propiedades_estado on public.propiedades(empresa_id, estado);

create trigger trg_propiedades_updated
  before update on public.propiedades
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.propiedades enable row level security;

create policy "propiedades_select_admin"
  on public.propiedades for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "propiedades_insert_admin"
  on public.propiedades for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "propiedades_update_admin"
  on public.propiedades for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: sin DELETE (baja lógica con activo = false).
