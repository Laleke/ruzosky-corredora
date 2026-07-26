# Handoff — Modalidad "Administrador de Contratos de Arriendo" (sesión 2026-07-24)

> Documento de respaldo de la sesión donde se construyó la base de conocimiento de esta modalidad. `PROYECTO.md` mantiene solo el resumen y apunta aquí para el detalle completo. Ver también el contrato base en [`docs/CONTRATO_BASE_ARRIENDO.md`](CONTRATO_BASE_ARRIENDO.md).

## Objetivo de la modalidad

Reemplazar la gestión de arriendos vía corredora (AssetPlan) por administración directa de Eduardo, con apoyo sistémico de RZK Prop. Metodología usada: analizar contratos reales existentes → detectar cláusulas pro-corredora / riesgos / vacíos → validar reglas de negocio con Eduardo → redactar un contrato base propio.

## Contratos analizados

1. **`docs/CONTRATO DPTO 803.pdf`** — subarriendo AssetPlan (Arriendos AP SpA) ↔ Jimmy Eduardo Toro Morales. Vigencia 15-dic-2025 a 14-dic-2026. Renta $600.000. Garantía $600.000 en 3 cuotas.
2. **`docs/CONTRATO DPTO 1907-A.pdf`** — arriendo AssetPlan (Assetplan Asesores SpA) "en representación de" Eduardo ↔ Paul Edison Onetto Guerra. Vigencia original 1-jun-2023 a 31-may-2024 (renovado automáticamente desde entonces). Renta $295.000. Garantía $295.000 pago único.

Para cada uno se hizo: resumen ejecutivo, clasificación de cláusulas (mantener/modificar/eliminar/reforzar), detección de cláusulas pro-corredora/riesgos/vacíos legales, y lista de dudas — resueltas todas con Eduardo (ver sección "Decisiones de negocio validadas" más abajo).

## Hallazgo estructural importante

Ambas propiedades tenían la **misma estructura de dos contratos encadenados**: un arrendamiento cabecera entre Eduardo (dueño real, confirmado) y una entidad AssetPlan, y un subarrendamiento entre AssetPlan y el ocupante final. Esto se confirmó recién al revisar los finiquitos (ver más abajo) — inicialmente se había interpretado el 1907-A como "arriendo directo con mandato" por su redacción, pero en realidad también existía un contrato cabecera separado (22-jun-2021, no visto durante el análisis inicial).

## Decisiones de negocio validadas (para el contrato base, NO retroactivas a los 2 contratos existentes)

- Eduardo actúa como propietario directo; RZK Prop es solo apoyo sistémico (no hay figura de subarrendadora ni cesión de posición contractual tipo corredora).
- Pago: transferencia o Servipag, sin exclusividad ni fee de gestión. Pasarela propia queda para fase futura.
- Multa por mora: referenciada al **Interés Máximo Convencional (Ley 18.010)** vigente al momento de la mora, no una tasa fija — evita nulidad por tasa usuraria y no requiere reescribir el contrato si cambia la tasa.
- Reporte a boletín comercial (DICOM): por **simple retardo**, no mora consolidada.
- Reajuste de renta: **anual** (UF), estándar único. Cobro retroactivo de reajustes no cobrados con tope de **12 meses**.
- Término anticipado post año 1: **3 meses simétrico** para ambas partes (corrige la asimetría 60/90 días del contrato AssetPlan).
- Inspecciones: aviso previo de **1–2 semanas** (no "cuando se estime conveniente").
- Garantía: **1 pago único** como estándar; cuotas quedan como excepción configurable caso a caso.
- Pérdida de garantía por incumplimiento: proporcional al daño/deuda real acreditado, no automática por tecnicismos administrativos. La cláusula de incumplimiento remite al procedimiento legal (Ley 18.101) en vez de prometer restitución "sin más trámites".
- Caso fortuito: exención acotada a eventos posteriores a la entrega; no exime la responsabilidad del arrendador por el estado del inmueble al momento de entregarlo.
- Mascotas: política **configurable por propiedad**, según reglamento de copropiedad.
- Bodega/estacionamiento: campos opcionales.
- Cláusula de venta del inmueble: se mantiene simplificada como protección de continuidad del arriendo (el contrato sigue vigente con el nuevo dueño).
- Aval/codeudor solidario: opcional, a criterio del propietario/administrador.
- Documento de identidad no-chileno: se mantiene (aplica al perfil de arrendatarios de Eduardo).

