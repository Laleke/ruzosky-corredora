-- =============================================================
-- 0005_arrendatarios.sql
-- Módulo Arrendatarios. Similar a propietarios pero más simple
-- (sin datos bancarios). Reutiliza el enum tipo_persona (0002).
-- Multitenant (empresa_id) + RLS solo admin.
-- =============================================================

create table public.arrendatarios (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  tipo_persona    public.tipo_persona not null default 'persona_natural',
  -- RUT normalizado cuerpo-dv sin puntos (ej: 12345678-9).
  rut             text not null,
  nombre          text,
  apellido        text,
  razon_social    text,
  email           text,
  telefono        text,
  direccion       text,
  comuna          text,
  region          text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (empresa_id, rut)
);

create index idx_arrendatarios_empresa on public.arrendatarios(empresa_id);

create trigger trg_arrendatarios_updated
  before update on public.arrendatarios
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.arrendatarios enable row level security;

create policy "arrendatarios_select_admin"
  on public.arrendatarios for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "arrendatarios_insert_admin"
  on public.arrendatarios for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "arrendatarios_update_admin"
  on public.arrendatarios for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: sin DELETE (baja lógica con activo = false).
-- NOTA: portal del arrendatario se resolverá luego con políticas específicas.
