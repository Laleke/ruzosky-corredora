-- =============================================================
-- 0031_profiles_password_set.sql
-- Rastrea si el usuario del portal ya definió su propia contraseña. Sin
-- esto, alguien que entra por primera vez con el link de invitación queda
-- con sesión activa en ESE navegador pero sin forma de volver a entrar
-- desde otro dispositivo (nunca completó `/portal/set-password`) — bug
-- real reportado 2026-07-31.
--
-- Backfill: los que ya estaban `activo` antes de esta migración se asumen
-- con contraseña ya puesta (es la única vía que existía hasta ahora para
-- llegar a `activo`); solo los nuevos accesos quedan bajo el gate real.
-- =============================================================

alter table public.profiles
  add column password_set boolean not null default false;

update public.profiles p
set password_set = true
where exists (
  select 1 from public.propietarios pr where pr.profile_id = p.id and pr.estado_invitacion = 'activo'
) or exists (
  select 1 from public.arrendatarios a where a.profile_id = p.id and a.estado_invitacion = 'activo'
);
