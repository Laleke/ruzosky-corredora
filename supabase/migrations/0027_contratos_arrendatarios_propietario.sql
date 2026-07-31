-- =============================================================
-- 0027_contratos_arrendatarios_propietario.sql
-- Falta en 0024: el propietario no podía leer `contratos_arrendatarios`
-- (para mostrar el nombre del arrendatario en su propia vista de contrato),
-- solo el arrendatario tenía policy sobre esa tabla puente.
-- =============================================================

create policy "contr_arr_select_propietario"
  on public.contratos_arrendatarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.contratos co
      join public.propietarios_propiedades pp on pp.propiedad_id = co.propiedad_id
      join public.propietarios p on p.id = pp.propietario_id
      where co.id = contratos_arrendatarios.contrato_id
        and p.profile_id = auth.uid()
    )
  );
