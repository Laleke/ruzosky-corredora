"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Ban, Trash2, RotateCcw } from "lucide-react";
import { ui } from "@/components/ui";
import { cambiarEstadoGasto, eliminarGasto } from "./actions";
import type { EstadoGasto } from "@/types/database.types";

export function GastoAcciones({
  id,
  estado,
  ligadoALiquidacion,
}: {
  id: string;
  estado: EstadoGasto;
  ligadoALiquidacion: boolean;
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
    <div className="flex flex-wrap gap-2">
      {estado === "pendiente" && (
        <button
          onClick={() => cambiar("pagado")}
          disabled={pending}
          className={ui.btnSecondary}
        >
          <CheckCircle2 size={16} /> Marcar pagado
        </button>
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
