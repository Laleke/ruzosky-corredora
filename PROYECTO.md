# PROYECTO

## Resumen del Proyecto
**RZK Prop** — Plataforma SaaS de administración inmobiliaria para Chile. Centraliza propiedades, contratos de arriendo, propietarios, arrendatarios, pagos, finanzas, tickets de mantención y documentos. Reemplaza procesos manuales (Excel, WhatsApp, correo) por un sistema digital único.

El producto es una **PWA** (no app nativa): funciona como web e instalable en Android e iPhone. Multitenant desde el diseño, pero opera inicialmente con una sola empresa (RZK Prop).

## Estado Actual
**Fase: en PRODUCCIÓN (Vercel), validado y con datos de prueba limpiados.**
App **RZK Prop** operativa: auth, dashboard con KPIs, y módulos **Propietarios, Propiedades (+copropiedad N:M), Arrendatarios, Contratos (+sincronización de estado), Cobros (cargos+pagos) y Liquidaciones a propietarios** (todos funcionando). 14 migraciones (`0001`–`0014`) aplicadas en Supabase. Build de producción verde.
QA de Liquidaciones **aprobado**. Se limpiaron los datos de prueba: se borraron `cargos`, `pagos`, `liquidaciones` (+detalles) y `auditoria`, y se reseteó `contratos.corretaje_liquidado`; el **catastro se conservó** (propietarios, propiedades, arrendatarios, contratos).
Ciclo operable: propietario → propiedad → copropietarios → arrendatario → contrato → cargos del mes → pagos → deuda → liquidación al propietario.

## Punto de Continuación (handoff — actualizar al cerrar cada sesión)

**Última sesión: 2026-06-30.** App **en producción** (Vercel), desplegándose con cada push. Nombre de la app: **RZK Prop** (rebranding completo hecho). Repo `github.com/Laleke/ruzosky-corredora` (nombre de repo/URL sin cambiar, son direcciones reales).

**Estado actual:**
- MVP completo + módulo **Liquidaciones a propietarios** terminado (Fase 1A + ajustes finales). Build de producción verde. Desplegado.
- **14 migraciones** (`0001`–`0014`). Eduardo las aplica manualmente en el SQL Editor de Supabase, **en orden estricto**.
- Auth, dashboard con KPIs, y módulos: Propietarios, Propiedades (+copropiedad N:M), Arrendatarios, Contratos (+sincronización de estado), Cobros (cargos+pagos), Liquidaciones (cálculo auto + ajustes manuales + corretaje único + numeración + auditoría + PDF).
- Rediseño UI grafito+burdeo, sidebar responsivo, borrador automático en formularios, catálogo Chile (regiones/comunas/bancos), íconos PWA.

**Lo último de esta sesión (2026-06-30):**
1. **Rebranding completo a "RZK Prop"** en todo lo visible (login, sidebar, navbar, metadata, manifest/PWA, monograma "RZK", docs, seed). Sin tocar tablas, migraciones ni las URLs reales (Vercel/GitHub siguen con `ruzosky-corredora`). El email de login real sigue siendo `admin@ruzosky.cl`.
2. **QA de Liquidaciones aprobado.**
3. **Limpieza de datos de prueba** ejecutada por Eduardo en SQL Editor: borrados `cargos`, `pagos`, `liquidaciones` (+detalles) y `auditoria`; reseteado `corretaje_liquidado`. Catastro conservado. (Sesión previa: formularios de personas, códigos/números autogenerados, módulo Liquidaciones 0011–0014.)

