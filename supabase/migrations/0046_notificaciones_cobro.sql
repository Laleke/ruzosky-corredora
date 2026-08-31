-- =============================================================
-- 0046_notificaciones_cobro.sql
-- Aviso por email al arrendatario sobre un cargo (cobro) pendiente: N días
-- antes del vencimiento (informativo) y/o N días después (vencido). Config
-- por defecto a nivel empresa, con override opcional por contrato (fila con
-- contrato_id no nulo). Multitenant + RLS solo admin, igual al resto.
--
-- Última modificación: 2026-08-31
-- Notas de diseño:
--   - dias_antes/dias_despues nulos = ese aviso queda desactivado (no se
--     obliga a configurar ambos).
--   - hora_envio es orientativa: el cron (ver vercel.json) corre 1 vez al
--     día en el plan Vercel Hobby actual — no hay forma de despachar a la
--     hora exacta configurada hasta que se suba a un plan con cron más
--     frecuente. Se deja el campo para no perder el dato y para cuando se
--     resuelva esa limitación (ver [DEUDA] en PROYECTO.md).
--   - notificaciones_cobro_log es la trazabilidad exigida para toda
--     comunicación externa (ver CLAUDE.md) y además da la idempotencia:
--     un mismo (cargo, arrendatario, tipo) no se reenvía dos veces una vez
--     registrado como 'enviado'.
-- =============================================================

create table public.config_notificaciones_cobro (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  -- null = configuración por defecto de la empresa; no nulo = override de un contrato puntual.
  contrato_id   uuid references public.contratos(id) on delete cascade,
  dias_antes    smallint check (dias_antes is null or dias_antes > 0),
  dias_despues  smallint check (dias_despues is null or dias_despues > 0),
  hora_envio    time not null default '09:00',
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Una sola fila default por empresa, una sola fila override por contrato.
create unique index uq_config_notif_cobro_default
  on public.config_notificaciones_cobro(empresa_id)
  where contrato_id is null;
create unique index uq_config_notif_cobro_contrato
  on public.config_notificaciones_cobro(contrato_id)
  where contrato_id is not null;

create index idx_config_notif_cobro_empresa on public.config_notificaciones_cobro(empresa_id);

create trigger trg_config_notif_cobro_updated
  before update on public.config_notificaciones_cobro
  for each row execute function public.set_updated_at();

alter table public.config_notificaciones_cobro enable row level security;

create policy "config_notif_cobro_select_admin" on public.config_notificaciones_cobro for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "config_notif_cobro_insert_admin" on public.config_notificaciones_cobro for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "config_notif_cobro_update_admin" on public.config_notificaciones_cobro for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "config_notif_cobro_delete_admin" on public.config_notificaciones_cobro for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- ----- Log de envíos (trazabilidad + idempotencia) ------------
create table public.notificaciones_cobro_log (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cargo_id        uuid not null references public.cargos(id) on delete cascade,
  arrendatario_id uuid not null references public.arrendatarios(id) on delete cascade,
  tipo            text not null check (tipo in ('antes_vencimiento', 'vencido')),
  email_destino   text not null,
  estado          text not null check (estado in ('enviado', 'error')),
  error_detalle   text,
  enviado_en      timestamptz not null default now()
);

-- Idempotencia: un mismo aviso 'enviado' no se repite para el mismo
-- cargo+arrendatario+tipo. Los 'error' no bloquean (el cron reintenta al
-- día siguiente).
create unique index uq_notif_cobro_log_enviado
  on public.notificaciones_cobro_log(cargo_id, arrendatario_id, tipo)
  where estado = 'enviado';

create index idx_notif_cobro_log_empresa on public.notificaciones_cobro_log(empresa_id, enviado_en desc);
create index idx_notif_cobro_log_cargo on public.notificaciones_cobro_log(cargo_id);

alter table public.notificaciones_cobro_log enable row level security;

-- Solo lectura para admin (auditoría/soporte). El INSERT lo hace el cron vía
-- service_role (sin sesión de usuario) — mismo criterio que push_suscripciones
-- (0040): ninguna policy de insert/update/delete para 'authenticated'.
create policy "notif_cobro_log_select_admin" on public.notificaciones_cobro_log for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
