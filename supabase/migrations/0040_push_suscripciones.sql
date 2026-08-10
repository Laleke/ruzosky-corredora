-- =============================================================
-- 0040_push_suscripciones.sql
-- Propósito: guardar las suscripciones Web Push de cada usuario para avisarle
-- al admin cuando un arrendatario informa un pago (antes solo se enteraba si
-- entraba a /cobros y veía el banner — ver deuda técnica "sin notificación
-- proactiva").
--
-- El endpoint es único: si el navegador renueva la suscripción, el upsert por
-- endpoint evita duplicados que provocarían notificaciones repetidas.
--
-- Nota de RLS: las policies son solo sobre la propia fila (`profile_id =
-- auth.uid()`) y NO consultan otras tablas — el envío corre con service_role.
-- Deliberado: cualquier `exists` hacia profiles/empresas acá podría reabrir el
-- ciclo de recursión que ya tumbó el sistema en 0028 y 0035.
-- Última modificación: 2026-08-07
-- =============================================================

create table if not exists public.push_suscripciones (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete restrict,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_push_susc_profile on public.push_suscripciones(profile_id);
create index if not exists idx_push_susc_empresa on public.push_suscripciones(empresa_id);

alter table public.push_suscripciones enable row level security;

create policy "push_susc_select_propia"
  on public.push_suscripciones for select
  to authenticated
  using (profile_id = auth.uid());

create policy "push_susc_insert_propia"
  on public.push_suscripciones for insert
  to authenticated
  with check (profile_id = auth.uid() and empresa_id = public.auth_empresa_id());

create policy "push_susc_update_propia"
  on public.push_suscripciones for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "push_susc_delete_propia"
  on public.push_suscripciones for delete
  to authenticated
  using (profile_id = auth.uid());
