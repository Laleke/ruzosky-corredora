"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Ban, Trash2, RotateCcw, Paperclip, Eye } from "lucide-react";
import { ui } from "@/components/ui";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import { subirArchivo, limpiarArchivo } from "@/features/documentos/storage-client";
import { registrarDocumento } from "@/features/documentos/actions";
import {
  cambiarEstadoGasto,
  eliminarGasto,
  marcarGastoPagado,
  getComprobanteUrlGasto,
} from "./actions";
import type { EstadoGasto } from "@/types/database.types";

/** Marcar pagado con comprobante opcional (R4). */
export function MarcarPagadoBtn({
  id,
  empresaId,
  propiedadId,
  descripcion,
}: {
  id: string;
  empresaId: string;
  propiedadId: string;
  descripcion: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setPending(true);
    let documentoId: string | null = null;

    if (file) {
      if (file.size > MAX_TAMANO_BYTES) {
        setPending(false);
        setError("El comprobante supera el tamaño máximo (25 MB).");
        return;
      }
      const { archivo, error: e1 } = await subirArchivo(file, empresaId);
      if (!archivo) {
        setPending(false);
        setError(e1 ?? "No se pudo subir el comprobante.");
        return;
      }
      const res = await registrarDocumento({
        nombre: `Comprobante: ${descripcion}`.slice(0, 200),
        categoria: "comprobante_pago",
        propiedad_id: propiedadId,
        archivo,
      });
      if (res.error || !res.id) {
        await limpiarArchivo(archivo.storage_path);
        setPending(false);
        setError(res.error ?? "No se pudo registrar el comprobante.");
        return;
      }
      documentoId = res.id;
    }

    const r = await marcarGastoPagado(id, documentoId);
    setPending(false);
    if (r.error) setError(r.error);
    else router.refresh();
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className={ui.btnSecondary}>
        <CheckCircle2 size={16} /> Marcar pagado
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <Paperclip size={15} className="text-muted" />
        {file ? file.name : "Adjuntar comprobante (opcional)"}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex gap-2">
        <button onClick={confirmar} disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Confirmar pago"}
        </button>
        <button
          onClick={() => {
            setAbierto(false);
            setFile(null);
            setError(null);
          }}
          disabled={pending}
          className={ui.btnGhost}
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

/** Ver el comprobante adjunto (signed URL). */
export function VerComprobanteBtn({ id }: { id: string }) {
  const [cargando, setCargando] = useState(false);
  async function ver() {
    setCargando(true);
    const { url, error } = await getComprobanteUrlGasto(id);
    setCargando(false);
    if (url) window.open(url, "_blank", "noopener");
    else alert(error ?? "No se pudo abrir el comprobante.");
  }
  return (
    <button onClick={ver} disabled={cargando} className={ui.linkAction}>
      <Eye size={15} className="inline" /> {cargando ? "Abriendo…" : "Ver comprobante"}
    </button>
  );
}

export function GastoAcciones({
  id,
  estado,
  ligadoALiquidacion,
  empresaId,
  propiedadId,
  descripcion,
}: {
  id: string;
  estado: EstadoGasto;
  ligadoALiquidacion: boolean;
  empresaId: string;
  propiedadId: string;
  descripcion: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function cambiar(nuevo: EstadoGasto) {
    setPending(true);
    const res = await cambiarEstadoGasto(id, nuevo);
    setPending(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  async function borrar() {
    if (!confirm("¿Eliminar este gasto? No se puede deshacer.")) return;
    setPending(true);
    const res = await eliminarGasto(id);
    if (res.error) {
      setPending(false);
      alert(res.error);
      return;
    }
    router.push("/gastos");
    router.refresh();
  }

  if (ligadoALiquidacion) {
    return (
      <p className="text-xs text-muted">
        Gasto descontado en una liquidación: solo lectura.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {estado === "pendiente" && (
        <MarcarPagadoBtn
          id={id}
          empresaId={empresaId}
          propiedadId={propiedadId}
          descripcion={descripcion}
        />
      )}
      {estado === "pagado" && (
        <button
          onClick={() => cambiar("pendiente")}
          disabled={pending}
          className={ui.btnSecondary}
        >
          <RotateCcw size={16} /> Marcar pendiente
        </button>
      )}
      {estado !== "anulado" ? (
        <button
          onClick={() => {
            if (confirm("¿Anular este gasto?")) cambiar("anulado");
          }}
          disabled={pending}
          className={ui.btnSecondary}
        >
          <Ban size={16} /> Anular
        </button>
      ) : (
        <button
          onClick={() => cambiar("pendiente")}
          disabled={pending}
          className={ui.btnSecondary}
        >
          <RotateCcw size={16} /> Reactivar
        </button>
      )}
      <button
        onClick={borrar}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={16} /> Eliminar
      </button>
    </div>
  );
}
