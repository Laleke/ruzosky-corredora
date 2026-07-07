"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { ui } from "@/components/ui";
import { CATEGORIAS, MAX_TAMANO_BYTES, formatearTamano } from "./constants";
import { subirArchivo, limpiarArchivo } from "./storage-client";
import { registrarDocumento } from "./actions";
import type { OpcionesRelacion } from "./types";
import type { ContextoPropiedad } from "./queries";
import { SelectorPropiedadContrato } from "@/components/selector-propiedad-contrato";

export function UploadForm({
  opciones,
  empresaId,
  contexto,
}: {
  opciones: OpcionesRelacion;
  empresaId: string;
  contexto: ContextoPropiedad;
}) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!archivo) {
      setError("Selecciona un archivo.");
      return;
    }
    if (archivo.size > MAX_TAMANO_BYTES) {
      setError("El archivo supera el tamaño máximo (25 MB).");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const nombreFinal =
      String(fd.get("nombre") ?? "").trim() ||
      archivo.name.replace(/\.[^.]+$/, "");

    setPending(true);
    const { archivo: subido, error: errUp } = await subirArchivo(
      archivo,
      empresaId
    );
    if (!subido) {
      setPending(false);
      setError(errUp ?? "No se pudo subir el archivo.");
      return;
    }

    const res = await registrarDocumento({
      nombre: nombreFinal,
      categoria: String(fd.get("categoria") ?? ""),
      arrendatario_id: String(fd.get("arrendatario_id") ?? "") || null,
      propiedad_id: String(fd.get("propiedad_id") ?? "") || null,
      contrato_id: String(fd.get("contrato_id") ?? "") || null,
      observaciones: String(fd.get("observaciones") ?? "") || null,
      fecha_documento: String(fd.get("fecha_documento") ?? "") || null,
      archivo: subido,
    });

    if (res.error || !res.id) {
      await limpiarArchivo(subido.storage_path);
      setPending(false);
      setError(res.error ?? "No se pudo registrar el documento.");
      return;
    }

    router.push(`/documentos/${res.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      {/* Archivo */}
      <div className="flex flex-col gap-1.5">
        <label className={ui.label}>Archivo *</label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-stone-50/50 px-4 py-8 text-center transition hover:bg-stone-50">
          <UploadCloud size={26} className="text-burgundy" />
          <span className="text-sm text-ink">
            {archivo ? archivo.name : "Haz clic para seleccionar un archivo"}
          </span>
          <span className="text-xs text-muted">
            {archivo
              ? formatearTamano(archivo.size)
              : "PDF, imágenes, Word, Excel… hasta 25 MB"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setArchivo(f);
              if (f && !nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Nombre *</label>
          <input
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Contrato de arriendo firmado"
            className={ui.input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Categoría *</label>
          <select name="categoria" defaultValue="contrato" className={ui.input}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Fecha del documento</label>
          <input type="date" name="fecha_documento" className={ui.input} />
        </div>

        <SelectorPropiedadContrato
          propiedades={opciones.propiedades}
          contexto={contexto}
        />

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={ui.label}>Observaciones</label>
          <textarea
            name="observaciones"
            rows={3}
            placeholder="Notas internas (opcional)"
            className={ui.input}
          />
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Subiendo…" : "Guardar documento"}
        </button>
      </div>
    </form>
  );
}
