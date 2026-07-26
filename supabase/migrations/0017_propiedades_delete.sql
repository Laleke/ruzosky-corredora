-- =============================================================
-- 0017_propiedades_delete.sql
-- Agrega política RLS de DELETE para propiedades (solo admin).
-- Faltaba: 0003_propiedades.sql dejó la baja solo lógica (activo=false)
-- a propósito, pero ahora se ofrece "Eliminar propiedad" en el detalle
-- para propiedades sin contratos/gastos asociados (bloqueado igual por
-- `on delete restrict` en esas tablas si existieran). Sin esta política,
-- el DELETE no fallaba con error: RLS simplemente no encontraba filas que
-- coincidieran, así que el DELETE afectaba 0 filas en silencio.
-- =============================================================

create policy "propiedades_delete_admin"
  on public.propiedades for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
