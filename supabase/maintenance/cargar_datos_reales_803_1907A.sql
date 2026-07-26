-- ============================================================================
-- Carga de datos reales: Eduardo como propietario + propiedades 803/1907-A +
-- arrendatarios + contratos directos (post-transición de AssetPlan).
-- Fecha: 2026-07-26
-- Ejecutar: Supabase SQL Editor, DESPUÉS de correr
--           `limpiar_datos_prueba_2026-07-24.sql` (o sobre una BD ya vacía).
--
-- AJUSTAR ANTES DE EJECUTAR (buscar "AJUSTAR" en este archivo):
--   1. Fechas de inicio de los 2 contratos directos (hoy son placeholder).
--   2. Email/teléfono de Eduardo como propietario (quedan NULL).
--   3. Email/teléfono de Jimmy y Paul si los tienes a mano (quedan NULL).
--
-- PENDIENTE DE DISEÑO (no de esta sesión de carga): el modelo `contratos`
-- HOY NO TIENE columna de garantía (monto/estado/fecha de traspaso). Se
-- deja el detalle del traspaso de garantía como texto en `observaciones`
-- para no perder el dato, pero no queda con trazabilidad estructurada.
-- Si se necesita reportar garantías más adelante, esto requiere una
-- migración nueva (columna o tabla `contrato_garantias`) — no se agrega
-- aquí sin pedido explícito, según la restricción de que Eduardo aprueba
-- los cambios de esquema.
-- ============================================================================

begin;

-- 0. Empresa: renombrar a RZK Prop (idempotente, no falla si ya está OK)
update empresas
set nombre = 'RZK Prop'
where nombre ilike '%ruzosky%';

-- 1. Propietario: Eduardo Andrés Ruz Cartagena
with emp as (
  select id as empresa_id from empresas limit 1  -- AJUSTAR si tienes más de una empresa
),
propietario_nuevo as (
  insert into propietarios (
    empresa_id, tipo_persona, rut, nombre, apellido, email, telefono, activo
  )
  select empresa_id, 'persona_natural', '17311698-5', 'Eduardo Andrés', 'Ruz Cartagena',
         null, null, true  -- AJUSTAR email/teléfono
  from emp
  returning id, empresa_id
),

-- 2. Propiedades
propiedad_803 as (
  insert into propiedades (
    empresa_id, codigo_interno, tipo, direccion, numero, departamento, comuna,
    estacionamientos, bodegas, estado, moneda, valor_referencial_arriendo, activo
  )
  select empresa_id, 'SMD0001', 'departamento', 'Curiñanca', '920', '803', 'San Miguel',
         1, 1, 'arrendada', 'CLP', 600000, true
  from propietario_nuevo
  returning id, empresa_id
),
propiedad_1907a as (
  insert into propiedades (
    empresa_id, codigo_interno, tipo, direccion, numero, departamento, comuna,
    estacionamientos, bodegas, estado, moneda, valor_referencial_arriendo, activo
  )
  select empresa_id, 'SJD0001', 'departamento', 'Av. Vicuña Mackenna', '2289', '1907-A', 'San Joaquín',
         0, 0, 'arrendada', 'CLP', 295000, true
  from propietario_nuevo
  returning id, empresa_id
),

-- 3. Relación propietario <-> propiedad (100% Eduardo en ambas)
rel_803 as (
  insert into propietarios_propiedades (empresa_id, propietario_id, propiedad_id, porcentaje_participacion)
  select p.empresa_id, p.id, pr.id, 100
  from propietario_nuevo p, propiedad_803 pr
  returning propiedad_id
),
rel_1907a as (
  insert into propietarios_propiedades (empresa_id, propietario_id, propiedad_id, porcentaje_participacion)
  select p.empresa_id, p.id, pr.id, 100
  from propietario_nuevo p, propiedad_1907a pr
  returning propiedad_id
),

