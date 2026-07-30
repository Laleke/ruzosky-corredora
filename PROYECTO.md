# PROYECTO

## Resumen del Proyecto
**RZK Prop** — Plataforma SaaS de administración inmobiliaria para Chile. Centraliza propiedades, contratos de arriendo, propietarios, arrendatarios, pagos, finanzas, tickets de mantención y documentos. Reemplaza procesos manuales (Excel, WhatsApp, correo) por un sistema digital único.

El producto es una **PWA** (no app nativa): funciona como web e instalable en Android e iPhone. Multitenant desde el diseño, pero opera inicialmente con una sola empresa (RZK Prop).

## Estado Actual
**Fase: en PRODUCCIÓN (Vercel), desplegándose con cada push. Transición activa a uso con datos reales (modalidad "Administrador de Contratos de Arriendo" — ver Punto de Continuación).**
App **RZK Prop** operativa: auth, dashboard con KPIs (simplificado a 3: Propiedades vs arrendadas, Deuda pendiente, Cargos morosos) + **Dashboard Operativo (tareas pendientes)**, y módulos **Propietarios, Propiedades (+copropiedad N:M), Arrendatarios, Contratos (+ reajuste de canon vía UF con revisión manual), Cobros (cargos+pagos, listado en acordeón por período), Liquidaciones (con descuento automático de gastos), Documentos (Storage privado + versiones), Gastos (fuente oficial) y Reportes Financieros**. **Menú completo activado** (2026-07-29): los 5 módulos que estaban ocultos (Cobros, Liquidaciones, Gastos, Documentos, Reportes) ya aparecen en el sidebar y **ya tienen el mismo patrón de diseño que Propiedades/Propietarios/Arrendatarios/Contratos** (tarjetas burdeo, filtro colapsable con buscador, wizard de creación). **23 migraciones (`0001`–`0023`) aplicadas y verificadas en Supabase.** Build de producción verde, `tsc` limpio, **Vitest** con 12 pruebas. **PWA con banner de actualización** ("Hay una versión nueva — Actualizar", vía `SerwistProvider`) para que un deploy nuevo no quede invisible en pestañas ya abiertas.
**UI: patrón de página unificado y consistente en los 9 módulos** (listado en tarjetas burdeo, detalle con edición en línea, wizard de una pregunta a la vez con overlay de Cancelar centrado igual en los 8 wizards, filtro colapsable con buscador `ComboboxOpcion` para Propiedad/Propietario/Arrendatario, fechas siempre en `dd/mm/yyyy` vía `src/lib/fecha.ts`). Fuente de verdad: `docs/DISENO_PAGINAS.md` + `docs/PAGINAS_NUEVAS.md` (checklist rápido de 7 puntos).
**Filosofía vigente: app centrada en la Propiedad** — el usuario solo elige Propiedad + datos; propietario/contrato/arrendatario se derivan automáticamente (ver "Simplificación de flujo"). **Roadmap oficial de Hardening** y **Backlog QA** (reglas R1–R5) siguen **sin avance** — todo el foco de las últimas sesiones fue UI/UX (rediseño completo, reajuste de canon, formato de fechas, arriendo por adelantado).
Ciclo operable: propiedad → (propietario/contrato/arrendatario auto) → cargos/cobros → pagos → gastos → liquidación al propietario (con gastos descontados) → reportes.

## Punto de Continuación (handoff — actualizar al cerrar cada sesión)

**Última sesión: 2026-07-29 (segunda mitad — 4 commits más sobre la misma fecha).** App **en producción** (Vercel), redeploy con cada push. Repo `github.com/Laleke/ruzosky-corredora`. Rama `main` **pusheada hasta `dd2eec8`**, autorizado explícitamente por Eduardo en cada push. Sin cambios sin commitear al cerrar. `tsc --noEmit` y `next build` verdes tras cada entregable — **ninguno de estos cambios se verificó en navegador real** (sin Playwright/chromium-cli en el entorno); todo el feedback de ajuste vino de capturas de pantalla que Eduardo mandó desde su celular.

### ✅ Migraciones 0021/0022/0023 ejecutadas — 0020 aún sin confirmar

`canon_actual`, `canon_uf_base` y `fecha_proximo_reajuste` existen en `contratos` en producción. Migración `0020_contratos_delete.sql` (pendiente de sesiones anteriores) — **sigue sin confirmación explícita** de que se haya ejecutado.

### Resumen de los 4 commits de esta sesión (`f6629b0`→`6409c8b`→`8c8be69`→`dd2eec8`)

1. **`f6629b0`** — Los avisos y paneles de resumen de Cobros/Liquidaciones (contratos sin arriendo, reajuste pendiente, generación asistida, deuda total, liquidaciones pendientes) pasan de tarjeta blanca a burdeo/texto blanco. Reportes completo a burdeo también: KPIs, paneles de gráficos **y la paleta de colores de `src/components/charts.tsx` recalibrada** (grillas/ejes/barras en tonos claros — la paleta original era oscura, pensada para fondo blanco, invisible sobre burdeo). **Bug real corregido**: `aplicarReajusteUF` avanzaba `fecha_proximo_reajuste` un período completo aunque se aplicara el reajuste *antes* de la fecha de revisión (corrigiendo el canon a mitad de trimestre) — se habría saltado la próxima revisión real; ahora solo avanza la fecha si hoy ya alcanzó o pasó `fecha_proximo_reajuste`.
2. **`6409c8b`** — Tres correcciones de formato + una regla de negocio nueva:
   - **Overlay de "Cancelar" unificado** en los 8 wizards (centrado, fondo oscurecido `bg-black/60`, igual que Propietarios) — se encontró que `propiedad-wizard.tsx` (el wizard de referencia original) había quedado con el estilo viejo sin el overlay fijo; corregido junto con los 3 wizards nuevos y el de Liquidaciones (que no tenía botón Cancelar).
   - `ComboboxOpcion` ya no hace `autoFocus` en los pasos de wizard (abría la lista desplegada solo al entrar al paso, se veía mal).
   - Pantalla "ver cobro" (`/cobros/[id]`) convertida a burdeo/texto blanco; nuevo componente compartido `src/components/boton-volver.tsx` (`BotonVolver`, `router.back()`) para "Volver" en páginas que son Server Component.
   - **Regla de negocio nueva: el arriendo se paga por adelantado** → `periodoArriendoVigente()` en `src/features/cobros/queries.ts` calcula el período a generar/revisar como el mes **siguiente** al actual, no el mes calendario en curso (aplicado al aviso "sin arriendo generado", el período por defecto de "Generación asistida", y la tarea del Dashboard). Liquidaciones no se tocó (revisa lo ya cobrado, es otro concepto). La primera tarjeta de Cobros ahora también muestra cuántas propiedades tienen arriendo sin generar y la deuda **proyectada** (canon vigente de esos contratos, no el saldo de cargos ya generados).
   - **Bug de zona horaria real, encontrado por feedback de Eduardo** (la tarjeta seguía mostrando julio en vez de agosto): `periodoArriendoVigente()` construía la fecha del mes siguiente y llamaba `.toISOString()` — esa conversión a UTC puede retroceder un día (y por lo tanto un mes) en una zona horaria con offset negativo respecto a UTC como Chile. Reescrito con aritmética de meses pura (`getFullYear()*12 + getMonth()`), sin pasar por `Date`/UTC en ningún punto. **Lección**: cualquier cálculo de "período siguiente" en este proyecto debe evitar `new Date(...).toISOString()` para derivar mes/año — usar aritmética entera.
3. **`8c8be69`** — Cuatro cambios grandes en la misma sesión:
   - **Fechas en `dd/mm/yyyy` en toda la app**: nueva utilidad `src/lib/fecha.ts` (`formatearFecha`, `formatearPeriodo`), aplicada en ~25 lugares que mostraban fechas ISO crudas (Cobros, Contratos, Gastos, Liquidaciones, Documentos, incluyendo los `Campo`/`Dato` de solo lectura en Contratos/Propiedades).
   - **"Registrar pago" → wizard**: se quita el formulario inline de `/cobros/[id]`; nueva ruta `/cobros/[id]/pagos/nuevo` con `src/features/cobros/pago-wizard.tsx` (mismo patrón: preguntas, overlay de Cancelar, borrador no aplica porque no tiene sentido para un pago puntual). Se eliminó `registrar-pago.tsx` (reemplazado, sin otros usos).
   - **Filtros → combobox**: los `<select>` de Propiedad/Propietario/Arrendatario en los 5 filtros nuevos (Cobros, Liquidaciones, Gastos, Documentos, Reportes) pasan a `ComboboxOpcion`, igual que Región en Propiedades.
   - **Cobros — acordeón por período**: el listado de cargos ya no es una grilla plana de tarjetas; se agrupa por período (mes/año) en un `<details>` — "Deuda pendiente" a la izquierda, monto del período + mes/año a la derecha, y al desplegar los cargos individuales quedan separados por una línea fina (`divide-white/10`), manteniendo "ver más información"/ícono "ver"/badge de estado igual que antes. "Generación asistida" ahora solo se muestra si hay contratos sin arriendo generado para el período (antes siempre visible).
4. **`dd2eec8`** — El botón "+" circular de "Registrar pago" (nuevo en el punto anterior) se veía mal ("feo" — feedback textual de Eduardo); se reemplazó por un botón de **ancho completo** de la sección, mismo estilo burdeo/texto blanco que las tarjetas de acordeón.

### Resumen de la primera mitad de esta sesión (`ae74a4a`→`85c0f0a`→`fb5afbc`→`bb5c404`, ya documentado, sin repetir detalle)

Botón atrás generalizado (sube un nivel en la ruta); sistema de reajuste de canon vía UF con revisión manual (nunca automático — `canon_actual`/`canon_uf_base`/`fecha_proximo_reajuste`, migraciones `0021`–`0023`); menú completo activado + patrón de diseño replicado en los 5 módulos que estaban ocultos; primera corrección de formato (tarjetas, `ComboboxOpcion`, overlay de cancelar — con el bug de la primera pasada, corregido en la segunda mitad arriba).

### Resumen de lo hecho la sesión previa 2026-07-27 (5 commits, en orden)

1. **`0bb6edb`** — Ajustes de campos en Propietarios/Arrendatarios (detalle + creación), feedback de probar en el celular:
   - RUT con máscara en vivo (`formatearRut` en `lib/rut.ts`, `12.345.678-9`), en RUT y RUT del titular.
   - Banco: de texto libre a `Combobox` con catálogo `data/bancos.ts`.
   - N° de cuenta: filtra a solo dígitos (`formatearNumeroCuenta`), se guarda como texto (no `type=number`, para no perder ceros a la izquierda).
   - "Titular de la cuenta" → label acortado a "Titular" (el `name="titular_cuenta"` no cambió).
   - Email: `type=email` + validación de estructura (`esEmailValido` en `lib/contacto.ts`) en wizard, detalle y servidor; en lectura se renderiza con `<wbr/>` antes del `@` (`EmailTexto`) para que el salto de línea no se sobreponga al teléfono.
   - Teléfono: `type=tel` + filtro a dígitos y un único `+` inicial (`formatearTelefono`), sin formato rígido de agrupamiento.
   - Botones del wizard: fila `grid grid-cols-3` (Cancelar/Atrás/Siguiente en posiciones fijas).
   - Confirmación de "Cancelar" del wizard: de tarjeta inline a **overlay fijo** (`fixed inset-0`) centrado sobre toda la pantalla.
