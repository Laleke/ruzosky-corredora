# CONTRATO BASE DE ARRENDAMIENTO — RZK Prop (Borrador v2)

> **Estado: BORRADOR v2 — reglas de negocio y redacción cerradas con Eduardo.** Pendiente de una pasada final de un abogado antes del primer uso real (ver sección "Estado — v2" al final).
> Los campos entre `[CORCHETES]` son variables que se completan por contrato (los llenará la app RZK Prop).

---

## CONTRATO DE ARRENDAMIENTO

En [CIUDAD], a [FECHA], entre don/doña **[NOMBRE PROPIETARIO]**, [NACIONALIDAD], [ESTADO CIVIL], [PROFESIÓN/OFICIO], cédula de identidad número **[RUT PROPIETARIO]**, domiciliado en **[DOMICILIO PROPIETARIO]**, en adelante el **"Arrendador"**; y por la otra parte don/doña **[NOMBRE ARRENDATARIO]**, [NACIONALIDAD], [ESTADO CIVIL], [PROFESIÓN/OFICIO], cédula de identidad número **[RUT ARRENDATARIO]**, domiciliado en **[DOMICILIO ARRENDATARIO]**, en adelante el **"Arrendatario"**, ambos mayores de edad, quienes exponen que han acordado celebrar el siguiente contrato de arrendamiento.

*(Nota de diseño: a diferencia del contrato AssetPlan, aquí el Arrendador es directamente el propietario — no hay figura de subarrendadora ni de gestor con poder de representación amplio. Si en el futuro RZK Prop actúa como mandatario de un tercer propietario, se agrega un párrafo de personería equivalente al "Primero: Antecedentes" del contrato 1907-A, sin ceder posición contractual.)*

### PRIMERO: ANTECEDENTES

Don/Doña [NOMBRE PROPIETARIO] es dueño(a) del inmueble ubicado en **[DIRECCIÓN COMPLETA]**, [DEPARTAMENTO/CASA N°], comuna de **[COMUNA]**, ciudad de [CIUDAD]. [SI APLICA: además, se incluyen en este contrato la bodega N° [N°] y/o el estacionamiento N° [N°] del mismo condominio.]

### SEGUNDO: USO DE LA PROPIEDAD

El Arrendador entrega en arrendamiento al Arrendatario, quien acepta para sí, el inmueble individualizado en la cláusula anterior.

El Arrendatario se obliga a destinar la propiedad exclusivamente como casa habitación para él/ella y su familia, acordando expresamente las partes que esta obligación es un elemento esencial de este contrato. Forman parte integrante de este contrato el acta de entrega y el inventario que las partes suscriben en este mismo acto, dejando constancia de que no existe mobiliario ni instalaciones que califiquen este arriendo como afecto a IVA.

**Mascotas:** [CONFIGURABLE POR PROPIEDAD — completar según reglamento de copropiedad del edificio]
- [ ] No se permite la tenencia de mascotas en el inmueble.
- [ ] Se permite la tenencia de mascotas bajo las siguientes condiciones: máximo [N] kg, especies permitidas [perros/gatos/peces en pecera/otras], prohibición de especies exóticas/peligrosas/protegidas, uso de correa en áreas comunes, responsabilidad del Arrendatario por daños que la mascota cause, cumplimiento de la Ley de Tenencia Responsable de Mascotas (Ley 21.020) y del Reglamento de Copropiedad vigente.

### TERCERO: VIGENCIA DEL CONTRATO

El presente contrato regirá a contar del día **[FECHA INICIO]** y vencerá el día **[FECHA TÉRMINO]** (12 meses). Si ninguna de las partes da aviso de no renovación con al menos 60 días de anticipación al vencimiento (mediante carta certificada, carta notarial o correo electrónico a las direcciones señaladas en la cláusula de comunicaciones), el contrato se renovará automáticamente por períodos iguales y sucesivos de un año.

**Término anticipado antes del primer año:** la parte que decida terminar el contrato antes de cumplirse el primer año de vigencia deberá pagar a la otra parte una multa equivalente a dos meses de renta.