-- 4. Arrendatarios
arrendatario_jimmy as (
  insert into arrendatarios (
    empresa_id, tipo_persona, rut, nombre, apellido, email, telefono,
    direccion, numero, comuna, activo
  )
  select empresa_id, 'persona_natural', '12217040-3', 'Jimmy Eduardo', 'Toro Morales',
         'toroji3122@gmail.com', null, 'Curiñanca', '920', 'San Miguel', true  -- AJUSTAR teléfono
  from propietario_nuevo
  returning id, empresa_id
),
arrendatario_paul as (
  insert into arrendatarios (
    empresa_id, tipo_persona, rut, nombre, apellido, email, telefono,
    direccion, numero, comuna, activo
  )
  select empresa_id, 'persona_natural', '18222292-5', 'Paul Edison', 'Onetto Guerra',
         'paul.og92@hotmail.com', null, 'Av. Vicuña Mackenna', '2289', 'San Joaquín', true  -- AJUSTAR teléfono
  from propietario_nuevo
  returning id, empresa_id
),

-- 5. Contratos directos (AJUSTAR fecha_inicio a la fecha real de tu firma)
contrato_803 as (
  insert into contratos (
    empresa_id, propiedad_id, fecha_firma, fecha_inicio, canon_monto, canon_moneda,
    reajuste_tipo, periodicidad_reajuste_meses, estado, observaciones, activo
  )
  select p.empresa_id, pr.id,
         '2026-07-26'::date,  -- AJUSTAR: fecha real de tu firma
         '2026-07-26'::date,  -- AJUSTAR: fecha real de inicio del contrato directo
         600000, 'CLP', 'UF', 12, 'vigente',
         'Continuación directa tras finiquito con AssetPlan (15-jul-2026). ' ||
         'Garantía traspasada por AssetPlan: $600.000 (sin columna estructurada de garantía en el modelo hoy — ver docs/ADMINISTRADOR_CONTRATOS_ARRIENDO_SESION_2026-07-24.md).',
         true
  from propietario_nuevo p, propiedad_803 pr
  returning id, empresa_id
),
contrato_1907a as (
  insert into contratos (
    empresa_id, propiedad_id, fecha_firma, fecha_inicio, canon_monto, canon_moneda,
    reajuste_tipo, periodicidad_reajuste_meses, estado, observaciones, activo
  )
  select p.empresa_id, pr.id,
         '2026-07-26'::date,  -- AJUSTAR: fecha real de tu firma
         '2026-07-26'::date,  -- AJUSTAR: fecha real de inicio del contrato directo
         295000, 'CLP', 'UF', 12, 'vigente',
         'Continuación directa tras finiquito con AssetPlan (15-jul-2026). ' ||
         'Garantía traspasada por AssetPlan: $295.000 (sin columna estructurada de garantía en el modelo hoy — ver docs/ADMINISTRADOR_CONTRATOS_ARRIENDO_SESION_2026-07-24.md).',
         true
  from propietario_nuevo p, propiedad_1907a pr
  returning id, empresa_id
),

-- 6. Vínculo contrato <-> arrendatario
vinculo_803 as (
  insert into contratos_arrendatarios (empresa_id, contrato_id, arrendatario_id)
  select c.empresa_id, c.id, a.id
  from contrato_803 c, arrendatario_jimmy a
  returning contrato_id
),
vinculo_1907a as (
  insert into contratos_arrendatarios (empresa_id, contrato_id, arrendatario_id)
  select c.empresa_id, c.id, a.id
  from contrato_1907a c, arrendatario_paul a
  returning contrato_id
)

select 'ok' as resultado;

commit;

-- ============================================================================
-- Verificación post-carga
-- ============================================================================
select 'propietarios' as tabla, count(*) from propietarios
union all select 'propiedades', count(*) from propiedades
union all select 'propietarios_propiedades', count(*) from propietarios_propiedades
union all select 'arrendatarios', count(*) from arrendatarios
union all select 'contratos', count(*) from contratos
union all select 'contratos_arrendatarios', count(*) from contratos_arrendatarios;
