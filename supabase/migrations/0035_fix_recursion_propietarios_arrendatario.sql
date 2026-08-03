-- =============================================================
-- 0035_fix_recursion_propietarios_arrendatario.sql
-- URGENTE: corrige "infinite recursion detected in policy for relation
-- contratos" (y propietarios/propietarios_propiedades), introducido por 0034.
--
-- Causa: las dos policies de 0034 consultaban `contratos` y
-- `propietarios`/`propietarios_propiedades` directamente. Pero `contratos` ya
-- tenía una policy (`contratos_select_propietario`, de 0024) que consulta
-- `propietarios_propiedades` + `propietarios`; y `propietarios_propiedades`
-- ahora (via 0034) consultaba `contratos`. Postgres expande las políticas de
-- las tres tablas para CUALQUIER query que toque alguna de ellas (sin
-- importar el rol de quien consulta) y detecta el ciclo — rompe `contratos`
-- para todos los roles, incluido admin. Mismo patrón exacto que 0028 (ahí fue
-- contratos_arrendatarios <-> contratos).
--
-- Arreglo: funciones SECURITY DEFINER que bypassean RLS al resolver la
-- relación arrendatario -> propiedad -> propietario, para que estas dos
-- policies nunca vuelvan a tocar `contratos`/`propietarios_propiedades` con
-- RLS activa (mismo patrón ya usado por propiedad_de_contrato() en 0028).
-- Última modificación: 2026-08-03
-- =============================================================

create or replace function public.arrendatario_tiene_contrato_en_propiedad(p_propiedad_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contratos c
    join public.contratos_arrendatarios ca on ca.contrato_id = c.id
    join public.arrendatarios a on a.id = ca.arrendatario_id
    where c.propiedad_id = p_propiedad_id
      and a.profile_id = auth.uid()
  );
$$;

create or replace function public.arrendatario_ve_propietario(p_propietario_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.propietarios_propiedades pp
    join public.contratos c on c.propiedad_id = pp.propiedad_id
    join public.contratos_arrendatarios ca on ca.contrato_id = c.id
    join public.arrendatarios a on a.id = ca.arrendatario_id
    where pp.propietario_id = p_propietario_id
      and a.profile_id = auth.uid()
  );
$$;

drop policy if exists "propietarios_propiedades_select_arrendatario" on public.propietarios_propiedades;
create policy "propietarios_propiedades_select_arrendatario"
  on public.propietarios_propiedades for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and public.arrendatario_tiene_contrato_en_propiedad(propietarios_propiedades.propiedad_id)
  );

drop policy if exists "propietarios_select_arrendatario" on public.propietarios;
create policy "propietarios_select_arrendatario"
  on public.propietarios for select
  to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and public.arrendatario_ve_propietario(propietarios.id)
  );
