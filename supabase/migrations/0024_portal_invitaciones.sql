-- =============================================================
-- 0024_portal_invitaciones.sql
-- Portal propietario/arrendatario (T20): vincula propietarios/
-- arrendatarios a un profile de Supabase Auth vía invitación admin,
-- y agrega políticas RLS de solo lectura para que cada uno vea
-- únicamente sus propios datos.
--
-- No se toca ninguna política admin existente: estas políticas son
-- aditivas. Ningún INSERT/UPDATE/DELETE se habilita para estos roles
-- en ninguna tabla — el portal es 100% de solo lectura.
--
-- Última modificación: 2026-07-30
-- =============================================================

create type public.estado_invitacion as enum ('sin_invitar', 'invitado', 'activo');

-- ----- Vínculo propietarios/arrendatarios <-> profiles --------
alter table public.propietarios
  add column profile_id        uuid references public.profiles(id) on delete set null,
  add column estado_invitacion public.estado_invitacion not null default 'sin_invitar',
  add column invitado_en       timestamptz,
  add column invitado_por      uuid;

alter table public.arrendatarios
  add column profile_id        uuid references public.profiles(id) on delete set null,
  add column estado_invitacion public.estado_invitacion not null default 'sin_invitar',
  add column invitado_en       timestamptz,
  add column invitado_por      uuid;

-- Un profile de portal solo puede ligarse a una fila de negocio de cada tipo.
create unique index uq_propietarios_profile_id
  on public.propietarios(profile_id) where profile_id is not null;
create unique index uq_arrendatarios_profile_id
  on public.arrendatarios(profile_id) where profile_id is not null;

-- ----- RLS: propietarios/arrendatarios ven su propia fila -----
create policy "propietarios_select_propio"
  on public.propietarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and profile_id = auth.uid()
  );

create policy "arrendatarios_select_propio"
  on public.arrendatarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and profile_id = auth.uid()
  );

-- ----- RLS: propiedades que el propietario coposee -------------
create policy "propiedades_select_propietario"
  on public.propiedades for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.propietarios_propiedades pp
      join public.propietarios p on p.id = pp.propietario_id
      where pp.propiedad_id = propiedades.id
        and p.profile_id = auth.uid()
    )
  );

-- ----- RLS: contratos ------------------------------------------
create policy "contratos_select_arrendatario"
  on public.contratos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.contratos_arrendatarios ca
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where ca.contrato_id = contratos.id
        and a.profile_id = auth.uid()
    )
  );

create policy "contratos_select_propietario"
  on public.contratos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.propietarios_propiedades pp
      join public.propietarios p on p.id = pp.propietario_id
      where pp.propiedad_id = contratos.propiedad_id
        and p.profile_id = auth.uid()
    )
  );

-- contratos_arrendatarios: el arrendatario necesita leer el bridge para que
-- la app pueda resolver "mis contratos" sin depender solo de contratos.select.
create policy "contr_arr_select_arrendatario"
  on public.contratos_arrendatarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1 from public.arrendatarios a
      where a.id = contratos_arrendatarios.arrendatario_id
        and a.profile_id = auth.uid()
    )
  );

-- ----- RLS: cargos / pagos (arrendatario) -----------------------
create policy "cargos_select_arrendatario"
  on public.cargos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.contratos_arrendatarios ca
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where ca.contrato_id = cargos.contrato_id
        and a.profile_id = auth.uid()
    )
  );

create policy "pagos_select_arrendatario"
  on public.pagos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.cargos c
      join public.contratos_arrendatarios ca on ca.contrato_id = c.contrato_id
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where c.id = pagos.cargo_id
        and a.profile_id = auth.uid()
    )
  );

-- ----- RLS: liquidaciones (propietario) -------------------------
create policy "liquidaciones_select_propietario"
  on public.liquidaciones for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1 from public.propietarios p
      where p.id = liquidaciones.propietario_id
        and p.profile_id = auth.uid()
    )
  );

