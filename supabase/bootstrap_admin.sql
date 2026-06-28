-- =====================================================
-- bootstrap_admin.sql  —  EJECUCIÓN MANUAL, UNA SOLA VEZ
-- =====================================================
-- Crea la primera empresa y el primer admin. NO es una migración
-- de esquema ni un seed automático: referencia un usuario de
-- Supabase Auth que debe existir ANTES de correr esto.
--
-- ORDEN:
--   1. Dashboard > Authentication > Users > "Create user"
--        email: admin@ruzosky.cl   (password la define Eduardo en la UI)
--   2. Ejecutar este script en el SQL Editor (corre como service_role,
--      por eso bypassa RLS — único punto donde está permitido).
--
-- Antes de ejecutar: ajustar EMAIL y NOMBRE si corresponde.
-- =====================================================

do $$
declare
  v_email       text := 'admin@ruzosky.cl';
  v_nombre      text := 'Administrador Ruzosky';
  v_empresa     text := 'Ruzosky Corredora';
  v_user_id     uuid;
  v_empresa_id  uuid;
begin
  -- Falla en voz alta si el usuario auth no existe (evita empresa huérfana).
  select id into v_user_id from auth.users where email = v_email;
  if v_user_id is null then
    raise exception 'No existe usuario auth con email %. Créalo primero en Authentication > Users.', v_email;
  end if;

  -- Idempotencia: si la empresa ya existe, la reutiliza; si no, la crea.
  select id into v_empresa_id from public.empresas where nombre = v_empresa limit 1;
  if v_empresa_id is null then
    insert into public.empresas (nombre) values (v_empresa) returning id into v_empresa_id;
  end if;

  -- Crea o corrige el profile del admin (idempotente por PK = auth.users.id).
  insert into public.profiles (id, empresa_id, nombre, email, rol)
  values (v_user_id, v_empresa_id, v_nombre, v_email, 'admin')
  on conflict (id) do update
    set empresa_id = excluded.empresa_id,
        rol        = excluded.rol,
        nombre     = excluded.nombre,
        email      = excluded.email;

  raise notice 'Bootstrap OK — empresa % / admin %', v_empresa_id, v_user_id;
end $$;

-- Validación
select p.id, p.nombre, p.rol, p.email, e.nombre as empresa
from public.profiles p
join public.empresas e on e.id = p.empresa_id;
