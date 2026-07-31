"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Paperclip } from "lucide-react";
import { ui, badge } from "@/components/ui";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import { aprobarSolicitudPago, rechazarSolicitudPago } from "./actions";
import type { SolicitudConContexto } from "./types";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function Fila({ s }: { s: SolicitudConContexto }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onAprobar() {
    setPending(true);
    setError(null);
    const res = await aprobarSolicitudPago(s.id);
    setPending(false);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  async function onRechazar() {
    setPending(true);
    setError(null);
    const res = await rechazarSolicitudPago(s.id, motivo);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRechazando(false);
    router.refresh();
  }

  return (
    <div className={ui.listCard}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-white/60">
            {formatearPeriodo(s.periodo)} · {s.numero_contrato ?? "Contrato"}
          </p>
          <p className="font-medium text-white">{s.arrendatario_nombre}</p>
          <p className="text-xs text-white/60">{s.propiedad_direccion}</p>
        </div>
        <span className={badge("warning")}>{clp(Number(s.monto))}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-white/80">
        <span>Fecha del pago: {formatearFecha(s.fecha_pago)}</span>
        <span>Medio: {s.medio_pago ?? "—"}</span>
        {s.referencia && <span>Referencia: {s.referencia}</span>}
        {s.observaciones && <span>Observaciones: {s.observaciones}</span>}
        {s.comprobante_nombre_archivo && (
          <span className="flex items-center gap-1 text-white/60">
            <Paperclip size={13} /> {s.comprobante_nombre_archivo}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-amber-200">{error}</p>}

      {rechazando ? (
        <div className="flex flex-col gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo del rechazo…"
            className={ui.input}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRechazar}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {pending ? "Rechazando…" : "Confirmar rechazo"}
            </button>
            <button
              type="button"
              onClick={() => setRechazando(false)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAprobar}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Check size={15} /> {pending ? "Aprobando…" : "Aprobar"}
          </button>
          <button
            type="button"
            onClick={() => setRechazando(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <X size={15} /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

export function SolicitudesLista({ solicitudes }: { solicitudes: SolicitudConContexto[] }) {
  if (solicitudes.length === 0) {
    return (
      <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
        No hay solicitudes de pago pendientes.
      </div>
    );
  }

  return (
    <div className={ui.cardGrid}>
      {solicitudes.map((s) => (
        <Fila key={s.id} s={s} />
      ))}
    </div>
  );
}
