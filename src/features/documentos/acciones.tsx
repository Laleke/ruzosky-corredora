"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Download, Trash2, UploadCloud } from "lucide-react";
import { ui } from "@/components/ui";
import { MAX_TAMANO_BYTES } from "./constants";
import { subirArchivo, limpiarArchivo } from "./storage-client";
import {
  urlVersion,
  subirVersion,
  eliminarVersion,
  eliminarDocumento,
} from "./actions";

function abrir(url: string, nuevaPestana: boolean) {
  const a = document.createElement("a");
  a.href = url;
  if (nuevaPestana) a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Botones Ver / Descargar para una versión. */
export function AccionesArchivo({
  versionId,
  compacto = false,
}: {
  versionId: string;
  compacto?: boolean;
}) {
  const [cargando, setCargando] = useState<"ver" | "descargar" | null>(null);

  async function abrirArchivo(modo: "ver" | "descargar") {
    setCargando(modo);
    const { url, error } = await urlVersion(versionId, modo);
    setCargando(null);
    if (url) abrir(url, modo === "ver");
    else alert(error ?? "No se pudo abrir el archivo.");
  }

  if (compacto) {
    return (
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => abrirArchivo("ver")}
          disabled={cargando !== null}
          className={ui.linkAction}
          title="Ver"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => abrirArchivo("descargar")}
          disabled={cargando !== null}
          className={ui.linkAction}
          title="Descargar"
        >
          <Download size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => abrirArchivo("ver")}
        disabled={cargando !== null}
        className={ui.btnSecondary}
      >
        <Eye size={16} /> {cargando === "ver" ? "Abriendo…" : "Ver"}
      </button>
      <button
        onClick={() => abrirArchivo("descargar")}
        disabled={cargando !== null}
        className={ui.btnSecondary}
      >
        <Download size={16} />{" "}
        {cargando === "descargar" ? "Descargando…" : "Descargar"}
      </button>
    </div>
  );
}

/** Sube una nueva versión del documento. */
export function NuevaVersionBtn({
  documentoId,
  empresaId,
}: {
  documentoId: string;
  empresaId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (file.size > MAX_TAMANO_BYTES) {
      setError("El archivo supera el tamaño máximo (25 MB).");
      return;
    }

    setPending(true);
    const { archivo, error: errUp } = await subirArchivo(file, empresaId);
    if (!archivo) {
      setPending(false);
      setError(errUp ?? "No se pudo subir el archivo.");
      return;
    }

    const res = await subirVersion(documentoId, archivo);
    setPending(false);
    if (res.error) {
      await limpiarArchivo(archivo.storage_path);
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={ui.btnSecondary}
      >
        <UploadCloud size={16} /> {pending ? "Subiendo…" : "Subir nueva versión"}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFile}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

/** Elimina una versión concreta. */
export function EliminarVersionBtn({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!confirm("¿Eliminar esta versión y su archivo? No se puede deshacer."))
      return;
    setPending(true);
    const res = await eliminarVersion(versionId);
    setPending(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
      title="Eliminar versión"
    >
      <Trash2 size={15} />
    </button>
  );
}

/** Elimina el documento completo (todas sus versiones). */
export function EliminarDocumentoBtn({ documentoId }: { documentoId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (
      !confirm(
        "¿Eliminar el documento completo con todas sus versiones? No se puede deshacer."
      )
    )
      return;
    setPending(true);
    const res = await eliminarDocumento(documentoId);
    if (res.error) {
      setPending(false);
      alert(res.error);
      return;
    }
    router.push("/documentos");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={16} /> {pending ? "Eliminando…" : "Eliminar documento"}
    </button>
  );
}
