# Checklist de formato — páginas nuevas

> Complementa `docs/DISENO_PAGINAS.md` (fuente de verdad detallada, con el
> razonamiento de cada decisión). Este archivo es el **checklist rápido**
> para aplicar el formato completo a un módulo nuevo sin dejar piezas fuera
> — nació porque al migrar Cobros/Liquidaciones/Gastos/Documentos/Reportes
> se aplicaron el wizard y el filtro colapsable, pero se quedaron afuera las
> tarjetas de listado, el combobox con buscador y la posición del mensaje
> de cancelar. No repetir ese error: revisar los 6 puntos siempre, no solo
> los que parezcan más obvios.

## 1. Listado → tarjetas `ui.listCard`, nunca `<table>`

Aunque el módulo sea "tabular" por naturaleza (cargos, liquidaciones,
gastos, documentos), el listado va en `ui.cardGrid` + `ui.listCard`, **no**
en un `<table>`. Estructura de 2 filas (ver `DISENO_PAGINAS.md` para el
detalle exacto):
- Fila 1: secundario corto arriba (`text-white/60`) + principal abajo en
  negrita (`text-white font-medium`) a la izquierda; badge de estado a la
  derecha.
- Fila 2: `<details>`/`<summary>` "Ver más información" a la izquierda +
  íconos de acción (`ui.listCardIconBtn`) a la derecha, fuera del
  `<details>` para que no disparen su apertura/cierre.
- Si el módulo no tiene "activo/inactivo", omite el `opacity-60` condicional
  y el `ToggleSwitch` — no todos los módulos lo necesitan (ej. Cobros no
  tiene noción de activar/desactivar un cargo).
- Si no hay acción de "editar" (el registro es inmutable tras crearse, ej.
  Cobros/Liquidaciones/Documentos), el ícono de la fila 2 es de **ver
  detalle** (`Eye`, no `Pencil`) — el `Pencil` implica que se puede editar
  ahí mismo.

## 2. Selectores de entidad (id ≠ label) → `ComboboxOpcion`, fondo blanco

Cualquier selector donde el usuario elige una entidad de una lista
potencialmente larga (Propiedad, Propietario, etc.) usa
`src/components/combobox-opcion.tsx` (`ComboboxOpcion`) — buscador con
fondo blanco igual al de Región/Comuna en Propiedades (`Combobox`,
`src/components/combobox.tsx`), no un `<select>` nativo plano.

- `Combobox` (el original) asume que **el valor guardado y el texto
  mostrado son el mismo string** (Región, Comuna, Banco) — sirve para eso,
  no para Propiedad/Contrato.
- `ComboboxOpcion` es la variante para listas `{id, label}[]` donde el id
  guardado es distinto del label mostrado/buscado (Propiedad, Propietario).
  Mismo look & feel (input con buscador, dropdown blanco con sombra),
  separando id de label internamente.
- Reservar el `<select>` nativo para enums cortos y fijos (estado, tipo de
  cargo, categoría) donde no hace falta buscar.
- Si son pocas opciones (ej. Contrato dentro de una Propiedad, casi
  siempre 1) el `<select>` nativo simple sigue siendo aceptable — el
  buscador se justifica cuando la lista puede crecer (Propiedades,
  Propietarios), no para sub-listas acotadas por selección previa.

## 3. Wizard de creación: "Cancelar" como overlay centrado (patrón único, igual en los 8 wizards)

**Todo** wizard de una pregunta a la vez — nuevo o de los 4 originales —
usa el mismo overlay para la confirmación de "Cancelar": centrado en toda
la pantalla, con fondo oscurecido, igual que Propietarios (referencia
real, `propietario-wizard.tsx`):

```tsx
{confirmandoCancelar && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-burgundy-strong p-5 shadow-lg">
      <p className="text-center text-sm text-white">
        Se perderá el avance de {/* entidad */}. ¿Cancelar de todas formas?
      </p>
      {/* botones Sí, cancelar / No */}
    </div>
  </div>
)}
```

