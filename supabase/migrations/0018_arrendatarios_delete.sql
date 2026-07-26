-- =============================================================
-- 0018_arrendatarios_delete.sql
-- Agrega política RLS de DELETE para arrendatarios (solo admin).
-- Mismo caso que 0017_propiedades_delete.sql: sin esta política el
-- DELETE no falla con error, simplemente afecta 0 filas en silencio.
-- La app valida antes (tieneContratosVinculados) que el arrendatario
-- no tenga contratos asociados, ya que la FK de contratos_arrendatarios
-- es `on delete cascade` y no bloquearía el borrado por sí sola.
-- =============================================================

create policy "arrendatarios_delete_admin"
  on public.arrendatarios for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