2. **`4fd0ab1`** — **Contratos**, patrón de diseño replicado (tarjetas + filtros estado/activo, detalle con edición en línea, wizard de creación, eliminar con validación previa). Decisiones de alcance documentadas en `docs/DISENO_PAGINAS.md` (sección "Contratos"): Propiedad se edita con `<select>` nativo (no `Combobox`, por id≠label); arrendatarios del contrato embebidos en el mismo `/contratos/[id]` (sin ruta `/editar` aparte); el wizard de creación no pide arrendatarios (se asignan después, igual que la pantalla vieja). Se eliminó `contrato-form.tsx` (reemplazado). **Bug real encontrado de paso y corregido en los 3 wizards existentes**: el input de la pregunta *activa* nunca tenía `name`, así que el navegador no lo mandaba en el `FormData` — la última pregunta de cada wizard nunca se guardaba (`rut_titular`/`numero`/`observaciones`, pasaba desapercibido por ser campos opcionales). Detalle técnico en `docs/DISENO_PAGINAS.md`.
3. **`b0d663b`** — Tres pedidos puntuales: (a) botón atrás del celular (Android) ahora **siempre vuelve a `/dashboard`** en cualquier página — decisión de producto explícita, no un bug (`src/components/back-to-dashboard.tsx`, trampa de historial con `pushState`/`popstate`; efecto secundario aceptado: salta la confirmación de "Cancelar" del wizard si se usa a mitad de uno, sin pérdida de datos porque el borrador sigue en `localStorage`); (b) primer intento de unificar el select de "Tipo de cuenta" con `select-styled.tsx` (select nativo + chevron); (c) Dashboard con tema burdeo nuevo + 3 indicadores nuevos (Ocupación %, Propietarios activos, Arrendatarios activos).
4. **`84f6718`** — El intento (b) de arriba **no fue suficiente**: un `<select>` nativo en el celular sigue abriendo el picker del sistema operativo sin importar el CSS. Eduardo pidió tomar Región/Comuna como referencia real. Se creó `src/components/select-combo.tsx` (mismo comportamiento que `Combobox` — lista propia, sin picker nativo — pero soporta pares `{value, label}`, necesario porque el label mostrado no es el value guardado en el enum de Postgres). Aplicado a Tipo de cuenta en detalle y wizard de Propietarios. `select-styled.tsx` queda solo para Tipo de persona (2 opciones, sin el mismo reclamo).
5. **`db46805`** — Tarjetas KPI del Dashboard eran demasiado altas (ícono arriba + bloque de texto apilado abajo); se comprimieron a una sola fila (ícono + valor/label + flecha), angostando la tarjeta.

También pendientes de ejecutar (dependientes de que Eduardo confirme fechas/datos, no urgentes):
- `supabase/maintenance/limpiar_datos_prueba_2026-07-24.sql` (antes de cargar datos reales)
- `supabase/maintenance/cargar_datos_reales_803_1907A.sql` (carga a Eduardo como propietario + las 2 propiedades reales + Jimmy/Paul + contratos directos — tiene 3 campos marcados "AJUSTAR" antes de correr)

### Modalidad "Administrador de Contratos de Arriendo" — conocimiento cerrado, transición operativa

Contrato base propio redactado y cerrado (`docs/CONTRATO_BASE_ARRIENDO.md`, v2). Detalle completo del análisis de los 2 contratos AssetPlan (803, 1907-A), decisiones de negocio y transición (finiquitos, garantías traspasadas) en **`docs/ADMINISTRADOR_CONTRATOS_ARRIENDO_SESION_2026-07-24.md`** — ese documento tiene su propia lista de pendientes sin cerrar (firma de finiquitos, confirmación de razón social AssetPlan, papel de garantía de la encimera en 803, recepción de $895.000). Revisarlo antes de ingresar esos 2 contratos como datos reales.

### Rediseño de UI — nueva identidad visual + patrón de páginas

Nueva etapa de la app (uso con datos reales, no solo demo): tema oscuro grafito + burdeo (antes blanco), y un **patrón de página unificado** documentado en **`docs/DISENO_PAGINAS.md`** + **`docs/PAGINAS_NUEVAS.md`** (checklist rápido — léelos primero si vas a tocar cualquier página de listado/detalle/creación):

- **Tarjetas de listado** burdeo (no blancas ni `<table>`), badges de estado con fondo sólido, disclosure "Ver más información" para datos secundarios, switch on/off real (si aplica), filtros colapsables detrás de un ícono (arrancan ocultos, "Limpiar" solo resetea el formulario sin navegar — "Aplicar" es quien ejecuta el filtro).
- **Detalle de un registro**: panel burdeo único, edición **campo por campo en el mismo grid** al presionar "Editar" (nunca un formulario aparte ni modal — salvo Gastos, que mantiene `/editar` aparte por la regla de bloqueo tras liquidar), botón "Eliminar" que se auto-valida contra relaciones bloqueantes ANTES de ofrecerse, confirmación propia (no `confirm()` nativo), "Volver" con `router.back()` (preserva filtros de la pantalla de origen).
- **Creación**: wizard de una pregunta por pantalla (Atrás/Siguiente, sin "Omitir"), con borrador persistente en `localStorage` (sobrevive si el usuario sale de la app a medio llenar), preguntas condicionales según respuestas previas, y confirmación propia al cancelar (overlay fijo arriba de pantalla en los wizards nuevos; los 4 originales aún con el overlay inline viejo — ver deuda anotada arriba).
- Selectores de entidad (id≠label, ej. Propiedad/Propietario) usan `ComboboxOpcion` (buscador, fondo blanco) — no `<select>` plano.
- **Replicado en los 9 módulos**: Propiedades (referencia original), Arrendatarios, Propietarios, Contratos, Cobros, Liquidaciones, Gastos, Documentos, Reportes. Menú completo activado (2026-07-29).

**Detalle línea por línea de todo lo hecho** (útil solo si se necesita el porqué de una decisión puntual): ver `## Últimos Cambios` más abajo, entradas del 26-jul-2026 en adelante — hay ~20 commits pequeños e iterativos con el feedback real de Eduardo probando en el celular (colores, alineaciones, textos). No hace falta leerlos todos para continuar; `docs/DISENO_PAGINAS.md` ya consolida las decisiones finales.

**Documentos de contexto:**
- `PROYECTO.md` (este archivo) — memoria viva del proyecto. Contiene el roadmap oficial de Hardening (T1–T22) y el Backlog QA 1 con reglas de negocio oficiales (ver secciones más abajo, sin cambios esta sesión).
- `docs/DISENO_PAGINAS.md` — patrón de diseño de páginas (fuente de verdad para UI).
- `docs/PAGINAS_NUEVAS.md` — checklist rápido de 6 puntos para migrar/crear una página sin dejar piezas afuera (tarjetas, combobox, overlay de cancelar, componentes con variante clara/oscura, filtro colapsable, no tocar la lógica de negocio).
- `docs/CONTRATO_BASE_ARRIENDO.md` + `docs/ADMINISTRADOR_CONTRATOS_ARRIENDO_SESION_2026-07-24.md` — modalidad de contratos de arriendo.
- `../RZK.md` (en la carpeta `Ruzosky/`, fuera del proyecto) — playbook transversal OPT-IN; solo se usa si se solicita explícitamente.

**Pendiente / próximo (en orden):**
1. **Eduardo sigue probando visualmente en el celular** — esta sesión se corrigió con base en capturas reales (tarjetas de Cobros, botón de "Generación asistida", botón "Registrar pago"); revisar el resto de pantallas recién tocadas (acordeón de cargos, wizard de pago, filtros con buscador, fechas dd/mm/yyyy) que aún no generaron feedback explícito.
2. **Confirmar si `0020_contratos_delete.sql` ya se ejecutó** (pendiente desde hace 2 sesiones, sin confirmación explícita) — sin ella "Eliminar" en Contratos afecta 0 filas en silencio.
3. Probar el flujo de reajuste de canon con datos reales cuando llegue el 01-09-2026 (próxima revisión real de Vicuña Mackenna) — confirmar que "Aplicar reajuste (UF)" sigue dando el resultado correcto y que ya no adelanta la fecha de forma indebida (bug corregido esta sesión).
4. Roadmap de Hardening — Sprint 1 sigue incompleto: faltan T2 (auditoría), T3 (backups), T5 (gate de rol), T11 (regenerar `database.types.ts`). No se tocó en las últimas sesiones (todo el foco fue UI).
5. Backlog QA (R1/R2/R3/R5, motor de liquidación) — sin cambios, sigue pendiente.
6. Una vez estable, correr `limpiar_datos_prueba` + `cargar_datos_reales_803_1907A` para empezar a usar la app con datos reales.
7. **Lección técnica a tener presente en cualquier cálculo futuro de fechas**: nunca derivar mes/año con `new Date(...).toISOString().slice(...)` en código que corre server-side — la conversión a UTC puede retroceder un día (y el mes) en zona horaria con offset negativo. Usar aritmética entera de meses (ver `periodoArriendoVigente` en `src/features/cobros/queries.ts`) o, si hace falta la fecha completa, construirla con componentes UTC explícitos.

**Flujo de trabajo:** construir → `next build` verde + `tsc` limpio → commits locales pequeños por entregable → **push solo con autorización explícita** de Eduardo (dice "push"/"aplica commit y push"). Migraciones: Eduardo las aplica en el SQL Editor y confirma — nunca asumir que ya corrieron.

**Reglas activas:** español chileno; scopes personales (no org empresarial) en GitHub/Supabase/Vercel; identidad git local = Laleke; `@supabase/ssr` alineado con `supabase-js`; toda tabla nueva con `empresa_id` + RLS solo-admin **incluyendo política DELETE si el borrado real es parte del diseño** (lección de esta sesión); **app centrada en la Propiedad** (todo lo derivable se deriva, no se pide al usuario).

## Arquitectura
Serverless, modular, multitenant. Frontend en Vercel; backend, BD, auth y storage en Supabase.

### Frontend
- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS 4**.
- Estructura `src/`. PWA vía **Serwist** (`@serwist/next`) — service worker en `src/app/sw.ts`.
- Organización por *features* (módulos de negocio aislados) bajo `src/features/`.

### Backend
- **Supabase** como único backend. Sin servidor propio, sin VPS, sin FTP.
- Acceso a datos vía `@supabase/ssr` (3 clientes: browser, server components, middleware).
- Lógica que requiera privilegios → Supabase Edge Functions o RPC (Postgres functions), no servidor Express.

### Base de Datos
- **PostgreSQL** (Supabase). Aislamiento multitenant por **Row Level Security (RLS)**.
- Cada tabla de negocio lleva `empresa_id`. Las políticas RLS filtran por el tenant del usuario autenticado.
- Migraciones versionadas en `supabase/migrations/`.

### Integraciones
- Hosting: **Vercel**. Repositorio: **GitHub**. Storage: **Supabase Storage**.
- <!-- pendiente: pasarela de pagos, notificaciones (email/WhatsApp) — no definidas aún -->

## Reglas de Negocio
<!-- pendiente: se definen al construir cada módulo -->

## Flujo Operacional
Usuario autentica con Supabase Auth → middleware refresca sesión y protege rutas → su `profile` define `empresa_id` y `rol` → RLS limita los datos a su empresa → la UI muestra el dashboard según rol.

**Bootstrap inicial (primer admin/empresa):** se resuelve con `supabase/bootstrap_admin.sql`, ejecutado manualmente UNA vez en el SQL Editor (corre como `service_role`, único punto donde se bypassa RLS de forma autorizada). Requiere crear antes el usuario en Authentication > Users. El script es atómico, idempotente y aborta si el usuario auth no existe.

## Decisiones Técnicas
- **Multitenancy por RLS + `empresa_id`** (2026-06-27): una sola BD, aislamiento por fila. Motivo: cumple "multiempresa sin reescritura" sin la complejidad de schema/DB-per-tenant; compatible con free tier. Impacto: toda tabla de negocio debe llevar `empresa_id` y políticas RLS desde su creación.
- **Roles en tabla `profiles`, no en Auth** (2026-06-27): `auth.users` solo identifica; `profiles` define `empresa_id` y `rol`. Motivo: seguridad real validada en BD, no en frontend.
- **PWA con Serwist** (2026-06-27): reemplaza `next-pwa` (abandonado, incompatible con App Router).
- **`@supabase/ssr`** (2026-06-27): reemplaza `auth-helpers` (deprecado).

## Decisiones Rechazadas
- **Schema-per-tenant / DB-per-tenant**: sobreingeniería para 1 empresa; rompe free tier. Reemplazado por RLS.
- **`next-pwa`**: abandonado e incompatible con App Router. Reemplazado por Serwist.
- **Backend Express propio**: viola la restricción de "Supabase único backend". Lógica privilegiada → Edge Functions / RPC.

## Supuestos Operacionales
- 1 empresa activa inicialmente; diseño soporta N sin reescritura.
- Usuarios concurrentes bajos al inicio (uso interno de corredora).
- Costo objetivo inicial: $0 (free tiers de Supabase + Vercel).

## Restricciones de Cuenta / Hosting
- **Scope personal obligatorio**: GitHub, Supabase y Vercel deben usar las cuentas **personales** de Eduardo, NO la organización empresarial. Eduardo tiene cuenta empresa en estas plataformas; mezclar este proyecto la expondría a toda la org.
  - GitHub: repo privado en cuenta personal.
  - Supabase: organización propia de un solo miembro.
  - Vercel: cuenta personal (Hobby), no el Team.
- **Nunca `git push` ni configurar remoto de forma automática**: los commits locales se hacen según se pidan, pero el envío a GitHub lo ejecuta Eduardo manualmente con sus credenciales personales.

