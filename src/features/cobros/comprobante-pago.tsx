"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Eye } from "lucide-react";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import { subirArchivo, limpiarArchivo } from "@/features/documentos/storage-client";
import { registrarDocumento } from "@/features/documentos/actions";
import { adjuntarComprobantePago, getComprobanteUrlPago } from "./actions";
import { nombreComprobante } from "./constants";

/** Adjuntar o ver el comprobante de un pago ya registrado (fuera del wizard de creación). */
export function ComprobantePago({
  pagoId,
  cargoId,
  contratoId,
  empresaId,
  tieneComprobante,
  tipoCargo,
  periodo,
}: {
  pagoId: string;
  cargoId: string;
  contratoId: string;
  empresaId: string;
  tieneComprobante: boolean;
  /** Concepto y período del cargo, para nombrar el comprobante. */
  tipoCargo: string;
  periodo: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [cargandoVer, setCargandoVer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (file.size > MAX_TAMANO_BYTES) {
      setError("El comprobante supera el tamaño máximo (25 MB).");
      return;
    }

    setPending(true);
    const { archivo, error: errUp } = await subirArchivo(file, empresaId);
    if (!archivo) {
      setPending(false);
      setError(errUp ?? "No se pudo subir el comprobante.");
      return;
    }

    const res = await registrarDocumento({
      nombre: nombreComprobante(tipoCargo, periodo),
      categoria: "comprobante_pago",
      contrato_id: contratoId,
      archivo,
    });
    if (res.error || !res.id) {
      await limpiarArchivo(archivo.storage_path);
      setPending(false);
      setError(res.error ?? "No se pudo registrar el comprobante.");
      return;
    }

    const r = await adjuntarComprobantePago(pagoId, cargoId, res.id);
    setPending(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    router.refresh();
  }

  async function verComprobante() {
    setCargandoVer(true);
    const { url, error: errVer } = await getComprobanteUrlPago(pagoId);
    setCargandoVer(false);
    if (url) window.open(url, "_blank", "noopener");
    else alert(errVer ?? "No se pudo abrir el comprobante.");
  }

  if (tieneComprobante) {
    return (
      <button
        onClick={verComprobante}
        disabled={cargandoVer}
        className="inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white disabled:opacity-50"
        title="Ver comprobante"
      >
        <Eye size={14} /> {cargandoVer ? "Abriendo…" : "Ver"}
      </button>
    );
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-white/70 hover:text-white">
      <Paperclip size={14} />
      {pending ? "Subiendo…" : "Adjuntar"}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFile}
        disabled={pending}
      />
      {error && <span className="text-amber-200">{error}</span>}
    </label>
  );
}