**No** un banner anclado arriba de la pantalla (`fixed inset-x-0 top-0`,
sin oscurecer el fondo) — esa variante se probó y se descartó; no calzaba
con el patrón ya validado en Propiedades/Arrendatarios/Propietarios/Contratos.
Aplicado en los 8 wizards (los 4 originales + `cargo-wizard.tsx`,
`gasto-wizard.tsx`, `documento-wizard.tsx`, `seleccion-wizard.tsx` de
Liquidaciones — este último sin borrador en `localStorage`, pero con el
mismo botón y overlay).

## 3b. Autofoco: nunca en un paso tipo combobox

`autoFocus` en el input activo del wizard es correcto para texto/número/
fecha/select, pero **no** para un paso que usa `Combobox`/`ComboboxOpcion`
— el foco automático dispara `onFocus` y abre el listado desplegado de
inmediato al entrar al paso, sin que el usuario haya hecho nada, y se ve
mal. Omitir `autoFocus` específicamente en esos pasos (dejar que el
usuario haga clic para abrirlo).

## 4. Componentes compartidos con variante clara/oscura

Cualquier componente compartido que se vaya a usar tanto en un formulario
sobre `ui.card` blanco como dentro de un wizard/listCard burdeo necesita
una variante de color explícita (prop `oscuro`), no asumir un solo
contexto:

- `AccionesArchivo` (documentos): prop `oscuro` — íconos `text-white/80`
  en vez de `ui.linkAction` (burdeo, invisible sobre fondo burdeo).
- Si se reutiliza `SelectorPropiedadContrato` dentro de un wizard, no
  reusar sus labels tal cual (`ui.label`, oscuros) — construir el paso a
  mano con labels `text-white`, como se hizo en `cargo-wizard.tsx` /
  `gasto-wizard.tsx` / `documento-wizard.tsx` (`SelectorPropiedadWizard`
  interno a cada archivo, no un componente compartido — cada wizard
  integra Propiedad→Contrato→Arrendatario con su propio estado central de
  `valores`, no con el estado interno de `SelectorPropiedadContrato`).

## 5. Filtro colapsable

Igual que `FiltroContratos`/`FiltroPropiedades`: panel `bg-white/10`
oculto por defecto, ícono `Filter`/`X`, punto indicador si hay filtros
aplicados, selects **controlados** (`useState` local), "Limpiar" solo
resetea ese estado local (`type="button"`) y "Aplicar" es el único que
dispara el filtrado (`type="submit"`). Nunca un `Link` para "Limpiar" —
navega de inmediato y rompe la simetría con "Aplicar".

## 6. Objetos/lógica de negocio: no tocar solo por aplicar formato

Cuando una pantalla tiene lógica de negocio propia que no es "una entidad
con campos" (ej. la vista previa de ingresos/descuentos/gastos al generar
una Liquidación), el formato se aplica alrededor de esa lógica (wizard para
elegir los parámetros de entrada, tarjetas para listar registros), pero el
cálculo/objeto de negocio en sí **no se reescribe** — ver
`seleccion-wizard.tsx` (solo arma la URL con propietario+período) vs.
`liquidaciones/nueva/page.tsx` (preview y confirmación intactos).

## 7. Pantallas de detalle simples (sin edición en línea): mismo burdeo + `BotonVolver`

Cobros/Documentos/Gastos tienen pantallas de detalle que **no** editan el
registro campo por campo (cargo/documento inmutables tras crearse) — igual
así van en panel(es) `bg-burgundy`/`bg-burgundy-strong`, texto blanco,
tablas internas (pagos, versiones) en la misma paleta oscura (`thOscuro`/
`tdOscuro` locales, no `ui.th`/`ui.td` que son para tablas en `ui.card`
blanco). "Volver" usa el componente compartido `src/components/boton-volver.tsx`
(`BotonVolver`, con `router.back()`) en vez de un `<Link>` a una ruta fija
— necesario porque estas pantallas son Server Components y el botón debe
ser un Client Component aparte. Referencia real: `cobros/[id]/page.tsx`.
