-- =============================================================
-- 0036_estado_cuenta.sql
-- Propósito: estado de cuenta (informe de deuda) enviable al arrendatario
-- por WhatsApp, en dos formas: PDF descargable (impresión) y link público
-- con token para abrir en el celular sin iniciar sesión.
--
-- 1) Datos bancarios de la corredora en `empresas` — el informe incluye una
--    sección "Cómo regularizar" y esos datos no pueden ir hardcodeados en el
--    código (deben poder cambiarse sin redeploy).
-- 2) `estado_cuenta_links`: tokens públicos por arrendatario. El link NO
--    guarda un snapshot de la deuda — la página lee los cargos vigentes al
--    momento de abrirlo, para que nunca muestre un saldo desactualizado.
--
-- Nota de seguridad: la página pública (`/e/[token]`) NO usa RLS — se sirve
-- con el cliente service_role gateado por el token. Por eso este archivo NO
-- agrega ninguna policy `to anon`, y las policies de `estado_cuenta_links`
-- son admin-only y no consultan otras tablas con RLS (evita el ciclo de
-- recursión que rompió el sistema en 0028 y 0034 — ver PROYECTO.md).
-- Última modificación: 2026-08-03
-- =============================================================

-- ----- 1) Datos bancarios de la corredora --------------------
alter table public.empresas
  add column if not exists banco           text,
  add column if not exists tipo_cuenta     text,
  add column if not exists numero_cuenta   text,
  add column if not exists rut_titular     text,
  add column if not exists titular_nombre  text,
  add column if not exists email_pagos     text;

-- ----- 2) Links públicos de estado de cuenta -----------------
create table if not exists public.estado_cuenta_links (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  arrendatario_id uuid not null references public.arrendatarios(id) on delete cascade,
  -- Token largo aleatorio generado en la app (no adivinable por fuerza bruta).
  token           text not null unique,
  creado_por      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  -- null = sin expiración; se puede acotar al generarlo.
  expira_en       timestamptz,
  revocado        boolean not null default false
);

create index if not exists idx_estado_cuenta_links_token
  on public.estado_cuenta_links(token);
create index if not exists idx_estado_cuenta_links_arrendatario
  on public.estado_cuenta_links(arrendatario_id);

alter table public.estado_cuenta_links enable row level security;

create policy "estado_cuenta_links_select_admin"
  on public.estado_cuenta_links for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "estado_cuenta_links_insert_admin"
  on public.estado_cuenta_links for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "estado_cuenta_links_update_admin"
  on public.estado_cuenta_links for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
