-- =============================================================
-- 0001_tenancy_auth.sql
-- Fundación multitenant + perfiles de usuario + RLS.
-- NO contiene tablas de negocio (propiedades, contratos, etc.).
-- =============================================================

-- ----- Enum de roles -----------------------------------------
create type public.rol_usuario as enum ('admin', 'propietario', 'arrendatario');

-- ----- Empresas (tenants) ------------------------------------
create table public.empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  rut         text unique,
  activa      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----- Perfiles (extiende auth.users) ------------------------
-- 1:1 con auth.users. Define a qué empresa pertenece el usuario y su rol.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid not null references public.empresas(id) on delete restrict,
  nombre      text,
  email       text,
  rol         public.rol_usuario not null default 'arrendatario',
  created_at  timestamptz not null default now()
);

create index idx_profiles_empresa_id on public.profiles(empresa_id);
create index idx_profiles_rol on public.profiles(rol);

-- ----- Helpers para usar en políticas RLS --------------------
-- Devuelven el tenant y rol del usuario autenticado leyendo su profile.
-- SECURITY DEFINER + search_path fijo para evitar recursión de RLS y escalada.

create or replace function public.auth_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_rol()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- ----- RLS: empresas -----------------------------------------
alter table public.empresas enable row level security;

-- Un usuario solo ve su propia empresa.
create policy "empresas_select_propia"
  on public.empresas for select
  to authenticated
  using (id = public.auth_empresa_id());

-- Solo admin puede actualizar datos de su empresa.
create policy "empresas_update_admin"
  on public.empresas for update
  to authenticated
  using (id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- ----- RLS: profiles -----------------------------------------
alter table public.profiles enable row level security;

-- Cada usuario lee su propio perfil; el admin lee todos los de su empresa.
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  );

-- Solo admin crea/edita perfiles dentro de su empresa.
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- =============================================================
-- NOTA DE BOOTSTRAP (primer admin / primera empresa):
-- El primer registro NO puede pasar por estas políticas (no existe profile
-- previo del que leer empresa_id/rol). Crear empresa + primer admin desde el
-- SQL editor de Supabase con service_role, o vía una Edge Function de
-- onboarding. Documentar el procedimiento elegido en PROYECTO.md.
-- =============================================================
