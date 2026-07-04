"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { ui } from "@/components/ui";
import { actualizarParticipacion } from "./actions";

export function EditarParticipacion({
  vinculoId,
  propiedadId,
  valor,
}: {
  vinculoId: string;
  propiedadId: string;
  valor: number;
}) {
  const router = useRouter();
  const [pct, setPct] = useState(String(valor));
  const [pending, setPending] = useState(false);

  const cambiado = Number(pct) !== Number(valor);

  async function guardar() {
    setPending(true);
    const res = await actualizarParticipacion(vinculoId, propiedadId, Number(pct));
    setPending(false);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        max="100"
        value={pct}
        onChange={(e) => setPct(e.target.value)}
        className="w-16 rounded-lg border border-line px-2 py-1 text-right text-sm outline-none focus:border-burgundy"
      />
      <span className="text-muted">%</span>
      {cambiado && (
        <button
          onClick={guardar}
          disabled={pending}
          className={`${ui.btnGhost} px-2 py-1 text-xs`}
          title="Guardar participación"
        >
          <Check size={14} /> {pending ? "…" : "Guardar"}
        </button>
      )}
    </span>
  );
}
