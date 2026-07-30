"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Decisión de producto: el botón atrás del hardware (Android) navega un
 * nivel hacia arriba dentro de la jerarquía de la entidad — no al historial
 * real del navegador. Si estoy editando o viendo el detalle de una entidad,
 * atrás vuelve a esa entidad/listado, no salta directo a Dashboard. Solo al
 * estar en la pantalla principal (listado raíz) de una entidad, atrás lleva
 * a /dashboard.
 * Se arma una trampa de historial por página: al presionar atrás, en vez de
 * retroceder al historial real, se redirige al nivel calculado.
 */
export function BackToDashboard({ home = "/dashboard" }: { home?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === home) return;

    const segments = pathname.split("/").filter(Boolean);
    const target =
      segments.length <= 1 ? home : "/" + segments.slice(0, -1).join("/");

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      router.push(target);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname, router, home]);

  return null;
}