**Término anticipado después del primer año (simétrico — CERRADO):** transcurrido un año de vigencia, cualquiera de las partes —Arrendador o Arrendatario— podrá poner término anticipado al contrato, debiendo notificar a la otra parte con al menos **tres meses (90 días) de anticipación**, mediante carta certificada, carta notarial o correo electrónico a las direcciones señaladas en la cláusula de comunicaciones. El Arrendatario que ejerza esta facultad deberá seguir pagando la renta mensual hasta la fecha de restitución efectiva del inmueble.

*(Decisión final: se corrige la asimetría del contrato AssetPlan —60 días arrendatario vs. 90 días arrendador— unificando en 3 meses simétricos para ambas partes. Cierra el pendiente #7 de la v1.)*

**Visitas por venta o no renovación:** en caso de no renovación, o si el Arrendador decide vender el inmueble, el Arrendatario se obliga a facilitar el acceso a interesados en días y horas acordadas entre las partes, al menos dos horas en tres días de la semana, durante los últimos 60 días de vigencia del contrato.

### CUARTO: RENTA, PLAZO DE PAGO, REAJUSTE Y MORA

La renta mensual de arrendamiento será de **$[MONTO]** (equivalente a [N] UF a la fecha de firma), pagadera anticipadamente dentro de los primeros 5 días de cada mes.

**Forma de pago:** transferencia bancaria a la cuenta informada por el Arrendador, o mediante la plataforma de pago que este indique (ej. Servipag), sin costo adicional de gestión para el Arrendatario. *(Decisión: sin exclusividad de plataforma ni fee de gestión — a diferencia del contrato AssetPlan.)*

**Reajuste:** la renta se reajustará **anualmente**, de acuerdo con la variación de la Unidad de Fomento entre la fecha de inicio del contrato y la fecha del reajuste. Si por cualquier motivo el reajuste no fue cobrado oportunamente, el Arrendador podrá cobrar retroactivamente las diferencias no pagadas dentro de un plazo máximo de **12 meses contados desde la fecha en que correspondía aplicar el reajuste**, evitando así un derecho de cobro indefinido. *(Resuelto: se fija un plazo conservador y simple de administrar —un ciclo de reajuste completo—. [Confirmar con abogado, al redactar el primer contrato real, contra el plazo de prescripción aplicable a obligaciones periódicas de arriendo antes de firmar; no se asume esto como asesoría legal definitiva.])*

Si la Unidad de Fomento fuera derogada o modificada en su forma de cálculo, el reajuste se calculará según la variación del Índice de Precios al Consumidor (INE).

**Mora:** el simple retardo en el pago de la renta y/o gastos comunes, contado desde el día 5 de cada mes, constituirá en mora al Arrendatario, quien deberá pagar como multa, por cada día de atraso, el equivalente al **interés máximo convencional que determine la Comisión para el Mercado Financiero (CMF) conforme a la Ley N° 18.010, vigente a la fecha de la mora, para operaciones de crédito de dinero no reajustables en moneda nacional de monto y plazo equivalente**, aplicado sobre el monto adeudado. *(Resuelto: se reemplaza la tasa fija de 2% diario del contrato AssetPlan —que excede largamente el IMC y sería nula en esa parte— por una referencia dinámica a la tasa legal vigente, evitando tener que actualizar el contrato cada vez que cambie la tasa. [Confirmar con abogado/contador, al momento de usar este contrato, que la referencia al segmento de crédito citado —no reajustable, monto y plazo equivalente— es la correcta para este tipo de obligación.])*

**Gastos comunes y servicios:** si al día 24 de cada mes el Arrendatario mantuviera una deuda de gastos comunes o servicios básicos de más de un período, el Arrendador podrá incluir dichas sumas en el cobro mensual siguiente, **sin recargo de gestión** *(se elimina el fee de 0,2 UF+IVA del contrato AssetPlan)*. El Arrendatario es responsable de informar sus pagos a la administración del edificio para la correcta actualización de los sistemas de gastos comunes.

### QUINTO: ENTREGA Y RESTITUCIÓN

La entrega material del inmueble se efectúa en la fecha de inicio del contrato, en perfectas condiciones de uso y funcionamiento, desocupado, con los servicios de luz, agua y gas en correcto estado y pagados hasta esa fecha — estado que el Arrendatario conoce y acepta, obligándose a restituir el inmueble en las mismas condiciones al término del contrato.

Toda mejora que efectúe el Arrendatario será de su exclusivo costo y quedará a beneficio de la propiedad, salvo aquellas que puedan retirarse sin detrimento del inmueble.

Al término del contrato, el Arrendatario deberá restituir la propiedad completamente desocupada, entregando las llaves en día y horario hábil, previa coordinación con el Arrendador o su administrador.

**Salvoconducto:** con al menos 5 días hábiles de anticipación a la entrega, el Arrendatario deberá solicitar al Arrendador (o su administrador) la emisión de un salvoconducto, adjuntando comprobantes de pago al día de renta, gastos comunes y servicios básicos. Emitido el salvoconducto, se coordinará la entrega formal, dejando constancia del estado del inmueble en un acta firmada por ambas partes.

### SEXTO: OBLIGACIONES DEL ARRENDATARIO

Serán obligaciones del Arrendatario:

a) Pagar la renta dentro del plazo indicado en la cláusula cuarta.
b) Pagar los gastos comunes, fondo de reserva y consumos de energía eléctrica, gas y agua, con puntualidad.
c) Mantener el inmueble en perfecto estado de conservación y aseo, realizando a su costo las reparaciones locativas necesarias (llaves de paso, válvulas, flexibles, flotadores de servicios sanitarios, enchufes e interruptores, etc.).
d) Cuidar los bienes entregados y cumplir toda obligación que la ley señale de su cargo.
e) Solicitar autorización previa al Arrendador para introducir mejoras u obras en el inmueble.
f) Cumplir el destino habitacional de la propiedad y respetar el Reglamento de Copropiedad del edificio.
g) Responder de los deterioros que cause en bienes comunes o en el resto del edificio, e indemnizar al Arrendador por los perjuicios que provengan de su hecho, culpa o de quienes comprometan su responsabilidad civil.
h) Reembolsar al Arrendador cualquier multa, tasa, derecho o impuesto que este deba pagar producto de infracciones cometidas por el Arrendatario, sus agentes o dependientes.
i) Respetar las prohibiciones establecidas en la cláusula novena.

