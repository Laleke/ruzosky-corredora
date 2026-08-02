import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refresca la sesión de Supabase en cada request y protege rutas privadas.
 * Se invoca desde src/middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() revalida el token contra Supabase. No usar getSession() aquí.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/invitacion") ||
    pathname.startsWith("/recuperar-clave") ||
    // La sesión de recuperación la establece el cliente en el navegador
    // desde el fragmento de la URL (#access_token=...) — en el primer
    // request al servidor todavía no hay cookie de sesión, así que esta
    // ruta tiene que ser pública o el middleware redirigiría a /login
    // antes de que el JS del cliente alcance a detectarla.
    pathname.startsWith("/actualizar-clave") ||
    pathname === "/";

  // Sin sesión y ruta privada → redirige a login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Next.js no expone el pathname actual a los Server Components (RSC) —
  // se reenvía por header para que layouts como (portal)/layout.tsx puedan
  // leerlo vía `headers()` sin duplicar lógica de ruteo en cada página.
  response.headers.set("x-pathname", pathname);
  return response;
}
