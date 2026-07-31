-- =============================================================
-- 0028_fix_recursion_contratos_arrendatarios.sql
-- URGENTE: corrige "infinite recursion detected in policy for relation
-- contratos", introducido por 0027.
--
-- Causa: la policy `contr_arr_select_propietario` (0027) consulta
-- `contratos` directamente; pero `contratos` ya tenía una policy
-- (`contratos_select_arrendatario`, de 0024) que consulta
-- `contratos_arrendatarios`. Postgres expande las políticas de ambas tablas
-- para CUALQUIER query que toque alguna de las dos (sin importar el rol de
-- quien consulta) y detecta el ciclo — rompe `contratos` y
-- `contratos_arrendatarios` para todos los roles, incluido admin.
--
-- Arreglo: función SECURITY DEFINER que lee `contratos.propiedad_id`
-- bypasseando RLS (mismo patrón ya usado por auth_rol()/auth_empresa_id()
-- en 0001), para que la policy de `contratos_arrendatarios` nunca vuelva a
-- tocar `contratos` con RLS activa.
-- =============================================================

create or replace function public.propiedad_de_contrato(p_contrato_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select propiedad_id from public.contratos where id = p_contrato_id;
$$;

drop policy if exists "contr_arr_select_propietario" on public.contratos_arrendatarios;

create policy "contr_arr_select_propietario"
  on public.contratos_arrendatarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'propietario'
    and exists (
      select 1
      from public.propietarios_propiedades pp
      join public.propietarios p on p.id = pp.propietario_id
      where pp.propiedad_id = public.propiedad_de_contrato(contratos_arrendatarios.contrato_id)
        and p.profile_id = auth.uid()
    )
  );
