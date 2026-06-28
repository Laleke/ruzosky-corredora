# Puesta en marcha — Validación del MVP end-to-end

Guía para conectar el proyecto a un Supabase real y validar el ciclo completo.
Tiempo estimado: 30–45 min.

> **Scope personal:** crea el proyecto Supabase en una **organización personal tuya**,
> NO en la organización empresarial. (Mismo criterio para GitHub y Vercel.)

---

## 1. Crear el proyecto Supabase

1. Entra a https://supabase.com/dashboard → **New project**.
2. En el selector de organización, elige **tu organización personal** (créala si no tienes una donde seas el único miembro).
3. Datos:
   - **Name:** `ruzosky-corredora`
   - **Database Password:** genérala y **guárdala** (la necesitas para la CLI).
   - **Region:** `South America (São Paulo)` — la más cercana a Chile.
4. Espera ~2 min a que aprovisione.

---

## 2. Variables de entorno

1. En el dashboard: **Project Settings → API**. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (en *Project API keys*, revélala) → `SUPABASE_SERVICE_ROLE_KEY`
2. En la raíz del proyecto, copia la plantilla y complétala:
   ```bash
   cp .env.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon
   SUPABASE_SERVICE_ROLE_KEY=eyJ...        # service_role (NO se usa en el front)
   ```

> La app solo usa `URL` + `anon`. La `service_role` queda para scripts/admin futuros.
> Nunca la importes en código de cliente.
> Si editas `.env.local` con el server corriendo, **reinicia `npm run dev`**.

---

## 3. Ejecutar las migraciones (en orden estricto)

Las migraciones tienen dependencias entre sí; el orden **no es opcional**.

**Opción A — SQL Editor (recomendada para validar rápido):**
En el dashboard → **SQL Editor → New query**. Pega y ejecuta **una por una, en este orden**, el contenido de:

1. `supabase/migrations/0001_tenancy_auth.sql`  — empresas, profiles, helpers RLS
2. `supabase/migrations/0002_propietarios.sql`  — `set_updated_at()`, propietarios
3. `supabase/migrations/0003_propiedades.sql`   — propiedades
4. `supabase/migrations/0004_propietarios_propiedades.sql` — puente N:M
5. `supabase/migrations/0005_arrendatarios.sql`
6. `supabase/migrations/0006_contratos.sql`     — contratos + puente
7. `supabase/migrations/0007_cobros.sql`        — cargos + pagos

Cada una debe terminar con **Success**. Si una falla, no sigas: corrige antes.

**Opción B — Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref <TU_PROJECT_REF>   # el ref está en la URL del proyecto
npx supabase db push
```

---

## 4. Crear el primer admin + ejecutar bootstrap

El bootstrap **referencia un usuario de Auth que debe existir antes**.

1. Dashboard → **Authentication → Users → Add user → Create new user**:
   - **Email:** `admin@ruzosky.cl`
   - **Password:** la que quieras (la usarás para entrar)
   - Marca **Auto Confirm User** (si no, el login fallará por email sin confirmar).
2. SQL Editor → pega y ejecuta `supabase/bootstrap_admin.sql`.
   - Si tu email es distinto, edita la variable `v_email` arriba del script.
   - Debe devolver una fila con tu admin y la empresa "Ruzosky Corredora".
   - Si imprime *"No existe usuario auth..."*, es que el paso 1 no se hizo o el email no coincide.

---

## 5. Generar `database.types.ts` (opcional pero recomendado)

Los tipos actuales están escritos a mano y son correctos. Para sincronizarlos con el esquema real:
```bash
npx supabase login            # si no lo hiciste
npx supabase link --project-ref <TU_PROJECT_REF>
npm run types:gen
```
Si la CLI te da problemas en Windows, **puedes saltarte este paso**: la app compila y funciona con los tipos actuales.

---

## 6. Levantar la app

```bash
npm install      # si no lo has hecho
npm run dev
```
Abre **http://localhost:3000**. Debería redirigirte a `/login`.

> El service worker (PWA) está **desactivado en dev** a propósito. Para probar la PWA
> instalable: `npm run build && npm start`.

---

## 7. Probar el flujo completo

1. **Login:** entra con `admin@ruzosky.cl` + tu password → caes en `/dashboard` con el badge `admin`.
2. **Propietarios:** *Propietarios → Nuevo*. Crea uno persona natural (RUT real válido, ej. `11.111.111-1`). Prueba que un RUT inválido sea rechazado.
3. **Propiedades:** *Propiedades → Nueva*. Crea una (dirección obligatoria, tipo, moneda).
4. **Copropiedad:** entra al **detalle** de la propiedad → asigna el propietario con `100%`. Intenta asignar un segundo con `60%` → debe **rechazar** (suma > 100%). Asígnalo con `≤` el saldo.
5. **Arrendatarios:** *Arrendatarios → Nuevo*. Crea uno.
6. **Contratos:** *Contratos → Nuevo*. Selecciona la propiedad, canon, fechas, estado **vigente**. Guarda → en el **detalle** asigna el arrendatario.
   - Verifica que la **propiedad pasó a `arrendada`** automáticamente (revísala en Propiedades).
   - Intenta crear **otro contrato vigente** sobre la misma propiedad → debe **rechazar**.
7. **Generación de cargos:** *Cobros → Generar arriendos del mes* (elige el mes actual) → debe crear el cargo de arriendo del contrato vigente. Re-ejecuta: **no debe duplicar**.
8. **Registro de pagos:** abre el **detalle** del cargo → registra un pago **parcial** (menor al monto) → estado pasa a **parcial** y baja el saldo. Registra el resto → **pagado**. Intenta pagar más que el saldo → debe **rechazar**.
9. **Deuda:** vuelve a *Cobros* → la **deuda pendiente total** refleja los saldos.
10. **Terminar contrato:** edita el contrato a **terminado** → la propiedad vuelve a **disponible** (porque no queda otro contrato activo).

---

## 8. Verificar que RLS funciona

**Test A — barrera de sesión (rápido):**
En una ventana de incógnito abre `http://localhost:3000/dashboard` → debe **redirigir a `/login`**.

