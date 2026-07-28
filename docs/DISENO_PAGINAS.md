# Diseño de páginas — RZK Prop

> **Estado: cerrado y replicado en los 4 módulos activos (Propiedades, Arrendatarios, Propietarios, Contratos).** Este documento es la fuente de verdad del formato de página (listado, detalle+edición, creación) para todo el sistema. Implementación de referencia: `src/features/propiedades/`, `src/features/arrendatarios/`, `src/features/propietarios/`, `src/features/contratos/`.

## Paleta

- `--color-canvas` (`src/app/globals.css`): gris grafito de fondo de toda la app (no negro, no blanco). Mismo tono en el sidebar y el topbar móvil — ninguna sección debería quedar con fondo blanco salvo tarjetas de contenido explícitas (`ui.card` genérico: KPIs, formularios, estados vacíos).
- `--color-burgundy` / `--color-burgundy-strong`: tonos oscurecidos (dos tonalidades más oscuras que el burdeo original de marca) — fondo de tarjetas de listado, paneles de detalle/creación y botones primarios. `burgundy-strong` es el estado hover/oscurecido de `burgundy`.
- `--color-canvas-fg` / `--color-canvas-muted`: texto legible directo sobre el canvas oscuro (fuera de cualquier tarjeta) — usados en `PageHeader`, encabezados de página y **paneles de filtro** (`bg-white/10`). No confundir con `text-ink`/`text-muted`, que son para texto dentro de tarjetas blancas.
- Login/splash (PWA): fondo burdeo, no blanco ni gris (`manifest.webmanifest`, panel del formulario en `/login`).

## Encabezado de página (`PageHeader`)

- Título + botón de acción "+" **circular, junto al título** (no un botón de texto separado). Componente único (`src/components/page-header.tsx`) — cualquier cambio ahí se propaga a todas las páginas que lo usan.
- Descripción (subtítulo) debajo, en `text-canvas-muted`.

## Tarjeta de listado (`ui.listCard`)

Estructura de 2 filas, sin footer con línea separadora (se evitó a propósito para ahorrar espacio vertical):

**Fila 1 — identificación + estado:**
- Izquierda: dos líneas — arriba un dato **secundario/corto** en `text-white/60` (ej. "Departamento - San Miguel", es decir `tipo - comuna`), abajo el dato **principal** en `text-white font-medium` (ej. dirección). *Regla: el campo más usado para reconocer el registro va abajo en grande; datos de contexto cortos van arriba, unidos con " - " si son varios.*
- Derecha: badge de estado — **fondo sólido del color semántico, texto blanco** (`badge()` en `src/components/ui.ts`: success=emerald-800, warning=amber-600, danger=red-600, info=sky-600, neutral=stone-500).

**Fila 2 — disclosure + acciones (una sola línea):**
- `<details>`/`<summary>` nativo (sin JS) con ícono `Info` + "Ver más información" — sin ningún valor visible en la línea del summary, todo el contenido secundario va dentro, expandido, y **solo si tiene valor** (no se muestra la línea si el dato es null/0). El código interno de la propiedad no se muestra en la tarjeta (queda en el detalle).
- Los **íconos de acción** (lápiz = editar/detalle; switch on/off = activar/desactivar) van **fuera del `<details>`** pero en la misma fila (hermanos en un flex a la derecha) para que un click en ellos no dispare la apertura/cierre del disclosure.
- El toggle es un **switch real** (`src/components/toggle-switch.tsx`, `ToggleSwitch`), no un ícono de flechas: pastilla verde-oscuro (`bg-emerald-600`) con círculo a la derecha cuando está activo, pastilla gris (`bg-white/25`) con círculo a la izquierda cuando está inactivo.

**Estado inactivo:** la tarjeta completa baja a `opacity-60` — mismo color base, sin cambiar de tono.

**Filtros:** ícono `Filter` que despliega un panel `bg-white/10` (gris translúcido, **no** `ui.card` blanco) con los campos de filtro; arranca **siempre oculto** (con un puntito indicador si ya hay filtros aplicados) y vuelve a ocultarse tras aplicar. Ver componentes `FiltroPropiedades` / `FiltroArrendatarios` / `FiltroPropietarios`. El filtrado es server-side (`searchParams` → query), y las opciones de los `<select>` se arman desde valores realmente presentes en los datos, no listas estáticas. Orden del listado: alfabético por el campo principal (dirección en Propiedades; nombre en Arrendatarios/Propietarios).

