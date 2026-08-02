-- 0034_propietarios_select_arrendatario.sql
-- Propósito: permitir que el arrendatario lea los datos base (nombre/contacto)
-- del propietario de la propiedad que arrienda, para mostrarlos como
-- referencia de solo lectura en el detalle de "pago informado" del portal
-- (/portal/cargos/[id]). Antes de esto, `propietarios` solo era legible por
-- admin o por el propio propietario — el arrendatario no tenía forma de ver
-- ni siquiera el nombre de su arrendador desde el portal.
-- Última modificación: 2026-08-02

-- El arrendatario necesita leer el bridge propiedad<->propietario para poder
-- resolver "el/los propietario(s) de mi propiedad" (mismo patrón que
-- contr_arr_select_arrendatario en 0024).
create policy "propietarios_propiedades_select_arrendatario"
  on public.propietarios_propiedades for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.contratos c
      join public.contratos_arrendatarios ca on ca.contrato_id = c.id
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where c.propiedad_id = propietarios_propiedades.propiedad_id
        and a.profile_id = auth.uid()
    )
  );

create policy "propietarios_select_arrendatario"
  on public.propietarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and exists (
      select 1
      from public.propietarios_propiedades pp
      join public.contratos c on c.propiedad_id = pp.propiedad_id
      join public.contratos_arrendatarios ca on ca.contrato_id = c.id
      join public.arrendatarios a on a.id = ca.arrendatario_id
      where pp.propietario_id = propietarios.id
        and a.profile_id = auth.uid()
    )
  );