**Incumplimiento:** el incumplimiento grave de las obligaciones anteriores da derecho al Arrendador a poner término anticipado al contrato y a exigir la restitución del inmueble **por las vías que la ley franquea**, incluyendo el procedimiento judicial de terminación de arrendamiento y restitución que corresponda conforme a la Ley N° 18.101, además del pago de las rentas vencidas, cuentas adeudadas y gastos comunes pendientes. La pérdida de garantía en estos casos será proporcional al daño o deuda efectivamente acreditado (ver cláusula décima), no automática. *(Resuelto: se elimina la fórmula "sin más trámites" y "sin devolución de garantía" del contrato AssetPlan —que sugiere una restitución que la ley no permite hacer por autotutela— reemplazándola por una remisión explícita al procedimiento legal aplicable. [Confirmar con abogado, al redactar el contrato real, la cita correcta de la ley/procedimiento vigente para arriendos urbanos, ya que puede variar según el tipo de inmueble y la vía elegida.])*

### SÉPTIMO: CASOS FORTUITOS

El Arrendador no responderá por robos o hurtos ocurridos en el inmueble, ni por los perjuicios que el Arrendatario sufra con motivo de sismos, actos terroristas, incendios, inundaciones, filtraciones, roturas de cañerías, humedad, calor u otro caso fortuito o fuerza mayor **ocurrido durante la vigencia del arrendamiento y ajeno a la voluntad del Arrendador**. Esta exención no alcanza a defectos de habitabilidad o vicios de la cosa arrendada existentes al momento de la entrega, los que se rigen por las reglas generales del Código Civil sobre obligaciones del arrendador. *(Resuelto: se mantiene la exención por caso fortuito post-entrega —estándar y razonable—, acotándola expresamente para no confundirla con la responsabilidad del Arrendador por el estado del inmueble al momento de entregarlo, que es una obligación distinta y no renunciable. [Confirmar con abogado si existe alguna otra norma de habitabilidad puntual aplicable al tipo de inmueble antes de firmar el primer contrato real.])*

### OCTAVO: INSPECCIÓN

