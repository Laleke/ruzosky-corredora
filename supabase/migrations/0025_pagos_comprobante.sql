-- =============================================================
-- 0025_pagos_comprobante.sql
-- Permite adjuntar un comprobante (documento ya subido) a un pago,
-- igual patrón que gastos.documento_id (0016_gastos.sql).
-- =============================================================

alter table public.pagos
  add column documento_id uuid references public.documentos(id) on delete set null;
