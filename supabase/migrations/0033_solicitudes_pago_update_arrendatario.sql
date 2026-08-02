-- =============================================================
-- 0033_solicitudes_pago_update_arrendatario.sql
-- Permite al arrendatario editar su propia solicitud de pago MIENTRAS siga
-- "pendiente" — si el propietario/admin ya la aprobó o rechazó, no se puede
-- tocar más (el `with check` obliga a que la fila siga en 'pendiente'
-- después del update, así tampoco puede cambiar el estado él mismo).
-- =============================================================

create policy "solicitudes_pago_update_arrendatario"
  on public.solicitudes_pago for update to authenticated
  using (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and estado = 'pendiente'
    and exists (
      select 1 from public.arrendatarios a
      where a.id = solicitudes_pago.arrendatario_id and a.profile_id = auth.uid()
    )
  )
  with check (
    empresa_id = public.auth_empresa_id()
    and public.auth_rol() = 'arrendatario'
    and estado = 'pendiente'
    and exists (
      select 1 from public.arrendatarios a
      where a.id = solicitudes_pago.arrendatario_id and a.profile_id = auth.uid()
    )
  );