**Test B — anon no lee datos (prueba directa de RLS):**
Reemplaza URL y anon key y ejecuta:
```bash
curl "https://<TU_PROJECT>.supabase.co/rest/v1/propietarios?select=*" \
  -H "apikey: <ANON_KEY>"
```
Debe devolver `[]` (las políticas son `to authenticated`; el rol `anon` no tiene acceso). Si devolviera filas, la RLS estaría mal.

**Test C — aislamiento multitenant (opcional, la prueba de fuego):**
1. Crea una **segunda empresa** y un **segundo usuario** (otro email) en Auth.
2. Inserta su `profile` apuntando a la segunda empresa (SQL Editor, como en el bootstrap).
3. Inicia sesión con ese usuario → **no debe ver** ningún propietario/propiedad/contrato de Ruzosky.
   Esto confirma el aislamiento por `empresa_id` vía RLS.

---

## 9. Errores esperables en la primera puesta en marcha

| Síntoma | Causa | Solución |
|--------|-------|----------|
| Login OK pero rebota a `/login` | El usuario de Auth existe pero **no tiene `profile`** (bootstrap no corrido o email distinto) | Corre `bootstrap_admin.sql` con el email exacto del usuario |
| "Credenciales inválidas" siempre | Usuario no confirmado o password incorrecta | Recrea el usuario con **Auto Confirm**; verifica password |
| `infinite recursion detected in policy for relation "profiles"` | Se recreó `auth_empresa_id()`/`auth_rol()` **sin** `SECURITY DEFINER` | Vuelve a aplicar `0001` tal cual (esas funciones son `SECURITY DEFINER` para evitar recursión) |
| `type "tipo_persona" already exists` / `relation already exists` | Reejecutaste una migración ya aplicada | Es idempotencia: salta esa migración o usa una BD limpia |
| `permission denied for table ...` | Faltan grants al rol `authenticated` (raro en Supabase) | En SQL Editor: `grant select, insert, update, delete on all tables in schema public to authenticated;` |
| "Generar arriendos" no crea nada | El contrato está en **borrador**, no `vigente`/`renovado` | Pon el contrato en `vigente` y reintenta |
| No puedo crear contrato vigente | La propiedad ya tiene otro contrato activo (regla de negocio) | Termina el contrato anterior o usa otra propiedad |
| Cambios de `.env.local` no toman efecto | El server quedó corriendo | Reinicia `npm run dev` |
| `npm run types:gen` falla | CLI sin login/link o problemas en Windows | Es opcional; la app funciona con los tipos a mano |
| Fechas/montos no guardan | Campo de mes vacío o monto con formato raro | Usa el selector de mes; montos con punto o coma decimal |

---

## Resultado esperado

Al terminar deberías poder operar el ciclo completo
(propietario → propiedad → copropiedad → arrendatario → contrato → cargos → pagos → deuda)
contra datos reales, con RLS aislando por empresa. Recién ahí el MVP está **validado end-to-end**
y tiene sentido avanzar al **Dashboard financiero**.