create policy "liq_detalles_select_propietario"
  on public.liquidacion_detalles for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.liquidaciones l
      join public.propietarios p on p.id = l.propietario_id
      where l.id = liquidacion_detalles.liquidacion_id
        and p.profile_id = auth.uid()
    )
  );

-- ----- RLS: documentos (ambos roles) -----------------------------
create policy "documentos_select_propietario"
  on public.documentos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and (
      exists (
        select 1 from public.propietarios p
        where p.id = documentos.propietario_id and p.profile_id = auth.uid()
      )
      or exists (
        select 1
        from public.propietarios_propiedades pp
        join public.propietarios p on p.id = pp.propietario_id
        where pp.propiedad_id = documentos.propiedad_id and p.profile_id = auth.uid()
      )
    )
  );

create policy "documentos_select_arrendatario"
  on public.documentos for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and (
      exists (
        select 1 from public.arrendatarios a
        where a.id = documentos.arrendatario_id and a.profile_id = auth.uid()
      )
      or exists (
        select 1
        from public.contratos_arrendatarios ca
        join public.arrendatarios a on a.id = ca.arrendatario_id
        where ca.contrato_id = documentos.contrato_id and a.profile_id = auth.uid()
      )
    )
  );

create policy "doc_versiones_select_propietario"
  on public.documento_versiones for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1 from public.documentos d
      where d.id = documento_versiones.documento_id
        and (
          exists (select 1 from public.propietarios p where p.id = d.propietario_id and p.profile_id = auth.uid())
          or exists (
            select 1
            from public.propietarios_propiedades pp
            join public.propietarios p on p.id = pp.propietario_id
            where pp.propiedad_id = d.propiedad_id and p.profile_id = auth.uid()
          )
        )
    )
  );

create policy "doc_versiones_select_arrendatario"
  on public.documento_versiones for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1 from public.documentos d
      where d.id = documento_versiones.documento_id
        and (
          exists (select 1 from public.arrendatarios a where a.id = d.arrendatario_id and a.profile_id = auth.uid())
          or exists (
            select 1
            from public.contratos_arrendatarios ca
            join public.arrendatarios a on a.id = ca.arrendatario_id
            where ca.contrato_id = d.contrato_id and a.profile_id = auth.uid()
          )
        )
    )
  );

-- storage.objects: mismo aislamiento por empresa que ya existe para admin,
-- más la misma verificación de visibilidad que documento_versiones/documentos.
create policy "documentos_storage_select_propietario"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.auth_empresa_id()::text
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.documento_versiones dv
      join public.documentos d on d.id = dv.documento_id
      where dv.storage_path = name
        and (
          exists (select 1 from public.propietarios p where p.id = d.propietario_id and p.profile_id = auth.uid())
          or exists (
            select 1
            from public.propietarios_propiedades pp
            join public.propietarios p on p.id = pp.propietario_id
            where pp.propiedad_id = d.propiedad_id and p.profile_id = auth.uid()
          )
        )
    )
  );

create policy "documentos_storage_select_arrendatario"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.auth_empresa_id()::text
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.documento_versiones dv
      join public.documentos d on d.id = dv.documento_id
      where dv.storage_path = name
        and (
          exists (select 1 from public.arrendatarios a where a.id = d.arrendatario_id and a.profile_id = auth.uid())
          or exists (
            select 1
            from public.contratos_arrendatarios ca
            join public.arrendatarios a on a.id = ca.arrendatario_id
            where ca.contrato_id = d.contrato_id and a.profile_id = auth.uid()
          )
        )
    )
  );

-- NOTA: sin políticas INSERT/UPDATE/DELETE para propietario/arrendatario en
-- ninguna tabla — la ausencia de política ya deniega por defecto (RLS).
-- NOTA: la transición 'invitado' -> 'activo' se hace desde la capa de
-- aplicación (layout del portal), no por trigger.
