# Diseño de páginas de listado — RZK Prop

> Patrón de referencia definido en **Propiedades** (`src/app/(dashboard)/propiedades/page.tsx`), a aplicar en Propietarios, Arrendatarios y Contratos cuando se confirme. Mientras eso ocurre, esas 3 páginas pueden estar temporalmente en una versión anterior del diseño de tarjeta — no son la fuente de verdad, esta página sí.

## Paleta

- `--color-canvas` (`src/app/globals.css`): gris grafito de fondo de toda la app (no negro, no blanco). Mismo tono usado en el sidebar y en el topbar móvil — ninguna sección de la app debería quedar con fondo blanco salvo las tarjetas de contenido explícitas (`ui.card` genérico, usado en KPIs, formularios, estados vacíos).
- `--color-burgundy` / `--color-burgundy-strong`: tonos oscurecidos (dos tonalidades más oscuras que el burdeo original de marca) — son el fondo de las tarjetas de listado y de los botones primarios. `burgundy-strong` es el estado hover/oscurecido de `burgundy`.
- `--color-canvas-fg` / `--color-canvas-muted`: texto legible directo sobre el canvas oscuro (fuera de cualquier tarjeta) — usados en `PageHeader` y encabezados de página. **No** confundir con `text-ink`/`text-muted`, que siguen siendo para texto dentro de tarjetas blancas.
- Login/splash (PWA): fondo burdeo, no blanco ni gris (`manifest.webmanifest`, panel del formulario en `/login`).

## Encabezado de página (`PageHeader`)

- Título + botón de acción "+" **circular, junto al título** (no un botón de texto separado). Componente único (`src/components/page-header.tsx`) — cualquier cambio ahí se propaga a todas las páginas que lo usan.
- Descripción (subtítulo) debajo, en `text-canvas-muted`.

## Tarjeta de listado (`ui.listCard`)

Estructura de 2 filas, sin footer con línea separadora (se evitó a propósito para ahorrar espacio vertical):

**Fila 1 — identificación + estado:**
- Izquierda: dos líneas de texto — arriba un dato **secundario/corto** en `text-white/60` (ej. "Departamento - San Miguel", es decir `tipo - comuna`), abajo el dato **principal** en `text-white` y `font-medium` (ej. dirección). *Regla general: el campo más usado para reconocer visualmente el registro va abajo en grande; datos de contexto cortos van arriba, combinados con un separador " - " si son más de uno.*
- Derecha: badge de estado — **fondo sólido del color semántico, texto blanco** (`badge()` en `src/components/ui.ts`: success=emerald, warning=amber, danger=red, info=sky, neutral=stone).

**Fila 2 — disclosure + acciones (todo en una sola línea):**
- Un `<details>`/`<summary>` nativo (sin JS) con ícono `Info` + "Ver más información" — **sin ningún valor visible en la línea del summary**, todo el contenido secundario va dentro, expandido. Para Propiedades: precio de referencia, dormitorios/baños/estacionamientos/bodegas — **cada uno solo si tiene valor** (no se muestra la línea si el dato es null/0). El código interno **no se muestra en la tarjeta** (queda solo en el detalle de la propiedad).
- Los **íconos de acción** (lápiz = editar/detalle; switch on/off = activar/desactivar) van **fuera del `<details>`** pero en la misma fila visual (hermanos en un flex a la derecha), para que un click en ellos no dispare accidentalmente la apertura/cierre del disclosure.
- El switch on/off es un **componente de interruptor real** (`src/components/toggle-switch.tsx`, `ToggleSwitch`), no un ícono de flecha: pastilla verde con el círculo a la derecha cuando está activo, pastilla gris con el círculo a la izquierda cuando está inactivo.

**Estado inactivo:** la tarjeta completa baja a `opacity-60` — **mismo color base** (no cambia a gris ni a otro tono), solo se atenúa.

## Clases y componentes reutilizables

- `ui.cardGrid` — grid responsivo de tarjetas.
- `ui.listCard` — tarjeta base burdeo (agregar `opacity-60` condicional para inactivos).
- `ui.listCardDisclosure` — estilo del `<summary>`.
- `ui.listCardIconBtn` — botón/ícono circular de acción (lápiz).
- `ToggleSwitch` (`src/components/toggle-switch.tsx`) — switch on/off reutilizable, recibe `on` y `label`; se usa dentro de un `<form action={...}>`.

## Página de detalle + edición en línea (patrón definido en Propiedades)

Referencia: `src/app/(dashboard)/propiedades/[id]/page.tsx` + `src/features/propiedades/detalle-propiedad.tsx`.