El Arrendador (o su administrador) podrá inspeccionar la propiedad hasta una vez cada tres meses, dando aviso previo al Arrendatario con al menos **[1 a 2 semanas]** de anticipación y coordinando día y horario hábil. *(Decisión: se reemplaza "cuando lo estime conveniente" del contrato AssetPlan por un aviso previo razonable.)*

### NOVENO: PROHIBICIONES

Se prohíbe al Arrendatario:

a) Subarrendar o ceder a cualquier título, total o parcialmente, este contrato o el uso del inmueble.
b) Modificar o alterar las instalaciones de gas, agua o electricidad.
c) Suscribir convenios de pago sobre gastos comunes o cuentas de servicios vencidas sin autorización del Arrendador.
d) Introducir o almacenar materiales nocivos, inflamables, explosivos o mal olientes.
e) Ocasionar ruidos o molestias a los vecinos.
f) Introducir o hacer funcionar equipos que generen contaminación, riesgo para la salud o para la seguridad del inmueble.
g) Mantener mascotas en condiciones distintas a las pactadas en la cláusula segunda.
h) Hacer residir en la propiedad a más de dos personas por dormitorio (el living/comedor no cuenta como dormitorio; niños menores de 5 años no se contabilizan).

### DÉCIMO: GARANTÍA

El Arrendatario entrega en garantía al Arrendador la cantidad de **$[MONTO]** (equivalente a un mes de renta), en **un pago único** al momento de la firma. *(Nota: se deja abierta, como excepción configurable caso a caso y no como regla general, la posibilidad de pactar el pago de la garantía en cuotas para un contrato específico.)*

El Arrendatario deberá solicitar la liquidación de la garantía dentro de los 90 días siguientes a la restitución del inmueble a satisfacción del Arrendador. La liquidación se realizará, sin reajuste, dentro de los 30 días siguientes a dicha solicitud.

El Arrendador podrá descontar de la garantía: el valor de reparaciones necesarias para dejar el inmueble en condiciones óptimas (según daño real verificado, con la tabla de precios referenciales del Anexo 1), días proporcionales de renta pendientes, y cuentas pendientes de servicios o gastos comunes de cargo del Arrendatario. En ningún caso el Arrendatario podrá imputar esta garantía al pago de la renta, incluido el último mes de vigencia.

**Retiro con salvoconducto:** el retiro de la propiedad debe hacerse con el salvoconducto de la cláusula quinta; sin este documento, el Arrendatario no podrá solicitar la devolución de la garantía.

**Descuentos por incumplimientos formales:** *(Decisión: se reemplaza la pérdida total automática de garantía del contrato AssetPlan por causales administrativas — ej. no pedir salvoconducto, no firmar finiquito a tiempo— por un esquema proporcional.)* El incumplimiento de plazos administrativos (solicitud de salvoconducto, firma de finiquito, aviso de término, solicitud de liquidación dentro de plazo) genera un **cargo específico y acotado** contra la garantía (a definir monto/criterio), pero **no la pérdida total automática** salvo que exista además daño real o deuda equivalente al monto de la garantía.

*(Ver Anexo 1: tabla de precios unitarios de reparaciones — se mantiene la tabla del contrato AssetPlan como referencia documentada de costos de mercado, para uso en la liquidación de garantías futuras.)*

### DÉCIMO PRIMERO: NOTIFICACIÓN A BOLETINES COMERCIALES

El Arrendatario [y su aval, si corresponde] autorizan expresamente al Arrendador (o a quien este designe para la gestión de cobranza) para que, en caso de **simple retardo**, mora o incumplimiento de las obligaciones de este contrato, pueda comunicar sus datos y los derivados de este contrato a terceros, incluyendo bases de datos de boletines comerciales (ej. DICOM de Equifax).

### DÉCIMO SEGUNDO: COMUNICACIONES

Las partes se obligan a comunicar, dentro de 3 días hábiles, cualquier modificación de su correo electrónico o teléfono. De no cumplir esta obligación, se tendrán por válidas las notificaciones dirigidas al correo electrónico señalado en la cláusula de firma.

### DÉCIMO TERCERO: JURISDICCIÓN