## Base de Datos
### Tablas Principales
- `empresas` — tenants del SaaS.
- `profiles` — extiende `auth.users`; ligа usuario a `empresa_id` y `rol` (admin/propietario/arrendatario).
- `propietarios` — dueños de propiedades. Persona natural o jurídica; datos de contacto y bancarios para liquidaciones. `unique(empresa_id, rut)`. Baja lógica (`activo`). RLS solo admin.
- `propiedades` — inmuebles. Tipo/estado/moneda como enums; `valor_referencial_arriendo` (el canon real va en contrato), `publicada` (portales) ≠ `estado`. `codigo_interno` **autogenerado y no editable** (comuna+tipo+correlativo); `unique(empresa_id, codigo_interno)`. `direccion` nullable (permite guardar incompleta; mínimo para crear = comuna+tipo). Baja lógica. RLS solo admin. NO tiene `propietario_id`: la relación vive solo en la tabla puente.
- `propietarios_propiedades` — tabla puente N:M, única fuente de verdad de la relación. `porcentaje_participacion` (copropiedad, check 0–100), `unique(propiedad_id, propietario_id)`. Permite DELETE (desasignar). RLS solo admin.
- `arrendatarios` — inquilinos. Misma forma que propietarios pero sin datos bancarios. Reutiliza enum `tipo_persona`. `unique(empresa_id, rut)`. Baja lógica. RLS solo admin.
- `contratos` — núcleo del negocio. 1 propiedad + canon (CLP/UF) + reajuste + comisión + administración + estado. `numero_contrato` editable único por empresa. Baja lógica. RLS solo admin. **Campos de reajuste (2026-07-29, migraciones `0021`–`0023`):** `canon_actual` (numeric, vigente/cobrado; `canon_monto` queda como el original), `canon_uf_base` (numeric, monto fijo en UF cuando `reajuste_tipo='UF'`, habilita "Aplicar reajuste"), `fecha_proximo_reajuste` (date, próxima fecha a revisar — nunca se aplica sola).
- `contratos_arrendatarios` — tabla puente N:M contrato↔arrendatarios (matrimonios/codeudores/representantes). `unique(contrato_id, arrendatario_id)`. DELETE permitido. RLS solo admin.
- `cargos` — deuda generada por contrato/período/tipo. `unique(contrato_id, periodo, tipo_cargo)`. `saldo_pendiente` y `estado` recalculados por la app. RLS solo admin.
- `pagos` — abonos sobre un cargo (soporta pago parcial). `medio_pago` enum. RLS solo admin.
- `liquidaciones` — monto a transferir al propietario por período. Estados pendiente/pagada/anulada; subtotales + total; registro de pago (fecha/observación) + `comprobante_url` (estructura futura). Único por (empresa, propietario, período) salvo anuladas. RLS solo admin.
- `liquidacion_detalles` — líneas (ingreso/descuento) con `concepto`, `referencia_tipo`/`referencia_id` (trazabilidad a cargo/contrato). RLS solo admin.
- `auditoria` — eventos genéricos (usuario, acción, entidad, datos jsonb). RLS solo admin. Helper `src/lib/auditoria.ts`.
- `documentos` — Centro Documental. Metadatos (`nombre`, `categoria` enum, `observaciones`, `fecha_documento`, `subido_por`/`subido_por_email`) + relaciones **opcionales** (`propietario_id`/`arrendatario_id`/`propiedad_id`/`contrato_id`, `on delete set null`) + `version_actual` (puntero). RLS solo admin. Índices por empresa/categoría/relación/fecha.
- `gastos` — fuente oficial de gastos. `propiedad_id` obligatorio; relaciones opcionales a contrato/propietario/arrendatario/liquidación/documento. `responsable_pago` (propietario/arrendatario/corredora), `estado` (pendiente/pagado/anulado), `descontar_de_liquidacion` (afecta rentabilidad del dueño), `liquidacion_id` (dónde se descontó; null = pendiente). RLS solo admin. Consumida por Reportes y por el **descuento automático en liquidaciones** (se reclama con `estado→pagado` + `liquidacion_id`, se libera al anular).
- `documento_versiones` — cada archivo subido de un documento. `storage_path` (bucket privado `documentos`), `nombre_archivo`, `tamano_bytes`, `mime_type`, `version`, `unique(documento_id, version)`, `on delete cascade`. RLS solo admin. El aislamiento del bucket también se refuerza con políticas RLS sobre `storage.objects` (path `<empresa_id>/<uuid>.<ext>`).

### Relaciones
- `profiles.id` → `auth.users.id` (1:1). `profiles.empresa_id` → `empresas.id` (N:1).
- `propietarios.empresa_id`, `propiedades.empresa_id` → `empresas.id` (N:1).
- `propietarios_propiedades`: N:M entre `propietarios` y `propiedades` (FKs con `on delete cascade`). Es la **única** vía de la relación; `propiedades` no referencia propietarios directamente.

### Reglas de Negocio
- La participación total de copropietarios en una propiedad no puede superar 100%. Se valida en la acción de asignación (no por constraint de fila); cada fila individual valida 0 < % ≤ 100 por check.
- **Sincronización contrato→propiedad (contrato = fuente de verdad), en capa de aplicación:**
  - contrato `vigente` o `renovado` → `propiedad.estado = arrendada`.
  - contrato `terminado` → si no queda otro contrato activo (vigente/renovado) en la propiedad → `propiedad.estado = disponible`.
  - contrato `vencido` o `borrador` → no toca la propiedad (en Chile el arrendatario suele seguir ocupando tras el vencimiento).
- **Restricción:** no se permite poner un contrato en `vigente` si la propiedad ya tiene otro contrato activo (validado contra los contratos, no contra `propiedad.estado`).
- Reajuste IPC/UF exige `periodicidad_reajuste_meses` > 0. Si hay `tipo_comision`, exige valor. Si `cobra_administracion`, exige monto o porcentaje.
- **Cobros (cargos + pagos):** la deuda (cargo) existe antes del pago. Un pago abona a un cargo; `saldo_pendiente = monto − Σ pagos`; `estado` = pagado (saldo≤0) / parcial (hubo abonos) / pendiente. **`vencido` se deriva en lectura** (saldo>0 y `fecha_vencimiento < hoy`), no se almacena (evita cron). No se permite pago que supere el saldo. Generación de arriendos del mes es **asistida por botón** (no cron); upsert idempotente por `(contrato, periodo, tipo)`; usa `canon_actual` (no `canon_monto`) desde 2026-07-29.
- **El arriendo se paga por adelantado (2026-07-29):** el período "vigente" para generar/avisar arriendos es el mes **siguiente** al calendario actual, no el mes en curso — `periodoArriendoVigente()` en `src/features/cobros/queries.ts`, usado en el aviso "sin arriendo generado" de Cobros, el período por defecto de "Generación asistida" y la tarea del Dashboard. **No aplica a Liquidaciones** (revisa lo ya cobrado del mes en curso, no lo por-adelantar). Implementado con aritmética entera de meses, nunca `Date`/`toISOString` (ver Deuda Técnica / lección de zona horaria).
- **Reajuste de canon (2026-07-29, ver `contratos`):** `canon_monto` es el original pactado, inmutable de hecho; `canon_actual` es el vigente (el que se cobra). **Nunca se aplica solo** — el admin decide explícitamente por contrato: "Aplicar reajuste (UF)" (calcula `canon_uf_base × UF del corte trimestral vigente` vía mindicador.cl y avanza `fecha_proximo_reajuste`) o "Postergar N meses" (solo corre la fecha). Se descartó un cron que aplicara solo tras comprobar con datos reales que cada contrato heredado (AssetPlan) tiene su propia cadencia real (uno trimestral en la práctica, otro anual) — aplicar una regla única a todos habría reajustado alguno antes de tiempo. `fecha_proximo_reajuste` vencida aparece como aviso (no bloqueante) en Cobros al generar arriendos y como tarea pendiente en el Dashboard.

### Índices Relevantes
- `profiles(empresa_id)`, `profiles(rol)`, `propietarios(empresa_id)`.

### Modelo de datos — convenciones decididas
- **RUT** se guarda normalizado `cuerpo-dv` (sin puntos), validado con dígito verificador en la frontera (`src/lib/rut.ts`). Único por empresa, no global.
- **`activo`** (soft-delete) ≠ **`estado`** (ciclo operativo). No mezclarlos.
- **`updated_at`** mantenido por trigger `set_updated_at()` (compartido).
- Relación propietario↔propiedad será N:M desde el inicio (copropiedad es realidad del dominio CL).

### Estrategias de Performance
<!-- pendiente -->

## Stored Procedures
- Helper SQL `auth_empresa_id()` y `auth_rol()` (Postgres functions) para usar en políticas RLS.

## APIs y Endpoints
- No se exponen endpoints REST propios de negocio. El acceso a datos es vía SDK Supabase con RLS. RPC/Edge Functions cuando se requiera lógica privilegiada.
- `POST /auth/signout` — route handler que cierra sesión y redirige a `/login`.
- Login: Server Action `signIn` (email/password) en `src/app/(auth)/login/actions.ts`.

## Autenticación y Acceso
- **Método:** email + password. **Sin auto-registro**: el admin da de alta a los usuarios. Decisión 2026-06-27.
- Páginas: `/login` (pública, redirige a `/dashboard` si ya hay sesión); área privada bajo route group `(dashboard)`.
- Doble protección: middleware (redirige rutas privadas sin sesión) + `DashboardLayout` (exige `profile`, no solo `auth.users`).
- Raíz `/` redirige a `/dashboard` o `/login` según sesión.

## Observabilidad
<!-- pendiente: estrategia de logging/auditoría a definir (Supabase logs + tabla auditoría por empresa) -->

## Seguridad
- Autorización en BD vía RLS (no confiar en frontend).
- Secretos solo en variables de entorno (`.env.local`, Vercel env). `NEXT_PUBLIC_*` solo para claves anon públicas.
- `SUPABASE_SERVICE_ROLE_KEY` jamás se expone al cliente.

## Riesgos Activos
- [RIESGO] RLS mal configurado = fuga de datos entre tenants. Mitigación: toda tabla nueva nace con RLS habilitado y políticas por `empresa_id`; revisión obligatoria.
- [RIESGO] Sincronización contrato↔propiedad NO atómica (dos escrituras separadas; Supabase-JS no hace transacción multi-statement desde el cliente). Severidad: Baja con concurrencia de admin. Mitigación: el contrato es la fuente de verdad y permite reconciliar. Si crece la concurrencia, mover a función Postgres con transacción.

## Problemas Conocidos
<!-- ninguno aún -->

