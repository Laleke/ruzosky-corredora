"use client";

import { useEffect } from "react";

/**
 * Evita que el botón atrás del sistema cierre la PWA cuando el usuario está en
 * la pantalla de inicio.
 *
 * En una app instalada, la primera entrada del historial no tiene a dónde
 * volver: el atrás del celular cierra la aplicación. Acá se deja una entrada
 * centinela con la misma URL, y si el usuario presiona atrás se vuelve a
 * poner — así se queda en el inicio en vez de salirse.
 *
 * Se monta SOLO en las pantallas de inicio (portal y dashboard). En el resto el
 * atrás sigue funcionando normal (vuelve a la pantalla anterior, que casi
 * siempre es el inicio); interceptarlo en todas rompería los botones "Volver"
 * que usan `router.back()`.
 */
export function GuardiaAtras() {
  useEffect(() => {
    window.history.pushState({ rzkInicio: true }, "");

    const alVolver = () => {
      window.history.pushState({ rzkInicio: true }, "");
    };

    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  return null;
}
