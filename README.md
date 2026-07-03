# RZK Prop

Plataforma SaaS de administración inmobiliaria (Chile). PWA construida con Next.js + Supabase.

> Estado: **scaffold base**. Sin módulos de negocio aún. Ver [`PROYECTO.md`](./PROYECTO.md) para la memoria viva del proyecto.

## Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- **PWA:** Serwist (`@serwist/next`)
- **Backend / BD / Auth / Storage:** Supabase (PostgreSQL + RLS)
- **Hosting:** Vercel · **Repo:** GitHub

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local   # y completar con las claves del proyecto Supabase

# 3. Aplicar migración inicial en Supabase
#    Opción A: SQL editor del dashboard -> pegar supabase/migrations/0001_tenancy_auth.sql
#    Opción B: supabase CLI -> supabase db push

# 4. (tras aplicar migración) generar tipos
npm run types:gen

# 5. Desarrollo
npm run dev
```

## Estructura

```
src/
├── app/                  # App Router (layout, page, globals.css, sw.ts)
├── components/           # UI reutilizable global
├── features/             # módulos de negocio aislados (pendientes)
├── lib/supabase/         # clientes: client / server / middleware
├── config/               # constantes (roles, etc.)
├── types/                # database.types.ts (generado)
└── middleware.ts         # refresco de sesión + protección de rutas

supabase/migrations/      # SQL versionado (RLS multitenant)
public/                   # manifest.webmanifest, icons/
```

## Notas

- **Multitenant por RLS:** toda tabla de negocio debe llevar `empresa_id` y nacer con RLS. No saltarse esto.
- **`SUPABASE_SERVICE_ROLE_KEY`** jamás se importa en código de cliente.
- La PWA está deshabilitada en `next dev` (cachea HMR); se prueba con `npm run build && npm start`.
