-- =============================================================
-- 0044_recordatorios.sql
-- Módulo Recordatorios: reglas de aviso recurrentes ("cargar luz",
-- "cargar GGCC", etc.) que un cron diario evalúa contra los contratos
-- activos y notifica por push SOLO cuando falta el cargo del mes en
-- curso. Multitenant (empresa_id) + RLS solo admin, igual al resto
-- del sistema. No modifica tablas existentes.
--
-- Última modificación: 2026-08-25
-- Notas de diseño:
--   - `dia_mes_aviso` (1-28, se evita 29-31 para no depender de meses
--     cortos) es el día desde el cual el cron empieza a avisar si el
--     cargo de `tipo_cargo` sigue sin generarse ese mes — no es una
--     fecha única, es un umbral: si al día X sigue faltando, avisa
--     todos los días hasta que se genere el cargo o termine el mes.
--   - `ultima_notificacion_en` evita que el cron mande más de un push
--     por día para el mismo recordatorio (idempotencia ante reintentos
--     o ejecuciones duplicadas del cron).
--   - El recordatorio aplica a TODOS los contratos activos de la
--     empresa (vigente/renovado) — no hay selección de propiedades al
--     crearlo, coherente con el patrón ya existente de "contratos sin
--     arriendo generado".
-- =============================================================

create table public.recordatorios (
  id                     uuid primary key default gen_random_uuid(),
  empresa_id             uuid not null references public.empresas(id) on delete restrict,
  tipo_cargo             public.tipo_cargo not null,
  nombre                 text,
  dia_mes_aviso          smallint not null check (dia_mes_aviso between 1 and 28),
  activo                 boolean not null default true,
  ultima_notificacion_en date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_recordatorios_empresa on public.recordatorios(empresa_id);
create index idx_recordatorios_activo on public.recordatorios(empresa_id, activo);

create trigger trg_recordatorios_updated
  before update on public.recordatorios
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.recordatorios enable row level security;

create policy "recordatorios_select_admin" on public.recordatorios for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "recordatorios_insert_admin" on public.recordatorios for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "recordatorios_update_admin" on public.recordatorios for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "recordatorios_delete_admin" on public.recordatorios for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