**"Limpiar" vs. "Aplicar" — no son lo mismo:** los `<select>` del panel de filtro son **controlados** (`useState` local, inicializado desde los `searchParams` actuales). "Limpiar" es un botón `type="button"` que solo **resetea ese estado local a vacío** — no navega, no envía el formulario, no toca la lista todavía. Solo "Aplicar" (`type="submit"`) ejecuta el filtro (GET con lo que esté seleccionado en ese momento, incluido el caso de haber limpiado todo). Antes "Limpiar" era un `Link` que navegaba de inmediato a la URL sin filtros — eso hacía que aplicar y limpiar tuvieran timings distintos e inconsistentes entre sí; ahora ambos botones se comportan igual (cambian el formulario en pantalla) y es siempre "Aplicar" quien de verdad dispara el filtrado. **Pendiente**: el filtro de Cobros (`/cobros`, no migrado aún a este patrón visual) tiene el mismo defecto original (Limpiar como `Link` inmediato) — corregirlo cuando se migre esa página al formato general.

### Clases y componentes reutilizables
- `ui.cardGrid` — grid responsivo de tarjetas.
- `ui.listCard` — tarjeta base burdeo (+ `opacity-60` condicional si inactivo).
- `ui.listCardDisclosure` — estilo del `<summary>`.
- `ui.listCardIconBtn` — botón/ícono circular de acción (lápiz).
- `ToggleSwitch` — switch on/off, recibe `on` y `label`, se usa dentro de un `<form action={...}>`.

## Página de detalle + edición en línea

Referencia: `src/app/(dashboard)/propiedades/[id]/page.tsx` + `src/features/propiedades/detalle-propiedad.tsx`.

- **Una sola pantalla, sin ruta `/editar` para los campos del registro.** El detalle es un panel `bg-burgundy` (`rounded-2xl p-6`) con un botón "Editar" que activa edición **campo por campo, en el mismo lugar del grid** (mismo `label`, mismo orden) — nunca un modal ni una navegación a otra ruta ni un formulario con otro layout.
- Los bloques (`Bloque`) usan fondo `bg-burgundy-strong`, texto blanco/`white/50` para etiquetas, en ambos modos.
- **Tipo de input según el dato** (nunca texto genérico si hay uno más específico): numéricos → `type="number"` + `inputMode="decimal"`; fecha → `type="date"`; región/comuna → `Combobox` (dependientes); tipo/estado/moneda → `<select>`; estacionamiento/bodega → checkbox que revela un campo numérico (mismo patrón que la creación).
- Título, badges de código/estado y el botón "Editar" van **centrados como grupo**, con "Editar" en la misma línea que el título (no debajo, no en una esquina aparte).
- "Volver" es un **botón** (`onClick={() => router.back()}`, ícono `ArrowLeft`, `bg-white/10`) — **no** un `Link` a una ruta fija, para no perder filtros u otro estado de la página de origen al regresar.
- Al cancelar la edición, se vuelve a modo lectura sin recargar (estado local). Al guardar, el server action redirige de vuelta al **detalle** (no al listado).
- **Eliminar registro**: ver sección propia más abajo.
- Rutas de gestión de **listas de N relaciones** (ej. copropietarios) sí pueden vivir en su propia sub-ruta (`/editar` quedó reservado solo para eso en Propiedades) — la regla de "edición en línea, sin modal" aplica al **registro principal**, no reemplaza tablas de relación con su propio flujo de alta/baja.

## Eliminar un registro

- Antes de ofrecer el botón, **validar proactivamente** si el registro tiene relaciones que impedirían borrarlo (ej. `tieneRelacionesBloqueantes(id)` cuenta contratos/gastos de la propiedad). Si las tiene, la pantalla muestra directamente "No se puede eliminar: [motivo]" — no se ofrece el botón. Esta validación es una capa de UX; la integridad real la garantiza la base de datos (`on delete restrict` en las FK relevantes).
- UI del botón: **fondo blanco, texto rojo** (`bg-white text-red-600`), no un tono rojo apagado.
- **Nunca usar `confirm()`/`alert()` nativos del navegador.** La confirmación es una tarjeta propia (`bg-white/10`) con la pregunta y dos botones "Sí, eliminar" / "No", en el mismo estilo visual del resto de la app.
- ⚠️ **Gotcha real encontrado (Propiedades): un DELETE que no tiene política RLS no lanza error, simplemente afecta 0 filas** — PostgREST/Supabase filtra las filas visibles según RLS antes de aplicar el DELETE; sin una política `for delete`, ninguna fila "existe" para esa operación y la respuesta es éxito con 0 filas afectadas. Por eso el patrón correcto es encadenar `.select("id")` al `.delete()` y comprobar que `data` no venga vacío antes de asumir que se borró algo (ver `eliminarPropiedad` en `actions.ts`). Al crear cualquier tabla nueva o agregar borrado a una existente, **hay que agregar explícitamente la política `for delete`** (ver migración `0017_propiedades_delete.sql`) — no basta con que exista SELECT/UPDATE.
- **No usar `redirect()` de Next dentro de un server action que se invoca directo desde un `onClick` de cliente** (no vía `<form action>` ni `useActionState`) — es frágil combinarlo con lógica de verificación de filas afectadas. Mejor: la acción devuelve `{ error }`, y el componente cliente hace `router.push(...)` él mismo tras confirmar éxito.

