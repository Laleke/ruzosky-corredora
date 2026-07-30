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

## 3. Wizard de creación: mensaje de "Cancelar" como overlay arriba de la pantalla

El wizard de una pregunta a la vez sigue el patrón de
`DISENO_PAGINAS.md` (progreso, Atrás/Siguiente, borrador en
`localStorage`), **con un ajuste**: la tarjeta de confirmación "Se perderá
el avance. ¿Cancelar de todas formas?" ya no se renderiza inline dentro del
panel burdeo (empujando el contenido hacia abajo) — va en un overlay fijo
arriba de la pantalla completa:

```tsx
{confirmandoCancelar && (
  <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-4">
    <div className="flex flex-col items-center gap-2 rounded-xl bg-burgundy-strong p-4 shadow-lg">
      {/* mensaje + botones Sí, cancelar / No */}
    </div>
  </div>
)}
```

Referencia real: `src/features/cobros/cargo-wizard.tsx`,
`src/features/gastos/gasto-wizard.tsx`,
`src/features/documentos/documento-wizard.tsx`.

> Pendiente: los 4 wizards originales (Propiedades, Arrendatarios,
> Propietarios, Contratos) todavía usan el overlay inline antiguo — no se
> tocaron en esta migración para no arriesgar un flujo ya validado. Si se
> vuelve a tocar alguno de esos wizards, aplicar este mismo patrón ahí
> también para que los 8 wizards queden consistentes.

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
