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
0c. **Integración pendiente Gastos↔Liquidaciones**: el descuento automático de gastos del propietario en la liquidación **aún no está implementado en el cálculo** (`liquidaciones/queries.calcularLiquidacion`); el modelo ya está preparado (`descontar_de_liquidacion` + `liquidacion_id`). Próximo paso natural: al generar liquidación, incluir gastos `descontar_de_liquidacion && liquidacion_id is null` del propietario como descuentos y marcarlos con el `liquidacion_id`; revertir al anular.

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
- `gastos` — fuente oficial de gastos. `propiedad_id` obligatorio; relaciones opcionales a contrato/propietario/arrendatario/liquidación/documento. `responsable_pago` (propietario/arrendatario/corredora), `estado` (pendiente/pagado/anulado), `descontar_de_liquidacion` (afecta rentabilidad del dueño), `liquidacion_id` (dónde se descontó; null = pendiente). RLS solo admin. Consumida por Reportes; preparada para descuento automático en liquidaciones.
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
### Largo plazo
- Documentos, tickets de mantención. Portal de propietario/arrendatario (políticas RLS específicas). Onboarding de segunda empresa (validar multitenancy).

## Últimos Cambios
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
