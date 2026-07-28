"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Decisión de producto: el botón atrás del hardware (Android) siempre debe
 * volver a Dashboard, sin importar la profundidad de navegación — la app se
 * comporta como una app nativa con "home", no como historial de navegador.
 * Se arma una trampa de historial por página: al presionar atrás, en vez de
 * retroceder a la pantalla anterior real, se redirige a /dashboard.
 */
export function BackToDashboard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/dashboard") return;

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      router.push("/dashboard");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname, router]);

  return null;
}
