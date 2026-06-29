"use client";

import { useEffect, useRef } from "react";

/** Lee un borrador guardado (objeto campo→valor). */
export function readDraft(key: string | null): Record<string, string> {
  if (typeof window === "undefined" || !key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

/**
 * Guarda automáticamente lo escrito en un formulario y lo restaura si la página
 * se recarga (p. ej. al actualizarse la app). Limpia el borrador al enviar.
 *
 * `controlledKeys`: campos manejados por estado de React (no se restauran por DOM,
 * el componente debe inicializar su estado leyendo readDraft()).
 */
export function useFormDraft(key: string | null, controlledKeys: string[] = []) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const f = ref.current;
    if (!key || !f) return;

    // Restaurar valores guardados en los campos no controlados.
    const saved = readDraft(key);
    for (const [k, v] of Object.entries(saved)) {
      if (controlledKeys.includes(k)) continue;
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el && "value" in el && el.type !== "hidden") el.value = v;
    }

    // Guardar en cada cambio.
    const save = () => {
      const obj: Record<string, string> = {};
      new FormData(f).forEach((v, k) => {
        if (typeof v === "string" && v !== "") obj[k] = v;
      });
      try {
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {
        /* almacenamiento lleno o no disponible: ignorar */
      }
    };
    f.addEventListener("input", save);
    f.addEventListener("change", save);
    return () => {
      f.removeEventListener("input", save);
      f.removeEventListener("change", save);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const clear = () => {
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignorar */
      }
    }
  };

  return { ref, clear };
}
