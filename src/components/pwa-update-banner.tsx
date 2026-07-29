"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { SerwistProvider, useSerwist } from "@serwist/next/react";

/**
 * Banner "Hay una versión nueva — Actualizar". @serwist/next ya registra el
 * SW solo (build-injected), acá solo escuchamos sus eventos de ciclo de
 * vida: cuando hay un SW nuevo esperando (waiting) se muestra el banner, y
 * al tocar "Actualizar" se le avisa que tome control (skipWaiting) — la
 * pestaña recarga una vez sola cuando el nuevo SW pasa a controlar
 * (controlling), sirviendo así el bundle nuevo.
 */
function UpdateBanner() {
  const { serwist } = useSerwist();
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    if (!serwist) return;

    const onWaiting = () => setDisponible(true);
    let recargado = false;
    const onControlling = () => {
      if (recargado) return;
      recargado = true;
      window.location.reload();
    };

    serwist.addEventListener("waiting", onWaiting);
    serwist.addEventListener("controlling", onControlling);
    return () => {
      serwist.removeEventListener("waiting", onWaiting);
      serwist.removeEventListener("controlling", onControlling);
    };
  }, [serwist]);

  if (!disponible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-sm items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm shadow-lg">
      <p className="text-white/90">Hay una versión nueva disponible.</p>
      <button
        type="button"
        onClick={() => {
          serwist?.messageSkipWaiting();
          setDisponible(false);
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-burgundy px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-burgundy-strong"
      >
        <RefreshCw size={13} />
        Actualizar
      </button>
    </div>
  );
}

export function PwaUpdateBanner({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "production") return <>{children}</>;

  return (
    <SerwistProvider swUrl="/sw.js">
      {children}
      <UpdateBanner />
    </SerwistProvider>
  );
}
