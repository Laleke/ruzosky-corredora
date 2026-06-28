# PROYECTO

## Resumen del Proyecto
**Ruzosky Corredora** — Plataforma SaaS de administración inmobiliaria para Chile. Centraliza propiedades, contratos de arriendo, propietarios, arrendatarios, pagos, finanzas, tickets de mantención y documentos. Reemplaza procesos manuales (Excel, WhatsApp, correo) por un sistema digital único.

El producto es una **PWA** (no app nativa): funciona como web e instalable en Android e iPhone. Multitenant desde el diseño, pero opera inicialmente con una sola empresa (Ruzosky Corredora).

## Estado Actual
**Fase: MVP operativo completo (en código; falta correr migraciones en Supabase real).**
Implementado: scaffold base (Next.js App Router, PWA Serwist, clientes Supabase, RLS multitenant), auth con login/logout y dashboard por rol, y los módulos de negocio: **Propietarios, Propiedades (+ copropiedad N:M), Arrendatarios, Contratos (+ sincronización de estado de propiedad), y Cobros (cargos + pagos)**. Todo compila (`next build` verde).
Ciclo operable de punta a punta: crear propietario → propiedad → asociar copropietarios → arrendatario → contrato → generar cargos del mes → registrar pagos → ver deuda.
Pendiente: aplicar las 7 migraciones en un proyecto Supabase real + bootstrap admin, `npm run types:gen`, íconos PWA, push a GitHub. Luego: dashboard financiero, liquidaciones a propietarios.

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
- `propiedades` — inmuebles. Tipo/estado/moneda como enums; `valor_referencial_arriendo` (el canon real va en contrato), `publicada` (portales) ≠ `estado`. `unique(empresa_id, codigo_interno)`. Baja lógica. RLS solo admin. NO tiene `propietario_id`: la relación vive solo en la tabla puente.
- `propietarios_propiedades` — tabla puente N:M, única fuente de verdad de la relación. `porcentaje_participacion` (copropiedad, check 0–100), `unique(propiedad_id, propietario_id)`. Permite DELETE (desasignar). RLS solo admin.
- `arrendatarios` — inquilinos. Misma forma que propietarios pero sin datos bancarios. Reutiliza enum `tipo_persona`. `unique(empresa_id, rut)`. Baja lógica. RLS solo admin.
- `contratos` — núcleo del negocio. 1 propiedad + canon (CLP/UF) + reajuste + comisión + administración + estado. `numero_contrato` editable único por empresa. Baja lógica. RLS solo admin.
- `contratos_arrendatarios` — tabla puente N:M contrato↔arrendatarios (matrimonios/codeudores/representantes). `unique(contrato_id, arrendatario_id)`. DELETE permitido. RLS solo admin.
- `cargos` — deuda generada por contrato/período/tipo. `unique(contrato_id, periodo, tipo_cargo)`. `saldo_pendiente` y `estado` recalculados por la app. RLS solo admin.
- `pagos` — abonos sobre un cargo (soporta pago parcial). `medio_pago` enum. RLS solo admin.

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
- [DEUDA] `codigo_interno` de propiedades (RUZ-0001) sin auto-generación — Riesgo: Bajo — Impacto: el admin lo tipea a mano; un contador secuencial por empresa tiene race condition bajo escritura concurrente — Corrección: al construir propiedades, evaluar secuencia por empresa vía función Postgres con bloqueo, o generación diferida.
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
- 2026-06-27 — Módulo **Cobros** (Paso 6, cierra MVP): migración `0007_cobros.sql` (`cargos` + `pagos`), enums tipo_cargo/estado_cargo/medio_pago. Generación asistida de arriendos del mes (idempotente), cargos manuales, pagos parciales con recálculo de saldo/estado, `vencido` derivado en lectura, deuda total. Build verde.
- 2026-06-27 — Módulo **Contratos** (Paso 5, núcleo): migración `0006_contratos.sql` (+ `contratos_arrendatarios`), enums reajuste/comisión/estado, CRUD, asignación N:M de arrendatarios, y **sincronización automática contrato→propiedad** con el contrato como fuente de verdad. Build verde.
- 2026-06-27 — Módulo **Arrendatarios** (Paso 4): migración `0005_arrendatarios.sql` (reutiliza enum `tipo_persona`, RLS solo-admin, baja lógica) + CRUD completo. Aprobado y registrado el modelo de Contratos (próximo paso). Build verde.
- 2026-06-27 — Módulos **Propiedades** (Paso 2) y **relación N:M** (Paso 3): migraciones `0003_propiedades.sql` y `0004_propietarios_propiedades.sql`. Propiedades con enums (tipo/estado/moneda), `publicada`, `fecha_adquisicion`, CRUD + baja lógica. Tabla puente como única fuente de verdad; asignación/desasignación de propietarios con validación de participación ≤ 100% y detalle de propiedad mostrando copropietarios. Build verde.
- 2026-06-27 — Módulo **Propietarios** (Paso 1): migración `0002_propietarios.sql` con RLS solo-admin, validación de RUT (dígito verificador), CRUD completo (listado + alta + edición + baja lógica) y navegación. Build verde. Subido `@supabase/ssr` a 0.12.0 (la 0.5.2 rompía la inferencia de tipos de insert/update con supabase-js 2.108).
- 2026-06-27 — Flujo de login real (SSR): login email/password, logout, área privada con layout protegido y dashboard base por rol. Tipos de BD `empresas`/`profiles` definidos a mano. Commit `cc46b04`. Pendiente: `npm install` + `npm run build` para validar compilación.
- 2026-06-27 — Definido bootstrap del primer admin: `supabase/bootstrap_admin.sql` (manual, vía service_role en SQL Editor).
- 2026-06-27 — Git inicializado con primer commit local (`da65bc7`), sin remoto. Registrada restricción de scope personal y de no-push automático.
- 2026-06-27 — Creación del scaffold base: Next.js App Router, PWA (Serwist), clientes Supabase `@supabase/ssr`, migración inicial de tenancy/auth con RLS. Sin módulos de negocio.
