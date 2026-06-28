-- =============================================================
-- 0006_contratos.sql
-- Módulo Contratos (núcleo del negocio) + tabla puente con arrendatarios.
-- 1 contrato = 1 propiedad + N arrendatarios.
-- Sincronización propiedad<->contrato se maneja en la capa de aplicación.
-- Multitenant (empresa_id) + RLS solo admin.
-- =============================================================

-- ----- Enums --------------------------------------------------
create type public.reajuste_tipo as enum ('sin_reajuste', 'IPC', 'UF');
create type public.tipo_comision as enum ('porcentaje', 'monto_fijo');
create type public.estado_contrato as enum (
  'borrador', 'vigente', 'vencido', 'terminado', 'renovado'
);

-- ----- Tabla contratos ---------------------------------------
create table public.contratos (
  id                          uuid primary key default gen_random_uuid(),
  empresa_id                  uuid not null references public.empresas(id) on delete restrict,
  -- Número editable por admin (nomenclatura propia / histórica). Único por empresa.
  numero_contrato             text,
  propiedad_id                uuid not null references public.propiedades(id) on delete restrict,
  fecha_firma                 date,
  fecha_inicio                date not null,
  fecha_termino               date,
  -- Canon: fuente de verdad del valor, independiente del valor referencial de la propiedad.
  canon_monto                 numeric(14, 2) not null,
  canon_moneda                public.moneda not null default 'CLP',
  reajuste_tipo               public.reajuste_tipo not null default 'sin_reajuste',
  periodicidad_reajuste_meses integer,
  tipo_comision               public.tipo_comision,
  comision_monto              numeric(14, 2),
  cobra_administracion        boolean not null default false,
  administracion_monto        numeric(14, 2),
  administracion_porcentaje   numeric(5, 2),
  estado                      public.estado_contrato not null default 'borrador',
  observaciones               text,
  activo                      boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (empresa_id, numero_contrato)
);

create index idx_contratos_empresa on public.contratos(empresa_id);
create index idx_contratos_propiedad on public.contratos(propiedad_id);
-- Acelera la búsqueda de "contrato activo por propiedad" (sincronización de estado).
create index idx_contratos_propiedad_estado on public.contratos(propiedad_id, estado);

create trigger trg_contratos_updated
  before update on public.contratos
  for each row execute function public.set_updated_at();

-- ----- Tabla puente contratos_arrendatarios ------------------
create table public.contratos_arrendatarios (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  contrato_id     uuid not null references public.contratos(id) on delete cascade,
  arrendatario_id uuid not null references public.arrendatarios(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (contrato_id, arrendatario_id)
);

create index idx_contr_arr_empresa on public.contratos_arrendatarios(empresa_id);
create index idx_contr_arr_contrato on public.contratos_arrendatarios(contrato_id);
create index idx_contr_arr_arrendatario on public.contratos_arrendatarios(arrendatario_id);

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.contratos enable row level security;

create policy "contratos_select_admin"
  on public.contratos for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "contratos_insert_admin"
  on public.contratos for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "contratos_update_admin"
  on public.contratos for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.contratos_arrendatarios enable row level security;

create policy "contr_arr_select_admin"
  on public.contratos_arrendatarios for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "contr_arr_insert_admin"
  on public.contratos_arrendatarios for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "contr_arr_delete_admin"
  on public.contratos_arrendatarios for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: contratos sin DELETE (baja lógica). Bridge SÍ permite DELETE (desasignar).
-- NOTA: la transición de estado del contrato sincroniza propiedades.estado
--       desde la capa de aplicación (no por trigger), con el contrato como
--       fuente de verdad.
