-- =============================================================
-- 0009_personas_numero.sql
-- Separa la dirección en calle (columna direccion) + numero para
-- propietarios y arrendatarios (igual que propiedades).
-- =============================================================

alter table public.propietarios add column if not exists numero text;
alter table public.arrendatarios add column if not exists numero text;
