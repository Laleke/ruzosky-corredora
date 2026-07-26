-- ============================================================================
-- Limpieza de datos de prueba — inicio de ingreso de información real
-- Propósito: vaciar todas las tablas de negocio (propietarios, propiedades,
--            contratos, cobros, liquidaciones, gastos, documentos, auditoría)
--            manteniendo intacta la estructura (tablas, RLS, enums) y las
--            tablas de tenancy/auth (empresas, profiles).
-- Fecha: 2026-07-24
-- Ejecutar: Supabase SQL Editor, contra el proyecto QA o PROD según corresponda.
-- Contexto: Eduardo comienza el ingreso de información real de arriendos
--           (modalidad "Administrador de Contratos de Arriendo"). Este script
--           borra los datos de prueba usados hasta ahora para validar el MVP.
--
-- ADVERTENCIA: operación IRREVERSIBLE. No hay backup automático configurado
-- todavía (Sprint 1 · T3 "Backups + prueba de restauración" sigue pendiente
-- en el roadmap de Hardening de PROYECTO.md). Antes de ejecutar, considera:
--   1. Exportar un respaldo manual (Supabase Dashboard → Database → Backups,
--      o `pg_dump` si tienes acceso directo), especialmente si hay algún dato
--      de prueba que quieras conservar como referencia.
--   2. Revisar el bucket de Storage "documentos": este script SOLO borra las
--      filas de metadata (`documentos` / `documento_versiones`), NO borra los
--      archivos físicos en Storage. Si quieres limpiar también los archivos,
--      hazlo aparte desde Supabase Dashboard → Storage → bucket "documentos"
--      (o vía la API de administración), idealmente ANTES de correr este
--      script (para poder ubicar los archivos por los IDs de documento).
-- ============================================================================

begin;

-- 1. Documentos (hijos primero: versiones, luego documento)
delete from documento_versiones;
delete from documentos;

-- 2. Liquidaciones (detalles primero)
delete from liquidacion_detalles;
delete from liquidaciones;

-- 3. Gastos (depende de propiedad/contrato/propietario/arrendatario/liquidacion/documento,
--    todos ya vacíos arriba o se vacían junto con este delete)
delete from gastos;

-- 4. Cobros (pagos primero, luego cargos)
delete from pagos;
delete from cargos;

-- 5. Contratos (tabla puente primero, luego contrato)
delete from contratos_arrendatarios;
delete from contratos;

-- 6. Relación propietario↔propiedad, luego propiedades y personas
delete from propietarios_propiedades;
delete from propiedades;
delete from arrendatarios;
delete from propietarios;

-- 7. Auditoría (log de las acciones de prueba; se limpia junto con los datos)
delete from auditoria;

commit;

-- ============================================================================
-- Verificación post-limpieza (todas deben devolver 0)
-- ============================================================================
select 'documento_versiones' as tabla, count(*) from documento_versiones
union all select 'documentos', count(*) from documentos
union all select 'liquidacion_detalles', count(*) from liquidacion_detalles
union all select 'liquidaciones', count(*) from liquidaciones
union all select 'gastos', count(*) from gastos
union all select 'pagos', count(*) from pagos
union all select 'cargos', count(*) from cargos
union all select 'contratos_arrendatarios', count(*) from contratos_arrendatarios
union all select 'contratos', count(*) from contratos
union all select 'propietarios_propiedades', count(*) from propietarios_propiedades
union all select 'propiedades', count(*) from propiedades
union all select 'arrendatarios', count(*) from arrendatarios
union all select 'propietarios', count(*) from propietarios
union all select 'auditoria', count(*) from auditoria;

-- NOTA: no se tocan `empresas` ni `profiles` (tenancy/auth) — tu usuario admin
-- y la empresa RZK Prop siguen intactos, solo se vacía la operación de negocio.
