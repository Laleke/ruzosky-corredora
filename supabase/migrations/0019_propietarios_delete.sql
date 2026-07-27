-- =============================================================
-- 0019_propietarios_delete.sql
-- Agrega política RLS de DELETE para propietarios (solo admin).
-- Mismo gotcha que 0017/0018: sin esta política el DELETE no falla con
-- error, simplemente afecta 0 filas en silencio. La base de datos igual
-- bloquea el borrado si el propietario tiene liquidaciones asociadas
-- (`liquidaciones.propietario_id` es `on delete restrict`); la relación
-- con propiedades (`propietarios_propiedades`) es `cascade` y no bloquea.
-- =============================================================

create policy "propietarios_delete_admin"
  on public.propietarios for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
