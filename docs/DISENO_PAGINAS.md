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
- Izquierda: dos líneas de texto — arriba un dato **secundario/corto** en `text-white/60` (ej. comuna), abajo el dato **principal** en `text-white` y `font-medium` (ej. dirección). *Regla general: el campo más usado para reconocer visualmente el registro va abajo en grande; un campo de contexto corto va arriba en chico.* Para Propiedades: arriba = comuna, abajo = dirección (el código interno se movió al detalle expandible — es un dato de trazabilidad interna, no el principal para reconocer la propiedad a simple vista).
- Derecha: badge de estado — **fondo sólido del color semántico, texto blanco** (`badge()` en `src/components/ui.ts`: success=emerald, warning=amber, danger=red, info=sky, neutral=stone). Ya no es "fondo pastel + texto de color".

**Fila 2 — disclosure + valor + acciones (todo en una sola línea):**
- Un `<details>`/`<summary>` nativo (sin JS) como disclosure de información secundaria — ícono `Info` + "Ver más información". Al expandirse, muestra los campos que no son críticos para escanear la lista (para Propiedades: código interno, tipo, y la leyenda "Inactivo" si aplica).
- El **valor/monto principal** (ej. valor de arriendo) se muestra siempre a la misma altura que el disclosure, alineado a la derecha del `<summary>` — no queda oculto ni en su propia fila.
- Los **íconos de acción** (lápiz = editar/detalle; toggle on/off = activar/desactivar) van **fuera del `<details>`** pero en la misma fila visual (hermanos en un flex), para que un click en ellos no dispare accidentalmente la apertura/cierre del disclosure.
- El ícono toggle usa color semántico: verde (`text-emerald-400`) cuando está activo, rojo (`text-red-400`) cuando está inactivo — no solo cambia de forma (`ToggleRight`/`ToggleLeft`), también de color.

**Estado inactivo:** la tarjeta completa baja a `opacity-60` — **mismo color base** (no cambia a gris ni a otro tono), solo se atenúa. No se agrega una etiqueta "(inactivo)" visible en la fila 1; queda mencionado dentro del disclosure para quien quiera confirmarlo.

## Clases reutilizables (`src/components/ui.ts`)

- `ui.cardGrid` — grid responsivo de tarjetas.
- `ui.listCard` — tarjeta base burdeo (agregar `opacity-60` condicional para inactivos).
- `ui.listCardDisclosure` — estilo del `<summary>`.
- `ui.listCardIconBtn` — botón/ícono circular de acción (agregar color semántico para el toggle según estado).

## Pendiente al replicar en Propietarios / Arrendatarios / Contratos

Cada página tiene sus propios campos — no es un copy-paste literal, hay que mapear qué dato va "arriba chico", qué va "abajo grande", y qué queda detrás del disclosure siguiendo el mismo criterio (dato de reconocimiento visual vs. dato de detalle):

- **Propietarios/Arrendatarios**: candidato natural es nombre (abajo, grande) + RUT o tipo de persona (arriba, chico); detrás del disclosure: email, teléfono.
- **Contratos**: candidato natural es propiedad/dirección (abajo, grande) + número de contrato (arriba, chico); valor visible en la fila del disclosure: canon; detrás del disclosure: fechas de inicio/término.

Confirmar el mapeo exacto con Eduardo antes de aplicar (no asumir automáticamente el mismo orden que Propiedades).