## Deuda Técnica
- [RESUELTO 2026-07-29] **Convención de cálculo de fechas server-side**: no usar `new Date(...).toISOString()` para derivar mes/año en Node — la conversión a UTC puede retroceder un día (y el mes) en zona horaria con offset negativo (Chile). Bug real encontrado en `periodoArriendoVigente` (mostraba julio en vez de agosto); corregido con aritmética entera de meses. Aplica a cualquier cálculo futuro de "período siguiente/anterior" en el proyecto.
- [RESUELTO 2026-06-28] `codigo_interno` ahora se autogenera (`[2 iniciales comuna][inicial tipo][correlativo 4]`, ej. PRD0001) en la capa de app al crear, no editable. Correlativo por prefijo dentro de la empresa, con reintento ante colisión (unique constraint). Riesgo residual de carrera: Bajo (concurrencia de admin); si crece, mover a secuencia Postgres con bloqueo.
- [DEUDA] `database.types.ts` escrito a mano — Riesgo: Bajo — Impacto: puede divergir del esquema real — Corrección: `npm run types:gen` una vez conectado Supabase (sobrescribe el archivo).
- [DEUDA] `comuna`/`region` como texto libre — Riesgo: Bajo — Impacto: inconsistencia de datos — Corrección: tablas catálogo `ref_regiones`/`ref_comunas` cuando se justifique reporting.
- [DEUDA] `contratos` no tiene columna/entidad de **garantía** (monto, estado, fecha de traspaso/devolución) — Riesgo: Medio — Impacto: los 2 primeros contratos reales (803, 1907-A) tienen garantía traspasada desde AssetPlan documentada solo como texto libre en `observaciones` (ver `supabase/maintenance/cargar_datos_reales_803_1907A.sql`), sin trazabilidad estructurada — Corrección: migración nueva (columna en `contratos` o tabla `contrato_garantias`) cuando se necesite reportar/gestionar garantías, no agregada aún porque no fue pedida explícitamente.
- [DEUDA / FASE 2 — Gastos] **Obligaciones económicas normalizadas (responsabilidad compartida + cuotas)** — Riesgo: Medio — Impacto: modelo de gastos, cálculo de liquidaciones y reportes.
  - **Motivación (casos reales del negocio):**
    1. *Responsabilidad compartida*: hoy un gasto tiene un único `responsable_pago`. En la práctica un mismo gasto se reparte entre propietario y arrendatario (y a veces corredora) en porcentajes o montos distintos. Ej.: reparación $400.000 → propietario 75% / arrendatario 25%; mantención $120.000 → propietario $80.000 / arrendatario $40.000.
    2. *Pago en cuotas*: un gasto puede descontarse en varias liquidaciones/cobros. Ej.: reparación $600.000 en 6 cuotas de $100.000; comisión extraordinaria en 3 cuotas; seguro anual prorrateado mensual. Cada cuota con su propio estado (pendiente/pagada/anulada), fecha de vencimiento y asociación independiente a una liquidación o cobro.
  - **Diseño esperado (NO implementar ahora):** **no** extender la tabla `gastos` con más columnas. Normalizar con una **entidad hija** (`gasto_obligaciones` / `gasto_detalles` o equivalente) donde cada fila es una obligación económica independiente y soporta: responsable (propietario/arrendatario/corredora); porcentaje **o** monto fijo; una o múltiples cuotas; estados independientes por cuota; asociación individual a liquidación **o** cobro; y compatibilidad con los datos actuales (backfill: cada gasto existente = una obligación única). `gastos` quedaría como cabecera (descripción, categoría, propiedad, monto total, adjunto); las obligaciones/cuotas viven en la hija.
  - **Decisiones de la fase actual que dificultan esta evolución (flags explícitos):**
    - El **descuento automático** lee columnas directas de `gastos` (`responsable_pago='propietario'`, `descontar_de_liquidacion`, `liquidacion_id IS NULL`) en `liquidaciones/queries.calcularLiquidacion`, `gastosDescontables` y el reclamo/liberación en `liquidaciones/actions` (`generarLiquidacion`/`anularLiquidacion`). Al introducir la hija, ese cálculo debe **reapuntarse a las obligaciones/cuotas**, no al gasto. No rompe datos, pero es un refactor obligado de esa capa.
    - `gastos.liquidacion_id` es **un solo FK** por gasto: incompatible con cuotas asociadas a liquidaciones distintas. En Fase 2 la asociación debe vivir en la cuota; el `liquidacion_id` del gasto queda obsoleto (mantener para gastos de obligación única o migrar a la hija).
    - **Reportes** (`reportes/queries`) suman `gastos.monto` como total y consideran el gasto íntegro del propietario cuando `responsable_pago='propietario'`. Con responsabilidad compartida deben sumar **la porción de cada responsable** desde la hija (la rentabilidad del propietario solo debe descontar su parte). Refactor de la agregación de gastos.
    - Ninguno de estos puntos exige romper datos existentes: la hija se agrega de forma aditiva con backfill. Son acoplamientos de **código** a señalar, no de esquema.

<!-- Modelo de Contratos: IMPLEMENTADO en 0006. Se conserva el detalle aprobado abajo como referencia. -->
## Modelo aprobado — Contratos (IMPLEMENTADO en migración 0006)
Reglas de negocio confirmadas para cuando se construya:
- **1 contrato = 1 propiedad + N arrendatarios** → tabla puente `contratos_arrendatarios` (sin `arrendatario_id` directo en contrato). Soporta matrimonios, codeudores, representantes.
- **Canon vive en el contrato** (`canon_monto`, `canon_moneda` CLP/UF), independiente del `valor_referencial_arriendo` de la propiedad.
- **Reajuste**: enum `sin_reajuste | IPC | UF` + `periodicidad_reajuste_meses` (ej. 6, 12).
- **Comisión corredora**: `tipo_comision` (`porcentaje | monto_fijo`) + `comision_monto`.
- **Administración mensual**: `cobra_administracion` (bool) + `administracion_porcentaje` y/o `administracion_monto`.
- **Estados**: `borrador | vigente | vencido | terminado | renovado`.
- Campos mínimos: id, empresa_id, propiedad_id, numero_contrato, fecha_inicio, fecha_termino, canon_*, reajuste_*, comision_*, administracion_*, estado, observaciones, activo, timestamps.

## Roadmap
### Corto plazo
- Conectar Supabase real (migraciones 0001–0007 + bootstrap), validar el ciclo en runtime. Íconos PWA, push.
### Mediano plazo
- **Dashboard Operativo** (módulo estratégico, iniciado 2026-07-07): pantalla `/dashboard` con sección "Tareas pendientes" — liquidaciones y arriendos pendientes de generar, gastos pendientes de liquidar, comprobantes de pago sin adjuntar, contratos que vencen en 30 días. Diseño modular (`getTareasPendientes()` en `dashboard/queries.ts` devuelve un arreglo; agregar un indicador nuevo no requiere rediseñar la pantalla). Pendiente de evolución: **documentos sin respaldo obligatorio** (requiere definir qué documento es obligatorio por tipo de propiedad — regla de negocio no definida aún) y KPIs financieros más ricos (gráficos, tendencias) si se justifica.
- Liquidaciones a propietarios (canon − comisión − administración). Motor de reajuste automático (IPC/UF) según `periodicidad_reajuste_meses`.
- **Gastos Fase 2 — obligaciones económicas normalizadas** (responsabilidad compartida propietario/arrendatario/corredora por % o monto + pago en cuotas con estado y asociación independiente). Entidad hija de `gastos`; ver detalle y flags de acoplamiento en `## Deuda Técnica`.
### Largo plazo
- Documentos, tickets de mantención. Portal de propietario/arrendatario (políticas RLS específicas). Onboarding de segunda empresa (validar multitenancy).

## Roadmap de Hardening y Preparación para Producción
> Roadmap **oficial** derivado de las Investigaciones 1–5 (tributaria, seguridad/permisos/producción). Todas las tareas nacen en estado **⬜ Pendiente**; se ejecutarán sprint por sprint tras aprobación. Estados posibles: ⬜ Pendiente · 🔄 En curso · ✅ Hecho.
> Flags: **Migr** (migración) · **FE** (frontend) · **BE** (backend/Server Actions) · **RLS** · **Man** (prueba manual) · **Auto** (prueba automática). ✓ = requerido · – = no.

**Notas transversales:**
- No existe infraestructura de tests (Jest/Vitest y ESLint sin configurar). El framework se monta en **T16 (Sprint 2)**; hasta entonces el gate real es `tsc` + `next build` + prueba manual. Donde figura **Auto ✓** en Sprints 4–5 se asume T16 ya hecho.
- Migración de pulido **`0017_hardening`** = **T6** (RLS/índices). La identidad fiscal (**T9**) sale del hardening → migración propia posterior (p. ej. `0018_empresa_fiscal`).
- Dependencia raíz: **T1** (aplicar 0015/0016) → **T1b** (validación runtime) desbloquea T6, T11, T14.
- *(Ajuste 2026-07-03: T1 dividida en T1/T1b; T5 y T11 movidas a Sprint 1; T16 adelantada a Sprint 2; T9 reubicada al final del Sprint 3 como mejora independiente; nueva T22 de QA E2E como gate de producción.)*

### Sprint 1 — Crítico (pre-producción con datos reales)
| ID | Tarea | Prio | Estado | Deps | Migr | FE | BE | RLS | Man | Auto | Horas |
|----|-------|------|--------|------|:----:|:--:|:--:|:---:|:---:|:----:|------:|
| T1 | **Aplicar migraciones 0015 + 0016** en Supabase (SQL Editor). | Crítica | ✅ Hecho (2026-07-03) | — | ✓ aplicar | – | – | – | ✓ | – | 1–2 |
| T1b | **Validación runtime completa:** aislamiento entre tenants (archivo/gasto de empresa B inaccesible), bucket `public=false`, y QA 1–10 del flujo Gastos↔Liquidaciones. | Crítica | ✅ Aprobada c/obs. (2026-07-03) | T1 | – | – | – | ✓ verif. | ✓ | – | 3–5 |
| T2 | **Auditoría en operaciones financieras y contratos** (H1): `pago_registrado`/`pago_eliminado`, `cargo_creado`, contratos (creado/estado/terminado/vinculación) y catastro. | Crítica | ⬜ Pendiente | — | – | – | ✓ | – | ✓ | – | 4–6 |
| T3 | **Backups + prueba de restauración** (H3): PITR (upgrade) o `pg_dump` programado; restaurar en entorno de prueba. | Crítica | ⬜ Pendiente | — | – | – | – | – | ✓ | – | 3–5 |
| T5 | **Gate de rol en `DashboardLayout`** (H5, parte rápida): exigir `rol==='admin'` o redirigir. Elimina comportamiento extraño para futuros roles. | Alta | ⬜ Pendiente | — | – | ✓ | – | – | ✓ | – | 1 |
| T11 | **Regenerar `database.types.ts`** con `supabase gen types` (los tipos deben reflejar el esquema real antes de seguir desarrollando). | Alta | ⬜ Pendiente | T1 | – | – | ✓ | – | – | – | 1–2 |

*Riesgo si no se hace:* T1 → módulos Documentos/Gastos caídos. T1b → fuga entre empresas no detectada. T2 → sin traza de movimientos de dinero/contratos. T3 → pérdida irreversible de datos. T5 → roles no-admin sin bloqueo limpio. T11 → tipos divergentes del esquema. *Secuencia:* T1 → T1b → (T2 se valida dentro de T1b). **Total ~13–21 h.**

### Sprint 2 — Hardening
| ID | Tarea | Prio | Estado | Deps | Migr | FE | BE | RLS | Man | Auto | Horas |
|----|-------|------|--------|------|:----:|:--:|:--:|:---:|:---:|:----:|------:|
| T4 | **Logging server-side + fallos de auditoría** (H6+H7): capturar errores de Server Actions y loguear cuando `registrarAuditoria` falla. | Alta | ⬜ Pendiente | — | – | – | ✓ | – | ✓ | – | 3–4 |
| T6 | **Pulido de BD** (H8+H11): normalizar políticas antiguas a `to authenticated` + verificar índices en FKs de filtrado. *(migración `0017_hardening`)* | Media | ⬜ Pendiente | T1b | ✓ | – | – | ✓ | ✓ | – | 2–3 |
| T7 | **Revisión CSRF signout / rate-limit** (H9): confirmar protecciones de Supabase; opcional token anti-CSRF en `/auth/signout`. | Baja | ⬜ Pendiente | — | – | ✓ | ✓ | – | ✓ | – | 1–2 |
| T16 | **Infraestructura de tests** (Vitest/Jest) + ESLint + pruebas de reglas críticas (claim de gastos, cálculo de liquidación, RLS). *(adelantada desde Sprint 4 para reducir regresiones)* | Media | ⬜ Pendiente | — | – | – | ✓ | – | – | ✓ | 8–12 |

*Riesgo si no se hace:* T4 → operar a ciegas + huecos de auditoría. T6 → fragilidad/degradación. T7 → logout forzado (molestia). T16 → regresiones no detectadas al crecer. *Puede esperar meses:* T7. *Dependencia clave:* **T16 antes de T14/T15 (Sprint 4).** **Total ~14–21 h.**

### Sprint 3 — Preparación para producción
| ID | Tarea | Prio | Estado | Deps | Migr | FE | BE | RLS | Man | Auto | Horas |
|----|-------|------|--------|------|:----:|:--:|:--:|:---:|:---:|:----:|------:|
| T8 | **Monitoreo y alertas** (extiende H7): Sentry / alertas Vercel-Supabase (5xx, fallos de auth). | Media | ⬜ Pendiente | T4 | – | – | ✓ | – | ✓ | – | 3–4 |
| T10 | **Documentar convención "la fuente fiscal será el DTE"** en PROYECTO.md (no meter IVA en `gastos.monto`). Solo doc. | Media | ⬜ Pendiente | — | – | – | – | – | – | – | 0.5 |
| T12 | **Operativas menores:** reinstalar PWA ("RZK Prop"), renombrar `empresas.nombre`. | Baja | ⬜ Pendiente | — | – | – | – | – | ✓ | – | 0.5–1 |
| T13 | **Runbook de despliegue/rollback + health check** documentado. | Media | ⬜ Pendiente | — | – | – | – | – | ✓ | – | 2–3 |
| T22 | **QA funcional end-to-end (gate de producción):** flujo completo de negocio — crear propietario → propiedad → contrato → registrar cobro → registrar gasto → generar liquidación → anular → regenerar → subir documentos → verificar reportes. **Debe pasar antes de declarar el sistema listo para producción.** | Crítica | ⬜ Pendiente | T1b, T2, T5 | – | – | – | – | ✓ | – (automatizable tras T16) | 4–6 |
| T9 | **Identidad fiscal en `empresas`** (Inv4, mejora independiente post-hardening): RUT, giro, dirección tributaria (nullable); aparecen en PDFs. *(migración propia, p. ej. `0018_empresa_fiscal`)* | Media | ⬜ Pendiente | — | ✓ | ✓ | ✓ | – | ✓ | – | 2–3 |

