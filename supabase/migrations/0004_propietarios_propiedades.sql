-- =============================================================
-- 0004_propietarios_propiedades.sql
-- Tabla puente N:M. ÚNICA fuente de verdad de la relación
-- propietario <-> propiedad. Soporta copropiedad y participación %.
-- =============================================================

create table public.propietarios_propiedades (
  id                      uuid primary key default gen_random_uuid(),
  empresa_id              uuid not null references public.empresas(id) on delete restrict,
  propietario_id          uuid not null references public.propietarios(id) on delete cascade,
  propiedad_id            uuid not null references public.propiedades(id) on delete cascade,
  -- Participación en la propiedad (copropiedad). 0 < % <= 100.
  porcentaje_participacion numeric(5, 2) not null default 100
    check (porcentaje_participacion > 0 and porcentaje_participacion <= 100),
  created_at              timestamptz not null default now(),
  -- Un propietario no puede estar dos veces en la misma propiedad.
  unique (propiedad_id, propietario_id)
);

create index idx_prop_prop_empresa on public.propietarios_propiedades(empresa_id);
create index idx_prop_prop_propiedad on public.propietarios_propiedades(propiedad_id);
create index idx_prop_prop_propietario on public.propietarios_propiedades(propietario_id);

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.propietarios_propiedades enable row level security;

create policy "prop_prop_select_admin"
  on public.propietarios_propiedades for select
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "prop_prop_insert_admin"
  on public.propietarios_propiedades for insert
  to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "prop_prop_update_admin"
  on public.propietarios_propiedades for update
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- Aquí SÍ se permite DELETE: desasignar un propietario es operación normal.
create policy "prop_prop_delete_admin"
  on public.propietarios_propiedades for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: el tope de suma de participaciones (<= 100% por propiedad) se valida
-- en la capa de aplicación (acción de asignación), no por constraint de fila.
