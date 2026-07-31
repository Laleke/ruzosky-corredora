-- =============================================================
-- 0029_propiedades_select_arrendatario.sql
-- Faltaba en 0024: el arrendatario no tenía SELECT sobre `propiedades`
-- (solo el propietario) — por eso su vista de "Mis contratos" mostraba la
-- dirección vacía ("—"), aunque el contrato sí era visible.
-- =============================================================

create policy "propiedades_select_arrendatario"
  on public.propiedades for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.contratos co
      join public.contratos_arrendatarios ca on ca.contrato_id = co.id
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where co.propiedad_id = propiedades.id
        and a.profile_id = auth.uid()
    )
  );
