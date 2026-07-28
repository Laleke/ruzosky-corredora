-- =============================================================
-- 0020_contratos_delete.sql
-- Agrega política RLS de DELETE para contratos (solo admin).
-- Mismo gotcha que 0017/0018/0019: sin esta política el DELETE no falla con
-- error, simplemente afecta 0 filas en silencio. La base de datos igual
-- bloquea el borrado si el contrato tiene cargos asociados
-- (`cargos.contrato_id` es `on delete restrict`); las relaciones con
-- arrendatarios (`contratos_arrendatarios`) son `cascade` y con
-- documentos/gastos son `set null` — ninguna de esas dos bloquea.
-- =============================================================

create policy "contratos_delete_admin"
  on public.contratos for delete
  to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
