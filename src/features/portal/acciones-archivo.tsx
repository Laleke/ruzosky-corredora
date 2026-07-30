"use client";

import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { urlVersionPortal } from "./actions";

function abrir(url: string, nuevaPestana: boolean) {
  const a = document.createElement("a");
  a.href = url;
  if (nuevaPestana) a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Botones Ver / Descargar para una versión, desde el portal (RLS de solo lectura). */
export function AccionesArchivoPortal({ versionId }: { versionId: string }) {
  const [cargando, setCargando] = useState<"ver" | "descargar" | null>(null);

  async function abrirArchivo(modo: "ver" | "descargar") {
    setCargando(modo);
    const { url, error } = await urlVersionPortal(versionId, modo);
    setCargando(null);
    if (url) abrir(url, modo === "ver");
    else alert(error ?? "No se pudo abrir el archivo.");
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={() => abrirArchivo("ver")}
        disabled={cargando !== null}
        className="text-white/80 transition-colors hover:text-white"
        title="Ver"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => abrirArchivo("descargar")}
        disabled={cargando !== null}
        className="text-white/80 transition-colors hover:text-white"
        title="Descargar"
      >
        <Download size={16} />
      </button>
    </div>
  );
}