**Pendiente / próximo (2026-07-03):**
0a. **Aplicar `supabase/migrations/0015_documentos.sql`** (Centro Documental: tablas, enum, bucket `documentos` + políticas RLS de Storage). Validar: subir → ver → descargar → nueva versión → eliminar.
0b. **Aplicar `supabase/migrations/0016_gastos.sql`** (módulo Gastos). Sin esto, Gastos y el reporte de gastos/rentabilidad fallan en runtime. Validar: crear gasto → ver en listado y en `/reportes`.
0c. ~~Integración pendiente Gastos↔Liquidaciones~~ **RESUELTO 2026-07-03**: descuento automático implementado (ver Últimos Cambios). **Validar en runtime** tras aplicar 0016: generar liquidación con gastos descontables → verificar descuento, asociación y bloqueo de re-descuento; anular → verificar liberación.

**Pendiente / próximo:**
1. **Reinstalar la PWA** en el celular para tomar el nombre/ícono "RZK Prop" (una PWA instalada no se renombra sola). iOS: Safari → Compartir → Agregar a inicio; Android: Chrome ⋮ → Instalar.
2. Opcional: renombrar el registro `empresas.nombre` de "Ruzosky Corredora" a "RZK Prop" (no se muestra en la UI, pero por prolijidad — UPDATE simple).
3. Próximos módulos sugeridos: **adjuntar comprobante de pago** (Supabase Storage; `comprobante_url` ya existe), **dashboard financiero**, **notificaciones** (email/WhatsApp — sí tienen API real), **motor de reajuste** (IPC/UF), portales propietario/arrendatario, documentos, tickets.
4. Integración deudas de servicios (Enel/Aguas Andinas): no hay API pública; evaluar agregador (Fintoc/Floid/Servipag) como research aparte.

**Flujo de trabajo:** construir → `next build` verde → commit local → **push a GitHub** (Eduardo autoriza; el push lo ejecuta el asistente cuando lo pide) → Vercel redespliega. Eduardo suele relayar respuestas de ChatGPT (co-diseñador) y pedir "respuesta para ChatGPT".

**Reglas activas:** español chileno; scopes personales (no org empresarial) en GitHub/Supabase/Vercel; identidad git local = Laleke (no email casinoexpress); `@supabase/ssr` alineado con `supabase-js`; toda tabla nueva con `empresa_id` + RLS solo-admin.

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
- `contratos` — núcleo del negocio. 1 propiedad + canon (CLP/UF) + reajuste + comisión + administración + estado. `numero_contrato` editable único por empresa. Baja lógica. RLS solo admin.
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
- **Cobros (cargos + pagos):** la deuda (cargo) existe antes del pago. Un pago abona a un cargo; `saldo_pendiente = monto − Σ pagos`; `estado` = pagado (saldo≤0) / parcial (hubo abonos) / pendiente. **`vencido` se deriva en lectura** (saldo>0 y `fecha_vencimiento < hoy`), no se almacena (evita cron). No se permite pago que supere el saldo. Generación de arriendos del mes es **asistida por botón** (no cron); upsert idempotente por `(contrato, periodo, tipo)`. **Reajuste NO automático en MVP.**

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
- [RESUELTO 2026-06-28] `codigo_interno` ahora se autogenera (`[2 iniciales comuna][inicial tipo][correlativo 4]`, ej. PRD0001) en la capa de app al crear, no editable. Correlativo por prefijo dentro de la empresa, con reintento ante colisión (unique constraint). Riesgo residual de carrera: Bajo (concurrencia de admin); si crece, mover a secuencia Postgres con bloqueo.
- [DEUDA] `database.types.ts` escrito a mano — Riesgo: Bajo — Impacto: puede divergir del esquema real — Corrección: `npm run types:gen` una vez conectado Supabase (sobrescribe el archivo).
- [DEUDA] `comuna`/`region` como texto libre — Riesgo: Bajo — Impacto: inconsistencia de datos — Corrección: tablas catálogo `ref_regiones`/`ref_comunas` cuando se justifique reporting.
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
- Dashboard financiero (deuda, morosidad, ingresos). Liquidaciones a propietarios (canon − comisión − administración). Motor de reajuste automático (IPC/UF) según `periodicidad_reajuste_meses`.
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

## Últimos Cambios
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