- **Una sola pantalla, sin ruta `/editar` para los campos del registro.** El detalle es un panel `bg-burgundy` (`rounded-2xl p-6`) con un botón "Editar" (client component, `useState`) que activa el modo edición **campo por campo, en el mismo lugar del grid** — no reemplaza la sección por un formulario con otro layout. Cada `dt/dd` de solo-lectura se convierte en su input/select en la misma celda (mismo `label` arriba, mismo orden); nunca un modal ni una navegación a otra ruta.
- Implementación de referencia: `Campo` (`src/features/propiedades/detalle-propiedad.tsx`) recibe `editando` y renderiza `dd` de texto o el input correspondiente en el mismo espacio. Los 3 bloques (Ubicación, Características, Valorización) y Observaciones viven dentro de **un solo `<form>`** que se muestra siempre (los campos son de solo-lectura visual cuando `editando=false`, no hay un form separado por bloque).
- **Tipo de input según el dato:** numéricos (dormitorios, baños, estacionamientos, bodegas, superficies, montos) → `type="number"` con `inputMode="decimal"` (teclado numérico en el celular); fecha → `type="date"`; región/comuna → `Combobox` (con dependencia región→comuna); tipo/estado/moneda → `<select>`. Ningún campo se convierte a un `<input type="text">` genérico si tiene un tipo más específico disponible.
- Los bloques de datos (`Bloque`) usan fondo `bg-burgundy-strong` (un tono dentro del panel principal) y texto blanco/`white/50` para las etiquetas, en ambos modos (lectura y edición).
- "Volver" es un **botón** (`Link` con estilo de botón, ícono `ArrowLeft`, fondo `bg-white/10`), no un link de texto suelto.
- Al cancelar la edición, se vuelve al modo lectura **sin recargar la página** (estado local `editando`, no hay ruta de por medio). Al guardar, el server action redirige de vuelta al detalle (`/propiedades/${id}`), no al listado.
- El formulario de **creación** (`/propiedades/nueva`) ya no es un formulario tradicional — ver "Wizard de creación" más abajo.

## Wizard de creación (una pregunta a la vez)

Referencia: `src/features/propiedades/propiedad-wizard.tsx` (reemplazó por completo al antiguo `PropiedadForm`, que se eliminó — quedó huérfano tras este cambio).

- **Una sola pregunta visible por pantalla.** El orden de las preguntas sigue una secuencia estratégica: primero lo que define la propiedad (tipo, región, comuna), luego la dirección exacta, después características físicas, y al final estado/valorización (lo que más cambia en el tiempo).
- Navegación con **botones** (nunca links): "Atrás", "Omitir" (solo en preguntas no obligatorias), "Siguiente", y en la última pregunta "Guardar propiedad". Un indicador de progreso ("Pregunta X de N" + barra) arriba.
- **Solo región y comuna son obligatorias** (coincide con la validación real del server action `crearPropiedad`; el resto tiene default o puede quedar vacío). Se marcan con una etiqueta "Obligatoria" junto a la pregunta. Intentar avanzar sin responder una obligatoria muestra un error en vez de dejar pasar.
- Los campos que eran combobox (región, comuna) o `<select>` (tipo, estado, moneda) se mantienen como tal. Los numéricos usan `type="number"` con teclado numérico. Estacionamiento/Bodega mantienen el patrón *checkbox → revela campo numérico* (el número ingresado es el número de identificación del estacionamiento/bodega, no una cantidad — así se guarda y así se muestra después en la tarjeta de listado, ej. "Estacionamiento N° 54").
- Todo el estado de las respuestas vive en un único objeto en memoria (`valores`) dentro de un único `<form>`; la pregunta activa renderiza el input real (con su `name`), y todas las demás preguntas ya respondidas quedan como `<input type="hidden">` con el mismo `name` — así el envío final incluye todo, sin necesitar pasos de servidor intermedios ni perder lo ya contestado al navegar atrás/adelante.
- Al guardar, reutiliza el mismo server action `crearPropiedad` sin cambios.
- Rutas de gestión de **listas de N relaciones** (ej. copropietarios) sí pueden seguir en una sub-ruta propia (`/editar` quedó reservado solo para eso en Propiedades) — la regla de "edición en línea, sin modal" aplica al **registro principal**, no reemplaza tablas de relación con su propio flujo de alta/baja.

## Pendiente al replicar en Propietarios / Arrendatarios / Contratos

Cada página tiene sus propios campos — no es un copy-paste literal, hay que mapear qué dato va "arriba chico", qué va "abajo grande", y qué queda detrás del disclosure siguiendo el mismo criterio (dato de reconocimiento visual vs. dato de detalle):

- **Propietarios/Arrendatarios**: candidato natural es nombre (abajo, grande) + RUT o tipo de persona (arriba, chico); detrás del disclosure: email, teléfono.
- **Contratos**: candidato natural es propiedad/dirección (abajo, grande) + número de contrato (arriba, chico); valor visible en la fila del disclosure: canon; detrás del disclosure: fechas de inicio/término.

Confirmar el mapeo exacto con Eduardo antes de aplicar (no asumir automáticamente el mismo orden que Propiedades).