Para todos los efectos legales y contractuales, las partes fijan domicilio especial en la ciudad de [CIUDAD] y se someten a la jurisdicción de sus Tribunales de Justicia.

### DÉCIMO CUARTO: AVAL Y CODEUDOR SOLIDARIO (OPCIONAL)

*(Decisión: opcional, a definir por el propietario/administrador según el perfil de riesgo del arrendatario — no es obligatorio en todos los contratos.)*

[SI APLICA] Presente a este acto don/doña **[NOMBRE AVAL]**, [NACIONALIDAD], [ESTADO CIVIL], [PROFESIÓN], cédula de identidad número **[RUT AVAL]**, domiciliado en **[DOMICILIO AVAL]**, quien se constituye en aval y codeudor solidario del Arrendatario respecto de todas las obligaciones de este contrato, aceptando desde ya las modificaciones que las partes puedan introducirle en cuanto a renta, plazo u otras estipulaciones.

### DÉCIMO QUINTO: DOCUMENTO DE IDENTIDAD

En caso de que el Arrendatario y/o su aval hayan firmado este contrato usando un documento de identificación distinto a la cédula de identidad chilena, se obligan a regularizar su firma ante notario usando la cédula chilena, dentro de un plazo de 5 meses desde el inicio del contrato, corriendo los gastos notariales por su cuenta. El incumplimiento de este plazo genera un cargo adicional mensual de **$[MONTO]** hasta su regularización.

### DÉCIMO SEXTO: CONTINUIDAD DEL ARRIENDO ANTE VENTA DEL INMUEBLE

Si el Arrendador transfiere el dominio del inmueble arrendado durante la vigencia de este contrato, el contrato **subsiste** con el nuevo propietario en los mismos términos, sin necesidad de declaración adicional. El adquirente se obliga a respetar y cumplir todas las obligaciones de este contrato. *(Nota: esta cláusula protege la continuidad del arriendo para el Arrendatario ante una venta — es distinta de la cesión unilateral de posición contractual "a su sola voluntad" que tenía el contrato AssetPlan para beneficio de la corredora, y que aquí no aplica porque el Arrendador es el propietario real.)*

### DÉCIMO SÉPTIMO: FIRMA

Las comunicaciones entre las partes se dirigirán a:
- Arrendador: **[CORREO ARRENDADOR / ADMINISTRADOR]**
- Arrendatario: **[CORREO ARRENDATARIO]**

Este contrato se firma en dos ejemplares de idéntico tenor, quedando uno en poder de cada parte.

---

_________________________
**[NOMBRE PROPIETARIO]**
Arrendador
Rut: [RUT PROPIETARIO]

_________________________
**[NOMBRE ARRENDATARIO]**
Arrendatario
Rut: [RUT ARRENDATARIO]

[SI APLICA]
_________________________
**[NOMBRE AVAL]**
Aval
Rut: [RUT AVAL]

---

## Anexo 1 — Tabla de precios unitarios de reparaciones (referencia)

*(Se mantiene la tabla completa del contrato AssetPlan como documento de referencia de costos de mercado. Pendiente de trasladar/actualizar valores en una siguiente iteración — no se transcribe aquí para no duplicar contenido; ver los PDF originales en `docs/CONTRATO DPTO 803.pdf` y `docs/CONTRATO DPTO 1907-A.pdf`, página 7-9 de cada uno.)*

---

## Estado — v2 (cerrado con Eduardo, [FECHA])

Los 4 puntos de validación legal de la v1 y el pendiente #7 (simetría de plazos) quedaron **resueltos con el mejor criterio disponible** en el cuerpo del contrato (ver notas "*(Resuelto: ...)*" en cada cláusula). Esto **no reemplaza una revisión de un abogado** antes de usar este contrato con un arrendatario real — son decisiones de diseño razonadas, no asesoría legal certificada. Se recomienda una única pasada de un abogado sobre las cláusulas Cuarta, Sexta y Séptima antes del primer uso real.

### Pendientes de diseño (no legales)

1. Definir el criterio/monto de los "cargos específicos y acotados" por incumplimientos formales en la garantía (cláusula 10°) — hoy queda como placeholder.
2. Trasladar y actualizar (si corresponde) la tabla de precios unitarios de reparaciones al Anexo 1.
