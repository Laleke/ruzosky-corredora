-- =============================================================
-- 0039_backfill_comprobantes_propiedad.sql
-- Corrige los comprobantes de pago que quedaron ligados SOLO al contrato.
--
-- Problema: `documentos.propiedad_id` quedaba null en los comprobantes, y el
-- listado de Documentos filtra por propiedad (también cuando se filtra por
-- arrendatario o propietario, que se resuelven a un conjunto de propiedades).
-- Resultado: los comprobantes desaparecían del listado en cuanto se aplicaba
-- cualquiera de esos filtros. El código ya no los crea así (deriva la
-- propiedad desde el contrato), pero las filas existentes hay que arreglarlas.
--
-- Además se les pone un nombre distinguible: todos se llamaban igual
-- ("Comprobante de pago" / "Comprobante de pago (solicitud arrendatario)"),
-- así que no había forma de saber a qué pago correspondía cada uno.
--
-- Idempotente: solo toca filas que aún tienen propiedad_id null / nombre viejo.
-- Última modificación: 2026-08-07
-- =============================================================

-- 1) Propiedad y arrendatario derivados del contrato del comprobante.
update public.documentos d
set propiedad_id = c.propiedad_id
from public.contratos c
where d.contrato_id = c.id
  and d.categoria = 'comprobante_pago'
  and d.propiedad_id is null;

-- 2) Nombre con concepto y período del cargo al que corresponde el pago.
--    Se llega vía el pago que apunta a este documento (`pagos.documento_id`).
update public.documentos d
set nombre = 'Comprobante de pago — ' ||
  case cg.tipo_cargo
    when 'arriendo' then 'Arriendo'
    when 'gasto_comun' then 'Gasto común'
    when 'administracion' then 'Administración'
    when 'luz' then 'Luz'
    when 'agua' then 'Agua'
    when 'internet' then 'Internet'
    when 'multa' then 'Multa'
    when 'ajuste' then 'Ajuste'
    else 'Otro'
  end || ' ' || to_char(cg.periodo, 'MM/YYYY')
from public.pagos p
join public.cargos cg on cg.id = p.cargo_id
where p.documento_id = d.id
  and d.categoria = 'comprobante_pago'
  and d.nombre in ('Comprobante de pago', 'Comprobante de pago (solicitud arrendatario)');

-- 3) Fecha del documento = fecha del pago, para que ordene y filtre por fecha real.
update public.documentos d
set fecha_documento = p.fecha_pago
from public.pagos p
where p.documento_id = d.id
  and d.categoria = 'comprobante_pago'
  and d.fecha_documento is null;
