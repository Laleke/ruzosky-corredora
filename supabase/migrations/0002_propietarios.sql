-- =============================================================
-- 0002_propietarios.sql
-- Módulo Propietarios. Multitenant (empresa_id) + RLS solo admin.
-- =============================================================

-- ----- Función compartida para mantener updated_at -----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----- Enums --------------------------------------------------
create type public.tipo_persona as enum ('persona_natural', 'persona_juridica');
create type public.tipo_cuenta_bancaria as enum ('corriente', 'vista', 'ahorro', 'rut');

-- ----- Tabla propietarios ------------------------------------
create table public.propietarios (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  tipo_persona    public.tipo_persona not null default 'persona_natural',
  -- RUT normalizado: cuerpo + dígito verificador, sin puntos, con guión (ej: 12345678-9).
  rut             text not null,
  nombre          text,
  apellido        text,
  razon_social    text,
  email           text,
  telefono        text,
  direccion       text,
  comuna          text,
  region          text,
  -- Datos bancarios para liquidaciones al propietario.
  banco           text,
  tipo_cuenta     public.tipo_cuenta_bancaria,
  numero_cuenta   text,
  titular_cuenta  text,
  rut_titular     text,
  -- Soft-delete (distinto de cualquier estado operativo).
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- RUT único dentro de la empresa, no global (multitenant).
  unique (empresa_id, rut)
);

create index idx_propietarios_empresa on public.propietarios(empresa_id);

create trigger trg_propietarios_updated
  before update on public.propietarios
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.propietarios enable row level security;

create policy "propietarios_select_admin"
  on public.propietarios for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "propietarios_insert_admin"
  on public.propietarios for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "propietarios_update_admin"
  on public.propietarios for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: sin política DELETE a propósito. La baja es lógica (activo = false).
-- NOTA: cuando exista portal del propietario, agregar política de select que
-- ligue propietarios a su profile (ej: columna profile_id + auth.uid()).