*Riesgo si no se hace:* T8 → detección tardía de incidentes. T13 → despliegues sin reversa. **T22 → declarar producción sin validar el flujo completo (riesgo Alto).** T9 → sin base fiscal ni RUT en PDFs. *Nota:* T9 no es hardening; puede diferirse tras el go-live sin afectar la operación. *Puede esperar:* T12. **Total ~12–17.5 h.**

### Sprint 4 — Mejoras arquitectónicas (diferible meses)
| ID | Tarea | Prio | Estado | Deps | Migr | FE | BE | RLS | Man | Auto | Horas |
|----|-------|------|--------|------|:----:|:--:|:--:|:---:|:---:|:----:|------:|
| T14 | **Transaccionalidad vía RPC** (H4): funciones Postgres (`SECURITY INVOKER`) para creación de liquidación y sync `contrato↔propiedad`. | Media | ⬜ Pendiente | T1b, T16 | ✓ | – | ✓ | ✓ | ✓ | ✓ | 8–12 |
| T15 | **Auditoría por trigger DB-side** para eventos críticos (garantía independiente de la app). | Media | ⬜ Pendiente | T2, T16 | ✓ | – | ✓ | ✓ | ✓ | ✓ | 5–8 |

*Riesgo si no se hace:* T14 → estado parcial ante fallo (bajo con concurrencia de admin). T15 → auditoría dependiente de la app. *Requiere:* T16 ya hecho (Sprint 2). *Puede esperar meses.* **Total ~13–20 h.**

### Sprint 5 — Fase 2 (funcionalidades futuras, diferible muchos meses)
| ID | Tarea | Prio | Estado | Deps | Migr | FE | BE | RLS | Man | Auto | Horas |
|----|-------|------|--------|------|:----:|:--:|:--:|:---:|:---:|:----:|------:|
| T17 | **Gastos Fase 2** — entidad hija de obligaciones (responsabilidad compartida %/monto + cuotas con estado/vencimiento/asociación independiente). | Baja | ⬜ Pendiente | T14 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 20–30 |
| T18 | **Entidad Documentos Tributarios (DTE)** — tabla estructurada (dirección, folio, neto/IVA/exento, autorreferencia NC/ND) enlazada a documentos/gastos/pagos/liquidaciones. | Baja | ⬜ Pendiente | T9, T17 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 20–30 |
| T19 | **Reportes tributarios** (IVA débito/crédito, retenciones, insumos F29/RCV). | Baja | ⬜ Pendiente | T18 | – | ✓ | ✓ | – | ✓ | ✓ | 10–15 |
| T20 | **Portal propietario/arrendatario + RLS por rol** (completa H5). | Baja | ⬜ Pendiente | T2, T5 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 30–50 |
| T21 | **Integración SII** (certificado, CAF, XML, firma/timbre, certificación, envío) o vía PSTE; aislada en Edge Function. | Baja | ⬜ Pendiente | T18 | ✓ | – | ✓ | – | ✓ | ✓ | 40–80 |

*Riesgo si no se hace:* ninguno operativo hoy (single-tenant, uso interno) — son crecimiento, no estabilidad. *Dependencias para evitar retrabajo:* **T17 antes de T18** (modelar juntas: DTE↔gasto cabecera, cuotas↔liquidaciones); **T18 antes de T19/T21.** Si se terceriza facturación (PSTE), T21 colapsa a "almacenar el DTE resultante" (~10 h). *Puede esperar meses o más.* **Total ~120–205 h.**

### Resumen y reglas de ejecución
| Sprint | Foco | Prioridad | Esfuerzo | ¿Bloquea producción? |
|--------|------|-----------|---------:|----------------------|
| 1 | Aplicar migraciones + validación, auditoría de pagos, backups, gate de rol, tipos | Crítica | ~13–21 h | **Sí** (antes de datos reales) |
| 2 | Logging, pulido BD, infra de tests | Alta/Media | ~14–21 h | Recomendado antes de escalar |
| 3 | Monitoreo, runbook, **QA E2E (gate)**, identidad fiscal | Media/Crítica | ~12–17.5 h | Recomendado (T22 obligatoria) |
| 4 | Transaccionalidad RPC, triggers DB-side | Media | ~13–20 h | No (diferible meses) |
| 5 | Gastos F2, DTE, reportes tributarios, portal, SII | Baja | ~120–205 h | No (según crecimiento) |

- **Camino crítico mínimo para producción de un tenant:** Sprint 1 completo + T4 (logging) + **T22 (gate QA E2E)** → ~20–31 h.
- **Agrupaciones:** `0017_hardening` = T6 (solo); T9 en migración propia posterior; T1→T1b→T2 en la misma sesión de QA; T16 antes de T14/T15; T17+T18 modeladas juntas.
- **Siguiente paso al aprobar:** ejecutar **T1** (aplicar 0015/0016) → **T1b** (validación), que desbloquea T6, T11 y T14 y es el gate duro pendiente.

## Backlog QA 1
> Observaciones surgidas en la QA funcional de T1b (aprobada). Las **reglas de negocio** de esta sección son **oficiales y definitivas** — se usan como base de diseño, no se proponen alternativas. Pendientes de planificar/implementar (aún NO desarrolladas).

**Clasificación de los ítems:**

| Ítem | Tipo | Migración | Capa |
|------|------|:---------:|------|
| R1. Liquidaciones cerradas + "pendiente de liquidar" + arrastre a la siguiente | Regla de negocio | ✓ | BD + backend (motor de liquidación) |
| R2. Sin liquidaciones negativas → $0 + saldo del propietario con arrastre | Regla de negocio | ✓ | BD + backend |
| R3. Gastos (solo propietario/compartido) vs Cobros al Arrendatario; compartido genera cobro automático | Regla de negocio | ✓ | BD + backend + frontend |
| R4. Comprobante opcional al marcar gasto pagado | Regla de negocio | – (reusa `gastos.documento_id`) | frontend + lógica |
| R5. Gastos del propietario en cuotas (movimientos programados genéricos) | Regla de negocio | ✓ | BD + backend + frontend |
| M1. Editar participación de copropietarios | Mejora funcional | – | backend + frontend |
| M2. Mostrar nombre de propiedad en vez del ID | Mejora UX | – | frontend |
| M3. Contratos con etiqueta descriptiva (no solo número) | Mejora UX | – | frontend |
| M4. Separador de miles al escribir montos | Mejora UX | – | frontend |
| M5. Filtrar arrendatarios según la propiedad seleccionada | Mejora UX/funcional | – | frontend + query |
| M6. Estado "Anulado" en rojo | Mejora UX | – | frontend |
| M7. Renombrar label "Referencia" → "Observación" (pagos) | Mejora UX | – | frontend (solo label) |

### Reglas de negocio aprobadas (oficiales)
**R1 · Liquidaciones cerradas.** Una liquidación emitida NO se modifica ni recalcula automáticamente; **no existe reliquidación**. Un ingreso o gasto de un período ya liquidado queda marcado como **"pendiente de liquidar"**; la **siguiente** liquidación incorpora todos los movimientos pendientes hasta la fecha de corte. Debe haber trazabilidad de qué movimientos están liquidados y cuáles pendientes.

**R2 · Sin liquidaciones negativas.** Si el cálculo final < 0: el monto a transferir es **$0** y la diferencia queda como **saldo pendiente**, que se descuenta automáticamente de futuras liquidaciones hasta extinguirse, con trazabilidad completa. **El saldo es por (Propietario × Propiedad), NUNCA global.** Cada propiedad mantiene su propio historial y saldo; jamás se mezclan (ej.: Juan Pérez puede tener −$120.000 en Depto A y +$300.000 en Local Comercial, independientes).

**R3 · Gastos vs Cobros al Arrendatario.** Los **Gastos** representan solo lo que afecta al **propietario**. Los **Cobros al Arrendatario** representan cualquier monto que el arrendatario debe pagar.
- Gasto 100% propietario → solo Gasto; afecta liquidación; no genera cobro.
- Gasto **compartido** (solo **porcentaje**: 100/0, 80/20, 70/30, 50/50 — **sin montos fijos**) → **un único gasto**; el sistema descuenta la parte del propietario en la liquidación **y genera automáticamente un Cobro al Arrendatario** por su porcentaje. Sincronización del cobro: (a) se crea automáticamente al crear el gasto; (b) queda **vinculado** al gasto (`cargos.gasto_id`); (c) si el gasto cambia, el cobro **se actualiza**; (d) si el gasto se elimina y el cobro **no tiene pagos**, el cobro se elimina automáticamente; (e) si el cobro **ya tiene pagos**, se **impide** eliminar el gasto y se pide revertir el cobro primero.
- Gasto que sería 100% arrendatario → **no** se registra como Gasto; va directo como **Cobro al Arrendatario**.
- En Gastos se muestran solo **Propietario** y **Compartido**. **No se eliminan valores del enum** (`arrendatario`/`corredora` se conservan para compatibilidad histórica); simplemente **no se ofrecen en la UI**. Objetivo: eliminar duplicidad entre módulos.

**R4 · Comprobante.** Al marcar un gasto como pagado se solicita comprobante; **no es obligatorio**; se permite continuar sin adjuntarlo; se registra si existe o no.

**R5 · Gastos del propietario en cuotas.** Al crear un gasto: opción **Pago único** o **Pago en cuotas**. Si es en cuotas: indicar N° de cuotas, dividir el monto automáticamente, y generar **movimientos programados** vinculados al gasto original (ej. reparación $600.000 en 6 → 6 cuotas de $100.000). Cada liquidación descuenta **solo la cuota del período**; las cuotas futuras **NO** se transforman de inmediato en saldo pendiente. Si esa cuota provoca liquidación negativa, solo esa cuota genera saldo (R2). Trazabilidad completa gasto↔cuotas. **Diseño genérico**: el modelo de movimientos programados debe poder reutilizarse para seguros, mantenciones y pagos periódicos sin rediseñar.

### Plan de implementación QA1 (Fases A–H, aprobado 2026-07-03)
- **Fase A — Mejoras UX ✅ (2026-07-03, sin migración):** M6 Anulado en rojo · M2 propiedad con código+dirección · M3 contratos descriptivos · M4 separador de miles (`MoneyInput`) · M5 filtro de arrendatarios por propiedad · M7 label "Observación" · M1 editar participación de copropietarios. Build verde, `tsc` limpio. Commits locales `dbe2ea5`…`c390b00` (sin push).
- **Fase B — R4 ✅ (2026-07-03):** comprobante opcional al marcar gasto pagado (sube a Storage + registra `documento` categoría `comprobante_pago`, vincula `gastos.documento_id`; detalle indica si existe y permite verlo con signed URL). Sin migración. Build verde.
- **Fase C — R3** gastos compartidos + cobro automático sincronizado (migración: `+compartido` en UI, `porcentaje_propietario`, `cargos.gasto_id`).
- **Fase D — T16** infraestructura de tests (protege el motor).
- **Fase E — R1** liquidaciones cerradas + pendiente de liquidar (migración: `pagos.liquidacion_id` + backfill).
- **Fase F — R2** saldo por Propietario × Propiedad (migración: ledger de saldos).
- **Fase G — R5** gastos en cuotas / movimientos programados genéricos (migración).
- **QA completa del motor** tras F/G.
- **Fase H — UI de trazabilidad** (movimientos pendientes, cuotas y saldos) al final.
- *Dependencias:* C(R3)→E(R1)→F(R2)→G(R5) tocan `calcularLiquidacion` en ese orden; D (tests) antes de E/F/G.

## Simplificación de flujo — reglas oficiales (QA aprobada 2026-07-03)
> Reglas de negocio **oficiales y definitivas**. La app se centra en la **Propiedad**.

