# Despliegue en Vercel — PWA instalable con HTTPS

Deja la app pública, con HTTPS e instalable en celular. Dos fases: GitHub → Vercel.

> Todo en **cuentas personales** de Eduardo (no la organización empresarial).

---

## Fase A — Subir el código a GitHub (cuenta personal)

1. En https://github.com (logueado con tu **cuenta personal**) → **New repository**.
   - **Owner:** tu usuario personal (NO una organización).
   - **Name:** `ruzosky-corredora`
   - **Visibility:** **Private**.
   - **NO** marques "Add a README", ".gitignore" ni "license" (ya los tenemos localmente).
   - **Create repository**.

2. En la terminal del proyecto, conecta el remoto y sube (reemplaza `TU-USUARIO`):
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/ruzosky-corredora.git
   git push -u origin main
   ```
   - Si pide credenciales, usa tu usuario y un **Personal Access Token** (no la contraseña).

> `.env.local` NO se sube (está en `.gitignore`). Las llaves se configuran en Vercel aparte.

---

## Fase B — Conectar Vercel

1. https://vercel.com → **Sign up / Log in** con tu **cuenta personal** (puedes entrar con GitHub).
   - Si te pregunta el scope/plan, elige tu cuenta personal (**Hobby**, gratis), NO un Team de empresa.

2. **Add New… → Project** → **Import** el repo `ruzosky-corredora`.
   - Si no aparece, autoriza a Vercel a ver tus repos personales.

3. Vercel detecta **Next.js** automáticamente. No cambies Build/Output (los defaults sirven).

4. Antes de desplegar, abre **Environment Variables** y agrega las **tres** (los mismos valores de tu `.env.local`):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://rrhhnfbxrxceedgueyss.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu `sb_publishable_...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | tu `sb_secret_...` |

   - Déjalas para **Production** (y Preview si quieres).

5. **Deploy**. Espera ~1–2 min.

6. Vercel te da una URL tipo `https://ruzosky-corredora.vercel.app`.
   - Ábrela en el celular → inicia sesión con `admin@ruzosky.cl`.
   - Para **instalarla**: en Chrome/Android "Agregar a pantalla de inicio"; en Safari/iPhone botón Compartir → "Agregar a inicio". Ahora sí, porque hay HTTPS.

---

## Notas

- **No requiere allowlist de redirect** en Supabase: el login es email/password (sin OAuth).
- **Cada `git push` a `main`** redespliega automáticamente en Vercel.
- Si el build falla en Vercel, casi siempre es una **variable de entorno faltante** → revisa las tres en Settings → Environment Variables y haz **Redeploy**.
- El proyecto Supabase es el mismo (la nube), así que los datos que ya cargaste aparecen igual.