## Wizard de creación (una pregunta a la vez)

Referencia: `src/features/propiedades/propiedad-wizard.tsx` (reemplazó por completo al formulario tradicional de creación).

- **Una sola pregunta visible por pantalla**, en un orden estratégico: primero lo que define el registro (ej. tipo, región, comuna), luego los datos exactos de identificación, después características, y al final lo que más cambia en el tiempo (estado/valorización).
- **Solo 2 botones de navegación: "Atrás" y "Siguiente"** (no hay "Omitir" — avanzar sin responder una pregunta no obligatoria ya cumple esa función; un botón menos). "Cancelar" vive en la **misma fila** que "Atrás"/"Siguiente" (no aislado arriba de la pantalla).
- Cabecera compacta: solo "Pregunta X de N" + una barra de progreso delgada, arriba a la derecha — nada de textos informativos grandes ni barras gruesas, porque el teclado del celular tapa la parte baja de la pantalla y hay que priorizar el espacio para el campo y los botones de navegación.
- **Solo los campos realmente obligatorios según el server action** llevan asterisco (`*`, en `text-amber-300`) junto a la pregunta — no una pastilla de texto aparte. Intentar avanzar sin responder una obligatoria muestra un error en vez de dejar pasar.
- Tipo de input igual que en el detalle (combobox, select, numérico con teclado numérico, checkbox→número para estacionamiento/bodega). **Ojo:** no todo campo "numérico" en apariencia debe forzarse a `type="number"` — si el dato real puede traer letras (ej. depto "1907-A"), debe quedar como texto; confirmar con Eduardo antes de forzar un tipo más estricto en un campo existente.
- Todas las respuestas viven en un único objeto de estado (`valores`) dentro de un único `<form>`; la pregunta activa renderiza el input real (con su `name`), las demás quedan como `<input type="hidden">` con el mismo `name` — el envío final incluye todo.
- **Foco automático**: el contenedor del input activo usa `key={paso}` para forzar remount en cada paso (si no, `autoFocus` de React solo dispara en el montaje inicial).
- **Preguntas condicionales**: un paso puede omitirse automáticamente según una respuesta previa (ej. "Número de departamento" se salta si el tipo es "Casa") y su texto puede adaptarse dinámicamente (ej. "¿Número de departamento?" vs. "¿Número de oficina?").
- **Cancelar con confirmación propia** (no `confirm()` nativo): al presionar "Cancelar" se muestra una tarjeta "Se perderá el avance. ¿Cancelar de todas formas?" con "Sí, cancelar" / "No". Al confirmar, se limpia el borrador (`localStorage`) y se navega al listado.
- **Borrador persistente** (`localStorage`, clave propia por wizard, ej. `rzk:draft:propiedad-wizard`): guarda `{ paso, valores }` en cada cambio y lo restaura al volver a entrar — soluciona perder el avance si el usuario sale de la app a mitad de la creación. Se limpia al enviar el formulario o al cancelar confirmando.
- Al guardar, reutiliza el mismo server action de creación de siempre, sin cambios.

## Arrendatarios (replicado, referencia adicional)

- Tarjeta: RUT (arriba, chico) + nombre/razón social (abajo, grande); disclosure con email/teléfono/comuna solo si tienen valor.
- Detalle: bloques Identificación (tipo de persona, RUT, nombres/apellidos **o** razón social según tipo), Contacto (email, teléfono), Dirección (región/comuna combobox, calle, número) — mismo patrón de edición en línea que Propiedades.
- Wizard de creación (`arrendatario-wizard.tsx`): confirmado que sí lleva wizard pese a ser un formulario corto — prioridad es consistencia de la experiencia de creación en todos los módulos. El tipo de persona (natural/jurídica) determina dinámicamente qué preguntas son obligatorias y cuáles se omiten (`requerido`/`omitirSi` como funciones de los valores acumulados, no solo booleanos fijos — necesario porque "nombre/apellido" son obligatorios solo si es persona natural, y "razón social" solo si es jurídica).
- Eliminar: a diferencia de Propiedades, la FK `contratos_arrendatarios.arrendatario_id` es `on delete cascade`, **no** `restrict` — la base de datos no bloquea el borrado de un arrendatario con contratos por sí sola. La validación previa (¿tiene contratos vinculados?) se hace en la capa de aplicación (`tieneContratosVinculados`), no se puede delegar 100% a la base de datos como en Propiedades.
- Migración `0018_arrendatarios_delete.sql`: agrega la política RLS de DELETE que faltaba (mismo gotcha que Propiedades).