- **Flujo único:** Propiedad → Propietario (auto) → Contrato vigente (auto) → Arrendatario (auto). El usuario solo interviene si hay **>1 contrato vigente** para la propiedad.
- **Eliminar selectores manuales** de Propietario, Contrato, Arrendatario y **Responsable** cuando el dato se derive de la Propiedad. Sin decisiones duplicadas. Se conservan IDs/relaciones internas (compat histórica), pero **ocultos** en la UI.
- **Se elimina el concepto "Responsable" de la interfaz.**
  - **Gastos**: siempre del **propietario**. El usuario solo elige **Propiedad + datos del gasto**; nada de responsable/propietario/arrendatario/contrato.
  - **Cobros**: siempre del **arrendatario**. El usuario solo elige **Propiedad + datos del cobro**; el sistema deriva contrato vigente + arrendatario.
- **Gastos compartidos (futuro):** esta simplificación no lo bloquea; cuando llegue, se agrega el split por **porcentaje** propietario/arrendatario (no un selector de "Responsable"). Hasta entonces, formularios lo más simples posible.
- Regla general: si un dato se deduce de la Propiedad → eliminar el selector; mostrar lo derivado **solo lectura** cuando aporte contexto; solo pedir intervención si hay más de una alternativa válida.

### Inventario de selectores manuales (punto 6)
| Pantalla / archivo | Selector | Veredicto |
|---|---|---|
| Gastos — form (`gasto-form.tsx`) | **Responsable** (`responsable_pago`) | **Eliminar ya** (gasto siempre propietario; setear `propietario` en backend) |
| Gastos — form | **Propietario** (`propietario_id`) | **Eliminar ya** (derivar de la propiedad; hidden) |
| Gastos — form | Arrendatario (info del `SelectorPropiedadContrato`) | **Ocultar en Gastos** (irrelevante hasta compartidos; usar variante propiedad-only) |
| Documentos — form (`upload-form.tsx`) | **Propietario** (`propietario_id`) | **Eliminar ya** (derivar de la propiedad; hidden) |
| Cobros — form (`cargo-form.tsx`) | Propiedad→contrato(auto)→arrendatario(info) | **OK** (ya alineado) |
| Propiedades — `asignar-propietario.tsx` | Propietario (+% copropiedad) | **Mantener** (fuente de la relación propiedad↔propietario; no derivable) |
| Contratos — `asignar-arrendatario.tsx` | Arrendatario | **Mantener** (fuente de la relación contrato↔arrendatario) |
| Contratos — form nuevo/editar | Propiedad | **Mantener** (un contrato se crea sobre una propiedad) |
| Liquidaciones — `nueva` | Propietario | **Mantener por ahora**; **cambia** con R2 (saldo por propietario×propiedad) — la liquidación es por propietario |
| Filtros de listado (reportes/documentos/liquidaciones) | Propietario/Arrendatario | **Mantener** (son búsqueda, no alta; ya corregidos en QA3) |

**Eliminar inmediatamente (próximo sprint):** ~~Responsable y Propietario en form de Gastos; Propietario en form de Documentos; Gastos usa selector propiedad-only~~ **HECHO 2026-07-06.**
**Cambian con módulos futuros:** Gastos (split % al implementar compartidos); Liquidaciones (flujo/saldo con R2).

**Implementado (2026-07-06):** Gastos → solo Propiedad + datos (sin Responsable/Propietario/Arrendatario; `responsable_pago='propietario'` fijado en backend; contrato derivado/preservado en hidden; arrendatario oculto vía `mostrarArrendatario={false}`). Documentos → sin selector de Propietario. Build verde, `tsc` limpio, 12 tests verdes. **Se mantienen** (fuente de relación / core): asignar copropietario en Propiedades, asignar arrendatario y elegir propiedad en Contratos, selector de propietario en Liquidaciones (por revisar con R2), y los filtros de listado.

## Modalidad: Administrador de Contratos de Arriendo
> Administración directa de arriendos por Eduardo (propietario), reemplazando la gestión vía corredora (AssetPlan). Contrato base propio redactado (`docs/CONTRATO_BASE_ARRIENDO.md`, v2). Detalle completo del análisis, decisiones y transición de los 2 contratos existentes (803, 1907-A) en **`docs/ADMINISTRADOR_CONTRATOS_ARRIENDO_SESION_2026-07-24.md`** — incluye pendientes sin cerrar (firma de finiquitos, confirmación de razón social AssetPlan, papel de garantía de la encimera en 803, recepción de $895.000 de garantía traspasada). **Revisar ese documento antes de dar la transición por completamente cerrada o de ingresar estos 2 contratos como datos reales.**

## Últimos Cambios
- 2026-07-29 (segunda mitad de la sesión, 4 commits: `f6629b0`→`6409c8b`→`8c8be69`→`dd2eec8`) — **Corrección de formato tras feedback real de Eduardo (capturas del celular) + regla de negocio "arriendo por adelantado" + fechas dd/mm/yyyy en toda la app.** Resumen completo con el detalle de cada commit en `## Punto de Continuación` (arriba) — incluye: paneles de Cobros/Liquidaciones/Reportes a burdeo (con recalibración de la paleta de `charts.tsx`); bug corregido en `aplicarReajusteUF` (adelantaba la fecha de revisión indebidamente); overlay de "Cancelar" unificado en los 8 wizards (se encontró que `propiedad-wizard.tsx` había quedado con el estilo viejo); `periodoArriendoVigente()` nuevo (el arriendo se paga por adelantado — período a generar es el mes siguiente, no el actual) **con un bug real de zona horaria** (`toISOString()` retrocedía el mes en offset negativo, corregido con aritmética entera); `src/lib/fecha.ts` nuevo aplicado a ~25 sitios con fechas ISO crudas; "Registrar pago" migrado de formulario inline a wizard con botón de ancho completo (`/cobros/[id]/pagos/nuevo`); filtros de Propiedad/Propietario/Arrendatario en 5 páginas migrados a `ComboboxOpcion`; listado de cargos de Cobros reestructurado en acordeón por período. Ninguno de estos cambios se verificó en navegador real (sin Playwright/chromium-cli en el entorno) — todo el ajuste vino de capturas de pantalla reales que Eduardo mandó.
- 2026-07-29 (3 commits pusheados: `ae74a4a`→`85c0f0a`→`fb5afbc`, + corrección de formato en `bb5c404`) — **Botón atrás genérico, reajuste de canon vía UF con revisión manual, y menú completo con formato replicado.**
  1. **`ae74a4a`** — Botón atrás del hardware generalizado: en vez de saltar siempre a `/dashboard`, sube un nivel en la jerarquía de la ruta (`/contratos/[id]/editar` → `/contratos/[id]` → `/contratos` → `/dashboard`), calculado genéricamente desde el pathname (sin casos especiales por módulo).
  2. **`85c0f0a`** — **Reajuste de canon con UF real (mindicador.cl), decisión siempre manual.** Se probó primero un cron trimestral automático; se descartó tras encontrar con datos reales (screenshot del historial de pagos AssetPlan de Vicuña Mackenna) que la fórmula correcta es `canon_uf_base × UF del corte trimestral (1° mar/jun/sep/dic)` — validada exacta contra 4 meses reales — pero que **cada contrato heredado tiene su propia cadencia real** (Vicuña resultó trimestral en la práctica pese al contrato decir "anual"; Curiñanca sí es anual real). Un cron único habría reajustado alguno antes de tiempo. Diseño final: `canon_actual`/`canon_uf_base`/`fecha_proximo_reajuste` nuevos en `contratos` (migraciones `0021`–`0023`, **ejecutadas**); botones "Aplicar reajuste (UF)" y "Postergar N meses" en el detalle del contrato (nunca automático — puede haber arreglo informal con el arrendatario); aviso no bloqueante en Cobros y nueva tarea pendiente en Dashboard cuando hay contratos con reajuste vencido de revisar. De paso: `generarArriendosDelMes` tenía un bug (cobraba `canon_monto` en vez de `canon_actual`) — corregido.
  3. **`fb5afbc`** — **Menú completo activado** (Cobros, Liquidaciones, Gastos, Documentos, Reportes ya no ocultos) + **patrón de diseño replicado** en los 5: filtro colapsable (y fix del bug de "Limpiar" como `Link` inmediato en Cobros/Gastos/Documentos), wizard de una pregunta a la vez en las pantallas de creación (Liquidaciones con una variante liviana de 2 preguntas que solo arma la URL, sin tocar la vista previa/confirmación existente). Feedback de Eduardo tras probarlo: faltaban las **tarjetas** de listado (se quedó en `<table>`), el **combobox con buscador y fondo blanco** (se usó `<select>` plano) y la posición del mensaje de **Cancelar**. Corregido en el mismo cierre de sesión (sin commit propio aún): tarjetas `ui.listCard` en los 4 listados; `ComboboxOpcion` nuevo (`src/components/combobox-opcion.tsx`, variante de `Combobox` para listas `{id,label}` como Propiedad/Propietario) en los pasos de selección de propiedad de los wizards; mensaje de Cancelar movido a overlay fijo arriba de la pantalla; `AccionesArchivo` con variante `oscuro` (se había vuelto invisible sobre las tarjetas burdeo nuevas); `docs/PAGINAS_NUEVAS.md` nuevo (checklist de 6 puntos para no repetir el mismo hueco en la próxima página). No se pudo validar visualmente en navegador (sin Playwright/chromium-cli en el entorno) — validado solo por `tsc`/`build`.
  4. También esta sesión: Dashboard simplificado a 3 KPI (Propiedades vs arrendadas, Deuda pendiente, Cargos morosos); selector de fecha con salto directo de año en Propiedades (`FechaInput`, reemplaza `<input type="date">` nativo); banner PWA "Hay una versión nueva — Actualizar" (`SerwistProvider` + `skipWaiting:false`); parseo de montos acepta coma como separador decimal en toda la app.