**Cláusulas del contrato AssetPlan identificadas como pro-corredora (NO replicar):** pago exclusivo vía plataforma con fee de gestión sobre gastos comunes, cesión unilateral de la posición contractual "a su sola voluntad", pérdida total de garantía por tecnicismos administrativos sin daño real, reporte a DICOM como herramienta de presión de cobranza desproporcionada.

## Contrato base (v2) — estado

`docs/CONTRATO_BASE_ARRIENDO.md` incorpora todas las reglas anteriores. Los 4 puntos que requerían validación legal quedaron resueltos con criterio razonado (no es asesoría legal certificada — se recomienda una pasada de abogado antes del primer uso real sobre las cláusulas Cuarta, Sexta y Séptima). Quedan 2 pendientes de diseño (no legales): monto de los cargos por incumplimientos formales de garantía, y trasladar la tabla de precios de reparaciones al Anexo 1.

## Transición real de los 2 contratos existentes (cerrada operativamente)

- **Finiquito firmado con AssetPlan el 15-jul-2026** (ambos casos), de común acuerdo, con renuncia recíproca de acciones. Documentos: `docs/TERMINO CONTRATO DPTO 803.pdf` y `docs/TERMINO CONTRATO DPTO 1907-A.pdf`.
- Jimmy (803) y Paul (1907-A) **no se mudan** — continúan en las propiedades bajo contrato directo con Eduardo (arrendatarios ya firmaron, pendiente la firma de Eduardo al cierre de esta sesión).
- **Garantías traspasadas a Eduardo** (no devueltas a los arrendatarios, porque la ocupación continúa): $600.000 (803) + $295.000 (1907-A) = $895.000. Transferencia esperada ~1 semana después de la firma de Eduardo.

### Riesgos detectados en los finiquitos (revisión antes de firmar)

1. **Discrepancia de razón social**: el finiquito lo otorga "Assetplan Recaudación SpA" (RUT 76.306.153-1), pero los contratos originales fueron firmados por otras entidades del mismo grupo — "Arriendos AP SpA" (RUT 76.712.848-7) para el 803, "Assetplan Asesores SpA" (RUT 76.147.318-2) para el 1907-A. Recomendado: pedir a Torretti confirmación (correo basta) de que Assetplan Recaudación SpA está autorizada para dar este finiquito en nombre de esas entidades.
2. **Domicilio de Eduardo aparece como "Sin Domicilio"** en ambos finiquitos — campo de plantilla sin completar, pedir que lo corrijan antes de firmar.
3. **Papel de garantía de la encimera (departamento 803, Curiñanca) pendiente de entrega por AssetPlan.** La cláusula de finiquito amplio ("nada se adeudan") podría interpretarse como renuncia a exigirlo después. Recomendado: obtenerlo antes de firmar el finiquito del 803, o agregar una frase explícita excluyendo ese ítem de la renuncia.

## PENDIENTE — no cerrado aún

- [ ] **Confirmar razón social autorizada** en ambos finiquitos antes de firmar (ver riesgo #1).
- [ ] **Corregir domicilio** de Eduardo en los finiquitos (ver riesgo #2).
- [ ] **Resolver papel de garantía de la encimera (803/Curiñanca)** — obtenerlo antes de firmar o agregar cláusula de excepción al finiquito de esa propiedad (ver riesgo #3).
- [ ] Firma de Eduardo en ambos finiquitos, una vez resuelto lo anterior.
- [ ] Firma de Eduardo en los nuevos contratos directos con Jimmy y Paul (ya firmados por ellos).
- [ ] **Confirmar recepción efectiva de los $895.000** de garantía traspasada (~1 semana post-firma).
- [ ] Definir monto/criterio de los cargos acotados por incumplimientos formales de garantía en el contrato base (pendiente de diseño, no legal).
- [ ] Trasladar la tabla de precios de reparaciones al Anexo 1 del contrato base.
- [ ] Una vez firmados los contratos directos y confirmada la garantía, ingresar ambos contratos como los primeros datos reales en RZK Prop (registrar la garantía como **traspasada**, no como pago nuevo del arrendatario en este ciclo).

## Herramientas ya preparadas para el ingreso de datos reales

- `supabase/maintenance/limpiar_datos_prueba_2026-07-24.sql` — limpia todas las tablas de negocio antes de cargar datos reales (no toca `empresas`/`profiles`). Pendiente de ejecutar por Eduardo cuando esté listo.
