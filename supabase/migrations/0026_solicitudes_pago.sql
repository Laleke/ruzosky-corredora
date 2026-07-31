-- =============================================================
-- 0026_solicitudes_pago.sql
-- El arrendatario reporta un pago desde el portal; NO se registra como
-- pago real de inmediato — queda "pendiente" hasta que el propietario
-- (o el admin) lo apruebe. Al aprobar, se crea el `pago` real (mismo
-- efecto que `registrarPago`, ver src/features/cobros/actions.ts).
--
-- El comprobante que adjunta el arrendatario se guarda como archivo suelto
-- en Storage (columnas comprobante_*) — NO como fila en `documentos` todavía,
-- porque el arrendatario no tiene permiso de escribir ahí (por diseño). Solo
-- al aprobar se promueve a un `documento` real vinculado al `pago` creado.
-- =============================================================

create type public.estado_solicitud_pago as enum ('pendiente', 'aprobada', 'rechazada');

create table public.solicitudes_pago (
  id                         uuid primary key default gen_random_uuid(),
  empresa_id                 uuid not null references public.empresas(id) on delete restrict,
  cargo_id                   uuid not null references public.cargos(id) on delete cascade,
  arrendatario_id            uuid not null references public.arrendatarios(id) on delete cascade,
  monto                      numeric(14, 2) not null check (monto > 0),
  fecha_pago                 date not null,
  medio_pago                 public.medio_pago,
  referencia                 text,
  observaciones              text,
  comprobante_storage_path   text,
  comprobante_nombre_archivo text,
  comprobante_tamano_bytes   bigint,
  comprobante_mime_type      text,
  estado                     public.estado_solicitud_pago not null default 'pendiente',
  motivo_rechazo             text,
  -- Pago real creado al aprobar (null mientras esté pendiente/rechazada).
  pago_id                    uuid references public.pagos(id) on delete set null,
  revisado_por               uuid,
  revisado_en                timestamptz,
  created_at                 timestamptz not null default now()
);

create index idx_solicitudes_pago_empresa on public.solicitudes_pago(empresa_id);
create index idx_solicitudes_pago_cargo on public.solicitudes_pago(cargo_id);
create index idx_solicitudes_pago_arrendatario on public.solicitudes_pago(arrendatario_id);
create index idx_solicitudes_pago_estado on public.solicitudes_pago(empresa_id, estado);

alter table public.solicitudes_pago enable row level security;

-- ----- Admin: acceso total -------------------------------------
create policy "solicitudes_pago_select_admin"
  on public.solicitudes_pago for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

create policy "solicitudes_pago_delete_admin"
  on public.solicitudes_pago for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- NOTA: no hay policy UPDATE para ningún rol — aprobar/rechazar (que además
-- necesita crear el `pago` real, tabla admin-only) se hace siempre vía
-- cliente service_role desde el server action, gateado en la capa de
-- aplicación (admin, o propietario dueño de la propiedad del cargo).

-- ----- Arrendatario: crea y ve sus propias solicitudes ----------
create policy "solicitudes_pago_select_arrendatario"
  on public.solicitudes_pago for select to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1 from public.arrendatarios a
      where a.id = solicitudes_pago.arrendatario_id and a.profile_id = auth.uid()
    )
  );

create policy "solicitudes_pago_insert_arrendatario"
  on public.solicitudes_pago for insert to authenticated
  with check (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1 from public.arrendatarios a
      where a.id = solicitudes_pago.arrendatario_id and a.profile_id = auth.uid()
    )
    and exists (
      select 1
      from public.cargos c
      join public.contratos_arrendatarios ca on ca.contrato_id = c.contrato_id
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where c.id = solicitudes_pago.cargo_id and a.profile_id = auth.uid()
    )
  );

-- ----- Propietario: ve las solicitudes de sus propiedades -------
create policy "solicitudes_pago_select_propietario"
  on public.solicitudes_pago for select to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.cargos c
      join public.contratos co on co.id = c.contrato_id
      join public.propietarios_propiedades pp on pp.propiedad_id = co.propiedad_id
      join public.propietarios p on p.id = pp.propietario_id
      where c.id = solicitudes_pago.cargo_id and p.profile_id = auth.uid()
    )
  );
