-- =============================================================
-- 0010_tipo_cargo_servicios.sql
-- Agrega tipos de cargo de servicios (luz, agua, internet).
-- 'administracion' se mantiene en el enum (datos históricos / contratos),
-- pero se quita de las opciones del formulario de creación manual.
-- =============================================================

alter type public.tipo_cargo add value if not exists 'luz';
alter type public.tipo_cargo add value if not exists 'agua';
alter type public.tipo_cargo add value if not exists 'internet';