## Propietarios (replicado, referencia adicional)

- Mismo patrón que Arrendatarios (comparten forma: persona natural/jurídica + contacto + dirección), más un bloque extra "Datos bancarios" (banco, tipo de cuenta, N° de cuenta, titular, RUT del titular) — ninguno obligatorio.
- Eliminar: a diferencia de Arrendatarios, aquí sí hay una FK `restrict` real (`liquidaciones.propietario_id`) que bloquea el borrado en la base de datos si el propietario tiene liquidaciones — no depende solo de una validación de aplicación. `propietarios_propiedades` es `cascade` (no bloquea); `documentos`/`gastos` son `set null` (no bloquean, quedan huérfanos).
- Migración `0019_propietarios_delete.sql`: agrega la política RLS de DELETE que faltaba (mismo gotcha que las anteriores).

## Contratos (replicado 2026-07-27)

Mismo patrón (tarjetas, detalle con edición en línea, wizard de creación), con estas diferencias deliberadas respecto al mapeo original propuesto:

- Tarjeta: número de contrato (arriba, chico) + propiedad/dirección (abajo, grande); disclosure con fechas de inicio/término y canon. Filtros colapsables por estado y activo (`filtro-contratos.tsx`).
- Detalle: bloques Propiedad y estado, Fechas, Canon y reajuste (periodicidad solo visible si el reajuste no es "sin_reajuste"), Comisión y administración (comisión/administración monto-o-% solo visibles si aplica), Observaciones. Propiedad se edita con un `<select>` (no `Combobox`) — decisión de alcance: el `Combobox` genérico del proyecto asume que el valor mostrado y el valor guardado son el mismo string (funciona para Región/Comuna/Banco), pero Propiedad necesita id≠label; construir un combobox con búsqueda que preserve el id quedó fuera de esta sesión. Con pocas propiedades reales, el `<select>` nativo es suficiente — revisar si la lista crece mucho.
- **Arrendatarios del contrato**: a diferencia de Propiedades (que separó la gestión de copropietarios a una ruta `/editar` aparte), en Contratos la tabla de arrendatarios vinculados + el formulario de asignar quedaron **embebidos directamente en `/contratos/[id]`** (mismo panel burdeo, debajo del detalle) — no existe ruta `/contratos/[id]/editar`. Es una sola relación N:M relativamente simple, no justificaba una pantalla aparte.
- **Wizard de creación**: solo pide datos propios del contrato (propiedad, fechas, canon, reajuste, comisión, administración, observaciones) — **no** pide arrendatarios ahí. Los arrendatarios se asignan después, desde el detalle del contrato recién creado. Esto replica el comportamiento que la pantalla de creación ya tenía antes del rediseño (nunca pidió arrendatario), así que no es una regresión.
- Eliminar: `cargos.contrato_id` es `on delete restrict` — bloquea el borrado si el contrato tiene cargos (cobros) generados; se valida proactivamente en `tieneRelacionesBloqueantes` antes de ofrecer el botón. `contratos_arrendatarios` es `cascade`, `documentos`/`gastos` son `set null` — ninguno de esos dos bloquea. Migración `0020_contratos_delete.sql` agrega la política RLS de DELETE que faltaba (mismo gotcha que las 3 anteriores).

### Bug encontrado y corregido: el input del wizard no se guardaba en la última pregunta

Al construir el wizard de Contratos se encontró un bug real ya presente en los 3 wizards existentes (Propiedades, Arrendatarios, Propietarios): el input **actualmente visible** (la pregunta que se está respondiendo) nunca tenía atributo `name` — solo los inputs ocultos de las preguntas ya respondidas lo tenían. Un `<input>`/`<select>`/`<textarea>` sin `name` no se incluye en el `FormData` al enviar el formulario. Efecto concreto: **el valor de la última pregunta de cada wizard nunca se guardaba**, sin importar lo que el usuario escribiera ahí (`rut_titular` en Propietarios, `numero` en Arrendatarios, `observaciones` en Propiedades). Pasaba desapercibido porque los 3 campos afectados son opcionales — se veía como "no lo llenó", no como un error.

Corregido en esta sesión agregando `name={p.key}` (o el nombre correspondiente) a cada rama de input visible en los 3 wizards existentes, y construyendo `contrato-wizard.tsx` con `name` desde el inicio. Región/Comuna/Banco no tenían este problema porque usan `Combobox`, que siempre renderiza su propio input oculto con `name` independientemente de si está "visible" o no.
