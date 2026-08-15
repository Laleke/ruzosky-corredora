import Link from "next/link";
import { Info, Pencil, Trash2 } from "lucide-react";
import { ui } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";
import { eliminarPago } from "./actions";
import { ComprobantePago } from "./comprobante-pago";
import type { Pago } from "./types";

const MEDIO_LABEL: Record<string, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  cheque: "Cheque",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

function monto(n: number): string {
  return `$${Number(n).toLocaleString("es-CL")}`;
}

/** Listado de pagos de un cargo, en el mismo patrón de tarjeta usado en el resto de la app. */
export function PagosLista({
  cargoId,
  pagos,
  contratoId,
  empresaId,
  tipoCargo,
  periodo,
}: {
  cargoId: string;
  pagos: Pago[];
  contratoId: string;
  empresaId: string;
  tipoCargo: string;
  periodo: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {pagos.map((p) => (
        <div key={p.id} className={ui.listCard}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-white/60">{formatearFecha(p.fecha_pago)}</p>
              <p className="text-lg font-semibold text-white">{monto(p.monto_pagado)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={`/cobros/${cargoId}/pagos/${p.id}/editar`}
                aria-label="Editar pago"
                title="Editar pago"
                className={ui.listCardIconBtn}
              >
                <Pencil size={16} />
              </Link>
              <form action={eliminarPago.bind(null, p.id, cargoId)}>
                <button
                  type="submit"
                  aria-label="Eliminar pago"
                  title="Eliminar pago"
                  className={ui.listCardIconBtn}
                >
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          </div>

          <details className="min-w-0">
            <summary className={ui.listCardDisclosure}>
              <Info size={14} /> Ver más información
            </summary>
            <div className="mt-2 flex flex-col gap-1.5 text-sm text-white/80">
              <span>Medio: {p.medio_pago ? MEDIO_LABEL[p.medio_pago] ?? p.medio_pago : "—"}</span>
              <span>Referencia: {p.referencia ?? "—"}</span>
              {p.observaciones && <span>Observaciones: {p.observaciones}</span>}
              <div className="mt-0.5">
                <ComprobantePago
                  pagoId={p.id}
                  cargoId={cargoId}
                  contratoId={contratoId}
                  empresaId={empresaId}
                  tieneComprobante={Boolean(p.documento_id)}
                  tipoCargo={tipoCargo}
                  periodo={periodo}
                />
              </div>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
