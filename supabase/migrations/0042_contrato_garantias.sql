-- =============================================================
-- 0042_contrato_garantias.sql
-- Historial de movimientos de garantía por contrato (recepción,
-- retención parcial, devolución). Multitenant (empresa_id) + RLS
-- solo admin, igual al resto del sistema. No modifica tablas existentes.
--
-- Última modificación: 2026-08-17
-- Notas de diseño:
--   - Sin columna de saldo: el saldo disponible se calcula siempre en
--     la query (suma de 'recepcion' - 'retencion' - 'devolucion'), nunca
--     se guarda un total redundante que se pueda desincronizar.
--   - La validación de que 'retencion'/'devolucion' no superen el saldo
--     disponible se hace en la capa de servicio (server action), no acá.
-- =============================================================

create type public.tipo_movimiento_garantia as enum (
  'recepcion',
  'retencion',
  'devolucion'
);

create table public.contrato_garantias (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete restrict,
  contrato_id      uuid not null references public.contratos(id) on delete restrict,
  tipo_movimiento  public.tipo_movimiento_garantia not null,
  monto            numeric(14, 2) not null check (monto > 0),
  fecha            date not null,
  motivo           text,
  creado_por       uuid,
  creado_por_email text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_contrato_garantias_empresa on public.contrato_garantias(empresa_id);
create index idx_contrato_garantias_contrato on public.contrato_garantias(contrato_id);

create trigger trg_contrato_garantias_updated
  before update on public.contrato_garantias
  for each row execute function public.set_updated_at();

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.contrato_garantias enable row level security;

create policy "contrato_garantias_select_admin" on public.contrato_garantias for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "contrato_garantias_insert_admin" on public.contrato_garantias for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "contrato_garantias_update_admin" on public.contrato_garantias for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "contrato_garantias_delete_admin" on public.contrato_garantias for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
