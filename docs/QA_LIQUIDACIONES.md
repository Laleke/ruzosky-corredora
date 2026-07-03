# QA y resumen — Módulo Liquidaciones a Propietarios

RZK Prop · Fase 1A + ajustes finales · 2026-06-29

---

## 1. Resumen para ChatGPT

**Módulo Liquidaciones a Propietarios: implementado, build de producción verde, desplegado en Vercel.**

Permite a la corredora calcular automáticamente cuánto transferir a cada propietario por período, con trazabilidad contable completa.

**Modelo de datos (migraciones 0011–0014):**
- `liquidaciones` — cabecera: propietario, período, subtotales, total, estado (pendiente/pagada/anulada), número correlativo `LIQ-AAAA-000001`, registro de pago (fecha/observación) + `comprobante_url` (estructura para adjuntar después).
- `liquidacion_detalles` — líneas tipo ingreso/descuento, con `concepto`, `observacion`, `referencia_tipo` (`cargo`/`contrato`/`manual`) y `referencia_id` para trazabilidad.
- `auditoria` — eventos genéricos (usuario, acción, entidad, datos jsonb).
- Todo multitenant (`empresa_id`) con RLS solo-admin.

**Lógica de cálculo:**
- **Ingresos** = pagos efectivamente recibidos sobre cargos del período, ponderados por el **% de participación** del propietario en la propiedad. Nunca cargos impagos.
- **Descuentos** = comisión de administración (mensual: % del arriendo cobrado o monto fijo) + comisión de corretaje (**una sola vez** por contrato, controlada por `corretaje_liquidado`).
- **Ajustes manuales** (ingreso/descuento + concepto + monto + observación) se agregan en la vista previa, recalculan el total en vivo y se persisten como detalle `manual`.

**Reglas / garantías:**
- **Congelamiento**: una vez creada, la liquidación guarda montos y líneas; nunca se recalcula ni se ve afectada por cambios posteriores (documento contable).
- **Corretaje único**: se marca al liquidar; se revierte si la liquidación se anula.
- **Bloqueo de edición**: marcar pagada y anular solo desde estado `pendiente`; pagada/anulada son de solo lectura.
- **Sin duplicados**: índice único parcial `(empresa, propietario, período)` salvo anuladas.
- **Numeración**: correlativa por empresa, visible en listado, detalle y PDF.

**UI:** asistente (propietario → período → vista previa con ajustes → confirmar), listado con filtros (propietario/estado), detalle con líneas + totales + historial de pago, marcar pagada, anular, y **PDF vía impresión** (print-to-PDF, sin dependencias).

**Pendiente / decisiones abiertas:**
- Adjuntar comprobante de pago (columna `comprobante_url` lista; falta Storage + UI).
- Integración con servicios (Enel/Aguas Andinas): no hay API pública; vía agregador (Fintoc/Floid/Servipag) a futuro. Hoy: cargos manuales luz/agua/internet.

**Pregunta para ChatGPT:** ¿próximos pasos recomendados y nuevas funcionalidades para llevar el producto a operación plena?

---

## 2. Checklist de QA

> Requisito previo: migraciones `0009`–`0014` aplicadas en Supabase. Tener un propietario con propiedad asociada, contrato vigente y **pagos registrados** en Cobros para el período a probar.

### Generación
- [x] Liquidaciones → Nueva → seleccionar propietario + período con pagos → la vista previa muestra ingresos por cargo pagado (ponderados por % participación) y descuentos (admin/corretaje).
- [x] Período sin movimientos → mensaje "No hay movimientos…" y no permite generar.
- [x] Confirmar → redirige al detalle con número `LIQ-AAAA-000001`.

### Ajustes manuales
- [x] "+ Agregar ajuste" agrega fila (tipo, concepto, monto, observación).
- [x] El total a liquidar se recalcula en vivo al cambiar montos/tipos.
- [x] Tras confirmar, el ajuste aparece en el detalle marcado "(ajuste)" con su observación.
- [x] Permite múltiples ajustes; los inválidos (sin concepto o monto ≤ 0) se ignoran.

### Congelamiento
- [x] Generar una liquidación; luego registrar un pago nuevo o editar un contrato → la liquidación ya creada **no cambia** sus montos.

### Corretaje único
- [x] Contrato con comisión de corretaje → aparece como descuento en la primera liquidación que lo incluye. 
- [x] Generar la liquidación → el corretaje **no reaparece** en una liquidación posterior del mismo contrato.
- [] Anular esa liquidación → el corretaje **vuelve a estar disponible** para liquidar.

### Bloqueo de edición
- [x] Liquidación `pendiente`: muestra "Registrar pago" y "Anular".
- [x] Marcar pagada (fecha + observación) → pasa a `pagada`, muestra el pago, **oculta** acciones de edición.
- [ ] Liquidación `pagada`/`anulada`: solo lectura (sin marcar pagada ni anular).

### Numeración correlativa
- [ ] Dos liquidaciones del mismo año → `LIQ-2026-000001`, `LIQ-2026-000002`.
- [ ] El número se ve en listado, detalle y en el PDF/impresión.

### PDF
- [ ] En el detalle, "Descargar PDF" abre el diálogo de impresión sin la navegación lateral (solo el documento).

### Seguridad / multitenant
- [ ] Un usuario solo ve/opera liquidaciones de su empresa (RLS).
- [ ] Anon sin sesión no accede (consulta REST devuelve vacío).

### Regresión
- [ ] Módulos previos (propietarios, propiedades, arrendatarios, contratos, cobros) siguen funcionando sin cambios.
- [ ] `npm run build` sin errores.

---

## 3. Errores resueltos durante la puesta en marcha
- `relation "public.liquidacion_detalles" does not exist`: se intentó aplicar `0012` antes de `0011`. **Solución:** aplicar migraciones en orden estricto (0011 crea las tablas).