- 2026-07-27 (5 commits: `0bb6edb`→`4fd0ab1`→`b0d663b`→`84f6718`→`db46805`, todos pusheados) — **Contratos con el patrón de diseño completo + ronda de ajustes de UX sobre dispositivo real.** Detalle línea por línea en `## Punto de Continuación` (arriba) y en `docs/DISENO_PAGINAS.md`; resumen: (1) Ajustes de campos en Propietarios/Arrendatarios (máscara de RUT, banco/tipo de cuenta como combobox real, N° de cuenta numérico, validación de email con salto de línea antes del `@`, teléfono filtrado, botones del wizard en grid fijo, confirmación de cancelar como overlay). (2) **Contratos** replicado completo (tarjetas+filtros, detalle en línea, wizard, eliminar validado contra `cargos`) — nueva migración `0020_contratos_delete.sql` **pendiente de ejecutar**. (3) Bug real encontrado y corregido en los 3 wizards existentes: la última pregunta de cada uno nunca se guardaba por falta de `name` en el input activo. (4) Botón atrás del Android ahora siempre vuelve a `/dashboard` (decisión de producto). (5) Dashboard rediseñado con tema burdeo, 3 indicadores nuevos (Ocupación %, Propietarios activos, Arrendatarios activos) y tarjetas KPI en fila compacta. Todo validado con `tsc`/`build`/`vitest` en cada commit.
- 2026-07-26 (ronda 3, ~20 commits) — **Patrón de diseño de páginas cerrado y replicado en Propiedades, Arrendatarios y Propietarios.** Detalle completo en `docs/DISENO_PAGINAS.md` (fuente de verdad); resumen: (1) **Detalle con edición en línea**: panel burdeo único por registro, botón "Editar" que convierte cada campo del grid en su input real (combobox región/comuna, selects, numéricos con teclado numérico) sin abrir formulario aparte ni modal; "Volver" con `router.back()` para no perder filtros de la lista de origen. (2) **Wizard de creación** (una pregunta por pantalla): reemplaza los formularios tradicionales de creación en los 3 módulos; solo 2 botones de navegación (Atrás/Siguiente, sin "Omitir"); borrador persistente en `localStorage` (sobrevive salir de la app a medio llenar); preguntas condicionales (ej. tipo de persona natural/jurídica cambia qué preguntas son obligatorias); cabecera compacta para no competir con el teclado del celular; confirmación propia (no nativa) al cancelar. (3) **Eliminar registro**: se descubrió que `propiedades`/`arrendatarios`/`propietarios` nunca tuvieron política RLS de `DELETE` (a propósito, solo baja lógica) — un `DELETE` sin política no falla, simplemente afecta 0 filas en silencio; se agregaron las migraciones `0017`/`0018`/`0019` (**pendientes de ejecutar por Eduardo**) + validación previa por relaciones bloqueantes (contratos/gastos/liquidaciones según la tabla) antes de ofrecer el botón, y confirmación "Sí/No" propia en vez de `confirm()` nativo. (4) **Filtros**: colapsables detrás de un ícono, panel gris (no blanco), y "Limpiar" ahora solo resetea el formulario en pantalla — "Aplicar" es el único que ejecuta el filtro (antes "Limpiar" navegaba de inmediato, quedó documentado como pendiente corregir igual en Cobros cuando le toque su rediseño). Se eliminaron los formularios de creación tradicionales huérfanos (`propiedad-form.tsx`, `arrendatario-form.tsx`, `propietario-form.tsx`). Todo validado con `tsc`/`build` en cada commit; **pendiente validación visual final por Eduardo en el celular** y las 3 migraciones de DELETE. Sigue pendiente replicar el patrón en **Contratos** (más complejo por sus relaciones obligatorias — ver dudas ya resueltas en `docs/DISENO_PAGINAS.md`).
- 2026-07-26 (ronda 2, feedback visual sobre dispositivo real) — **Ajustes de theming y tarjetas tras revisión en el celular.** (1) Canvas corregido de negro (#1b1b22) a gris grafito real (#34343d) — el tono anterior se veía negro. (2) Topbar móvil (antes blanco) ahora usa el mismo canvas gris. (3) Splash/PWA: `manifest.webmanifest` (`background_color`/`theme_color`) y `viewport.themeColor` en `layout.tsx` pasan de blanco/negro a burdeo y grafito respectivamente. (4) `PageHeader`: el botón "Nueva X" se reemplaza por un ícono "+" circular junto al título (afecta todas las páginas que usan este componente, no solo Propiedades). (5) Tarjetas de listado (`ui.listCard`) pasan de blancas a **burdeo**; info secundaria (comuna/tipo/valor, email/teléfono, fechas/canon según la página) se oculta detrás de un disclosure nativo (`<details>`) con ícono de información — solo lo esencial (código/nombre + estado) queda siempre visible. Acciones "Detalle/Editar" y "Activar/Desactivar" pasan de texto a íconos (lápiz, toggle on/off). Validado con `tsc --noEmit` y `next build` (verdes); sigue pendiente la validación visual completa en todas las pantallas restantes (Cobros, Liquidaciones, Gastos, Reportes, Documentos no se tocaron en esta ronda, siguen con el diseño anterior de tabla/tarjeta blanca).
- 2026-07-26 — **Etapa inicial de uso real: UI simplificada + datos de carga preparados.** (1) **Theming**: canvas de la app pasa de blanco a gris grafito oscuro (mismo tono del sidebar, `--color-canvas`); nuevos tokens `--color-canvas-fg`/`--color-canvas-muted` para texto legible directo sobre el canvas oscuro (usados en `PageHeader` y el saludo del dashboard); login pasa a fondo burdeo. Las tarjetas (`ui.card`) siguen blancas — sin cambios de contraste ahí. Validado con `tsc --noEmit` y `next build` (ambos verdes); **falta validación visual en navegador** por Eduardo antes de dar por cerrado el detalle de contraste en pantallas no auditadas una por una. (2) **Dashboard**: los KPIs ahora son tarjetas clicables que llevan al listado correspondiente; se elimina la sección "Accesos rápidos" (redundante con eso). (3) **Listados** de Propiedades/Propietarios/Arrendatarios/Contratos: de tabla HTML a grid de tarjetas (`ui.cardGrid`/`ui.listCard`), porque la tabla recortaba información en pantallas angostas. (4) **Sidebar**: oculto temporalmente todo módulo fuera de Propiedades/Propietarios/Arrendatarios/Contratos (Cobros, Liquidaciones, Gastos, Reportes, Documentos) — el código de esos módulos sigue intacto, solo se saca del menú mientras se valida el flujo con datos reales. (5) **Scripts preparados** (no ejecutados, a correr por Eduardo): `supabase/maintenance/cargar_datos_reales_803_1907A.sql` — carga a Eduardo como propietario, las 2 propiedades (803, 1907-A), sus arrendatarios (Jimmy, Paul) y los contratos directos, más el rename de empresa a "RZK Prop"; requiere ajustar fechas de firma/inicio y contactos antes de ejecutar. **Pendiente sin resolver esta sesión:** el modelo de roles (agregar `corredor` al enum, perfil "propietario independiente" con permisos combinados propietario+corredor, RLS por rol para portal propietario/arrendatario) — esto ya estaba estimado en el roadmap como **T20 (Sprint 5, 30–50 h)**; no se implementó de forma apurada junto con los cambios de UI porque toca RLS/seguridad y merece su propia sesión de diseño. Ver conversación de la sesión para el detalle completo de la discusión de roles.
- 2026-07-07 — **QA aprobada (mejoras UX/consistencia) — implementación completa.** (1) **Gastos**: se quita el filtro Responsable del listado y las columnas Propietario/Arrendatario/Responsable del detalle (redundantes tras la simplificación de flujo); se agrega descripción explicando el impacto del gasto en la liquidación. (2) **Documentos**: fix de bug real — al quitar el selector de Propietario (sesión anterior) nunca se implementó la derivación automática (`upload-form.tsx` leía un campo inexistente); ahora `registrarDocumento` deriva el propietario desde `propietarios_propiedades` cuando la propiedad tiene un único dueño (con copropiedad queda `null`, sin bloquear la subida). (3) **Cargos**: se agregan filtros (propiedad, arrendatario, estado —incluye "vencido" derivado—, período, rango de vencimiento); propiedad/arrendatario se resuelven vía el contrato (no son columnas directas de `cargos`). (4) **Liquidaciones**: el wizard consulta si ya existe una liquidación (propietario+período, no anulada) antes de mostrar "Confirmar y generar" y muestra un aviso en su lugar; se fusionan los bloques "Descuentos" y "Gastos descontados" en uno solo con etiqueta de origen por línea, en la vista previa y en el detalle; nuevo indicador "Liquidaciones pendientes de generar" (período actual) en `/liquidaciones` con acceso directo (`listPendientesLiquidar`). (5) **Cobros**: nuevo indicador "Arriendos pendientes de generar" (contratos vigentes sin cargo de arriendo del mes) en `/cobros`, con el mes de "Generación asistida" prellenado (`listContratosSinArriendo`). (6) **Dashboard Operativo**: nueva sección "Tareas pendientes" en `/dashboard` reutilizando las queries de pendientes ya creadas + gastos pendientes de liquidar + comprobantes de pago sin adjuntar + contratos que vencen en 30 días; diseño modular (`getTareasPendientes()`) pensado para agregar indicadores futuros sin rediseñar la pantalla. **Sin migraciones** (todo capa frontend/query, reutilizando relaciones existentes). Build verde, `tsc` limpio, 12 tests en cada commit. **8 commits: `6c4c0b8` (Gastos) → `5d92be7` (filtros Cargos) → `4aadc68` (guardia duplicados) → `4a10605` (fusión bloques) → `f6403a7` (pendientes Liquidaciones) → `ae8c13e` (pendientes Cobros) → `4ca4409` (Dashboard Operativo) → `7df2ff0` (docs PROYECTO.md). Push autorizado y ejecutado a `origin/main` (`0ca2e5d..7df2ff0`).** QA6 (matriz de prueba de esta ronda) entregada como artifact: https://claude.ai/code/artifact/bf888b5a-c9bb-4e6d-a9ee-73416c5505da — **pendiente de ejecución por Eduardo**.
- 2026-07-06 — **Simplificación de formularios (ítems "eliminar ya" del inventario).** Gastos: se quitan los selectores de **Responsable, Propietario y Arrendatario**; el usuario solo elige **Propiedad + datos**; `responsable_pago` se fija en `propietario` en backend; el contrato se deriva/preserva oculto; casilla "descontar de liquidación" siempre disponible. Documentos: se quita el selector de **Propietario** (derivado de la propiedad). Componente `SelectorPropiedadContrato` gana `mostrarArrendatario`. Se conservan columnas/IDs (compat histórica). Sin migración. Build verde, `tsc` limpio, 12 tests. Commits locales, **sin push**.
- 2026-07-03 — **QA de simplificación de flujo APROBADA ✅.** Reglas oficiales registradas (app centrada en Propiedad; flujo Propiedad→Propietario→Contrato→Arrendatario automático; se elimina "Responsable" de la UI; Gastos=propietario, Cobros=arrendatario) + **inventario de selectores manuales** (ver sección "Simplificación de flujo"). Pendiente de aprobación: sprint para eliminar Responsable/Propietario en form de Gastos y Propietario en form de Documentos. Sin cambios de código aún.
- 2026-07-03 — **QA3 (simplificación de flujo + fix de filtros).** (1) Flujo unificado **Propiedad → Contrato (auto) → Arrendatario (info)**: componente `SelectorPropiedadContrato` en Gastos, Documentos y Cobros — el usuario solo elige propiedad; el contrato vigente se autoselecciona (único) o se pide (varios); el arrendatario es **solo lectura** derivado del contrato. Se elimina la selección manual de arrendatario. (2) Eliminado el **filtro por Contrato** en Documentos. (3) **Fix de filtros de Documentos** (bug: devolvían vacío): Propietario/Arrendatario ahora filtran por las **propiedades relacionadas** (vía `propietarios_propiedades` y `contratos_arrendatarios`), no por el FK directo (casi siempre null); fecha filtra sobre la **fecha efectiva** (documento o subida) en memoria. (4) Documentos: contrato nunca seleccionable/principal; se asocia el vigente en segundo plano. **Tests**: se incorpora **Vitest** (`npm test`) con pruebas de filtrado de fecha y etiquetas (12 pruebas verdes). Sin migración; `contrato_id` se conserva. Build verde, `tsc` limpio.
- 2026-07-03 — **QA2 (ajustes UX/consistencia) implementada.** (1) Etiqueta única de propiedad **Código · Calle Número · Depto/Unidad** (`src/lib/propiedad.ts`) aplicada a selectores y listados de gastos, documentos, contratos, cobros y reportes. (2) Selector de contrato con formato descriptivo (N° · propiedad) + **autoselección** del único contrato vigente en el form de documentos. (3) **Eliminado el selector de contrato en Gastos** — el gasto pertenece a la **Propiedad**; se conserva `contrato_id` (hidden, sin migración) para trazabilidad; detalle prioriza la propiedad. Regla Fase C: el cobro de gasto compartido derivará el contrato vigente de la propiedad (único→auto; ninguno→bloquear con motivo; varios→pedir selección). (4) Validación de copropietarios **≠100%** con aviso ("falta X%") + acción "Agregar copropietario"; 100% muestra badge verde. (5) Columna **Propiedad** en la tabla de Documentos. Sin migración. Build verde, `tsc` limpio.
- 2026-07-03 — **QA1 · Fase B (R4 comprobante opcional) completada (✅).** Al marcar un gasto como pagado se puede adjuntar comprobante (no obligatorio): se sube a Storage y se registra como `documento` (categoría `comprobante_pago`) vinculado por `gastos.documento_id`; el detalle indica si existe y permite verlo (signed URL). Reusa el módulo Documentos; sin migración. Build verde, `tsc` limpio. Siguiente: Fase C (R3, gastos compartidos + cobro automático).
- 2026-07-03 — **QA1 · Fase A (Mejoras UX) completada (✅).** M1–M7: Anulado en rojo; propiedad muestra código+dirección; contratos con etiqueta descriptiva; separador de miles en montos (`MoneyInput` reutilizable, envía número crudo); filtro de arrendatarios por propiedad en el form de gastos; label "Referencia"→"Observación" (sin tocar la columna); edición inline de participación de copropietarios (valida ≤100%). Sin migración. Build verde, `tsc` limpio. 5 commits locales, sin push. Siguiente: Fase B (R4, comprobante opcional al pagar).
- 2026-07-03 — **Sprint 1 · T1b aprobada con observaciones (✅).** QA funcional del ciclo Gastos↔Liquidaciones exitosa; validó el funcionamiento del módulo. Observaciones trasladadas a **`## Backlog QA 1`** (4 reglas de negocio oficiales R1–R4 + 7 mejoras M1–M7, clasificadas). Pendiente: análisis de impacto y plan de implementación (aprobación previa antes de programar).
- 2026-07-03 — **Sprint 1 · T1 completada (✅):** migraciones `0015_documentos.sql` y `0016_gastos.sql` aplicadas en Supabase por Eduardo. Verificación de esquema con 22 checks (enums, tablas, índices, unique, triggers, RLS, políticas, bucket privado, FKs) → **todo OK**. Sin intervención manual pendiente. Siguiente: **T1b** (validación runtime: aislamiento entre tenants + QA 1–10 Gastos↔Liquidaciones). Aún **no** se ejecutó QA funcional ni se regeneró `database.types.ts` (T11).
- 2026-07-03 — **Roadmap de Hardening reorganizado (aprobado con ajustes).** T1 dividida en T1 (aplicar 0015/0016) + T1b (validación runtime); T5 (gate de rol) y T11 (regenerar tipos) movidas a Sprint 1; T16 (infra de tests) adelantada a Sprint 2; T9 (identidad fiscal) reubicada al final del Sprint 3 como mejora independiente post-hardening; **nueva T22** (QA funcional end-to-end como gate de producción). Sin cambios de arquitectura ni alcance. Todas las tareas siguen en ⬜ Pendiente. Sin cambios de código.
- 2026-07-03 — **Roadmap oficial de Hardening y Preparación para Producción** agregado (T1–T21, 5 sprints), derivado de las Investigaciones 1–5; todas las tareas en estado ⬜ Pendiente. Pendiente de aprobación para iniciar ejecución sprint por sprint. Sin cambios de código.
- 2026-07-03 — **Ciclo Gastos↔Liquidaciones cerrado (descuento automático).** Al generar una liquidación, `calcularLiquidacion` incorpora los gastos pendientes descontables del propietario (condiciones: `propiedad` del dueño, `estado=pendiente`, `descontar_de_liquidacion=true`, `responsable_pago=propietario`, `liquidacion_id IS NULL`, `fecha` ≤ mes del período; además `propietario_id` null o = el liquidado, para copropiedad). Orden del cálculo: ingresos → comisiones/descuentos → **gastos** → total. Persistencia: **reclamo atómico** (`UPDATE gastos SET liquidacion_id, estado='pagado' WHERE liquidacion_id IS NULL …` con `returning`) que impide doble asociación bajo concurrencia; el total se **recalcula con los gastos efectivamente reclamados**. Cada gasto queda como detalle (`referencia_tipo='gasto'`). **Anulación**: libera los gastos (`liquidacion_id=null`, `estado='pendiente'`) para re-liquidar. Auditoría de asociación (`gasto_asociado_liquidacion`) y liberación (`gasto_liberado_anulacion`). UI: sección "Gastos descontados" en vista previa y detalle. **Reportes sin cambios** (leen la tabla `gastos`, no los detalles; `pendiente`/`pagado` cuentan igual). Sin migración. Build verde, `tsc` limpio.
- 2026-07-03 — **Módulo Gastos + Reportes Financieros.**
  - **Gastos** (migración `0016_gastos.sql`, **requiere aplicarla en Supabase**): enums `categoria_gasto`/`estado_gasto`/`responsable_gasto` y tabla `gastos`. `propiedad_id` obligatorio; `contrato_id`/`propietario_id`/`arrendatario_id`/`liquidacion_id`/`documento_id` opcionales. Campos: categoría, descripción, monto, fecha, estado (pendiente/pagado/anulado), `responsable_pago` (propietario/arrendatario/corredora), `descontar_de_liquidacion`, observaciones, `creado_por`/email, timestamps. RLS solo-admin por `empresa_id`. **Fuente oficial de gastos.** Regla: solo gastos con responsable propietario (o `descontar_de_liquidacion`) afectan la rentabilidad del dueño; los del arrendatario/corredora no. Modelo preparado para descuento automático futuro en liquidación (`descontar_de_liquidacion` + `liquidacion_id`; índice parcial de pendientes por descontar). UI: listado con filtros + total vigente, form crear/editar, detalle con acciones (pagar/anular/reactivar/eliminar). Guardas: no editar/eliminar un gasto ya ligado a liquidación. Auditoría en todas las operaciones.
  - **Reportes Financieros** (sin migración): dashboard en `/reportes` con filtros **año/propiedad/propietario** (Ejecutivo omitido: no existe en el modelo; Empresa omitido: RLS ya aísla el tenant). KPIs (9): ingresos por arriendo, comisiones cobradas/pendientes, gastos, liquidaciones emitidas/pagadas, cobros pendientes, mora, vacancia. Gráficos SVG propios (barras/líneas/pie/agrupadas, sin dependencias): ingresos mensual, comparativo mensual (ingresos/gastos/comisiones), comparativo anual (Y-1 vs Y), gastos por categoría. Tablas: rentabilidad por propietario (ponderada por % de participación, neta de comisiones y gastos del dueño) y gastos por propiedad. Exportación CSV (nativa) / Excel (HTML-table `.xls`) / PDF (impresión). **Cálculo sobre datos primarios** (pagos/cargos/contratos/gastos/propiedades), no sobre liquidaciones (salvo los reportes de liquidaciones), para evitar doble conteo. Build verde.
- 2026-07-03 — **Centro Documental** (migración `0015_documentos.sql`, **requiere aplicarla en Supabase**). Enum `categoria_documento` (contrato, anexo, inventario, acta_entrega, acta_recepcion, liquidacion, comprobante_pago, factura, boleta, gasto, mantencion, otro). Tablas `documentos` (metadatos + relaciones opcionales a propietario/arrendatario/propiedad/contrato + `version_actual`) y `documento_versiones` (cada archivo subido, `unique(documento_id, version)`). RLS solo-admin por `empresa_id`. Bucket privado `documentos` en Storage con políticas RLS de aislamiento por tenant (primera carpeta del path = `empresa_id::text`). **Subida directa cliente→Storage** (no vía Server Action) para evitar el límite de ~4.5 MB de body de las funciones serverless de Vercel; el Server Action solo registra metadatos y limpia el objeto huérfano si el insert falla. Ver/descargar vía **signed URLs** (60s) generadas server-side. UI: sección Documentos con listado (filtros categoría/propiedad/contrato/propietario/arrendatario/rango de fechas + buscador nombre/observaciones), formulario de subida, detalle con tabla de versiones (ver, descargar, subir nueva versión, eliminar versión, eliminar documento completo). Auditoría en cada acción. Build verde. Máx. 25 MB por archivo.
- 2026-06-30 — **Rebranding a "RZK Prop"** en todo lo visible (UI, metadata, manifest/PWA, docs, seed), preservando tablas/migraciones y URLs reales. QA de Liquidaciones aprobado. Limpieza de datos de prueba (cargos/pagos/liquidaciones/auditoría borrados, corretaje reseteado; catastro conservado).
- 2026-06-29 — **Liquidaciones — ajustes finales** (migraciones `0012`–`0014`): ajustes manuales (ingreso/descuento + observación, `referencia_tipo='manual'`) en la vista previa con recálculo en vivo; **congelamiento** (la liquidación guarda subtotales/total/líneas y nunca recalcula tras crearse); **corretaje** controlado por `contratos.corretaje_liquidado` (se cobra una sola vez, se marca al liquidar, se revierte al anular); **bloqueo de edición** (marcar pagada y anular solo desde `pendiente`); **numeración correlativa** `LIQ-AAAA-000001` única por empresa, visible en listado/detalle/PDF. **Requiere aplicar `0012`, `0013`, `0014`.**
- 2026-06-29 — **Módulo Liquidaciones a propietarios** (Fase 1A, migración `0011`): cálculo automático por propietario+período (ingresos = pagos efectivos ponderados por % de participación; descuentos = comisión administración mensual + corretaje en mes de inicio), asistente con vista previa, listado con filtros, detalle con detalle de líneas, registro de pago, anulación, PDF vía impresión, y **sistema de auditoría** (`auditoria` + helper). RLS solo-admin. **Requiere aplicar `0011` en Supabase.** Reglas de negocio del cálculo documentadas; ajustes manuales/mantenciones quedan como estructura preparada (no UI aún).
- 2026-06-29 — Borrador automático extendido a formularios de propiedad y contrato. **`numero_contrato` autogenerado** (correlativo por empresa) y oculto del formulario, igual patrón que `codigo_interno`. En detalle de propiedad, el botón "Asignar propietario" se muestra solo si no hay propietarios asignados.
- 2026-06-29 — Formularios de personas (propietario/arrendatario): región/comuna como combobox dependiente (orden región→comuna), teléfono numérico con `+`, **Nombres/Apellidos** ambos obligatorios (persona natural), dirección separada en **Calle + Número** (migración `0009` agrega `numero`). **Borrador automático** en localStorage (`use-form-draft`) que restaura lo escrito si la app se recarga (causa del "se borraba todo": redeploys frecuentes). Cargo: se quita Administración del formulario y se agregan **Luz/Agua/Internet** (migración `0010` agrega valores al enum `tipo_cargo`). **Requiere aplicar 0009 y 0010 en Supabase.**
- 2026-06-28 — Propiedades: código interno **oculto** del form; orden tipo→región→comuna→resto; **región y comuna obligatorias** como **combobox con buscador** (catálogo Chile en `src/data/chile.ts`, comuna dependiente de región). Componente `src/components/combobox.tsx`.
- 2026-06-28 — Íconos PWA reales (edificio burdeo, `scripts/gen-icons.mjs` con sharp). **Código interno autogenerado** y no editable; **propiedades guardables incompletas** (migración `0008`, `direccion` nullable; mínimo crear = comuna+tipo). Build verde. **Requiere aplicar `0008` en Supabase.**
- 2026-06-28 — **Rediseño UI** (sistema de diseño grafito + burdeo): tokens en `globals.css` (@theme), tipografía Inter, clases reutilizables en `src/components/ui.ts`, sidebar lateral responsivo (`src/components/sidebar.tsx`), login con panel de marca, dashboard con KPIs (`features/dashboard`), y restyle de todos los listados/formularios/detalles (PageHeader, tarjetas, badges de estado, lucide-react). Build verde. Pendiente: íconos PWA reales.
- 2026-06-28 — MVP validado end-to-end en Supabase real; desplegado en Vercel (`ruzosky-corredora.vercel.app`), instalable en celular. Repo en `github.com/Laleke/ruzosky-corredora` (identidad git local = Laleke, no la de trabajo).
- 2026-06-27 — Módulo **Cobros** (Paso 6, cierra MVP): migración `0007_cobros.sql` (`cargos` + `pagos`), enums tipo_cargo/estado_cargo/medio_pago. Generación asistida de arriendos del mes (idempotente), cargos manuales, pagos parciales con recálculo de saldo/estado, `vencido` derivado en lectura, deuda total. Build verde.
- 2026-06-27 — Módulo **Contratos** (Paso 5, núcleo): migración `0006_contratos.sql` (+ `contratos_arrendatarios`), enums reajuste/comisión/estado, CRUD, asignación N:M de arrendatarios, y **sincronización automática contrato→propiedad** con el contrato como fuente de verdad. Build verde.
- 2026-06-27 — Módulo **Arrendatarios** (Paso 4): migración `0005_arrendatarios.sql` (reutiliza enum `tipo_persona`, RLS solo-admin, baja lógica) + CRUD completo. Aprobado y registrado el modelo de Contratos (próximo paso). Build verde.
- 2026-06-27 — Módulos **Propiedades** (Paso 2) y **relación N:M** (Paso 3): migraciones `0003_propiedades.sql` y `0004_propietarios_propiedades.sql`. Propiedades con enums (tipo/estado/moneda), `publicada`, `fecha_adquisicion`, CRUD + baja lógica. Tabla puente como única fuente de verdad; asignación/desasignación de propietarios con validación de participación ≤ 100% y detalle de propiedad mostrando copropietarios. Build verde.
- 2026-06-27 — Módulo **Propietarios** (Paso 1): migración `0002_propietarios.sql` con RLS solo-admin, validación de RUT (dígito verificador), CRUD completo (listado + alta + edición + baja lógica) y navegación. Build verde. Subido `@supabase/ssr` a 0.12.0 (la 0.5.2 rompía la inferencia de tipos de insert/update con supabase-js 2.108).
- 2026-06-27 — Flujo de login real (SSR): login email/password, logout, área privada con layout protegido y dashboard base por rol. Tipos de BD `empresas`/`profiles` definidos a mano. Commit `cc46b04`. Pendiente: `npm install` + `npm run build` para validar compilación.
- 2026-06-27 — Definido bootstrap del primer admin: `supabase/bootstrap_admin.sql` (manual, vía service_role en SQL Editor).
- 2026-06-27 — Git inicializado con primer commit local (`da65bc7`), sin remoto. Registrada restricción de scope personal y de no-push automático.
- 2026-06-27 — Creación del scaffold base: Next.js App Router, PWA (Serwist), clientes Supabase `@supabase/ssr`, migración inicial de tenancy/auth con RLS. Sin módulos de negocio.
