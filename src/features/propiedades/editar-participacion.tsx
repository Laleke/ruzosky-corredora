"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
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
    <span className="flex items-center gap-1.5">
      <input
        type="number"
        min="0"
        max="100"
        value={pct}
        onChange={(e) => setPct(e.target.value)}
        onBlur={() => {
          const n = Number(pct);
          if (Number.isFinite(n)) setPct(String(n));
        }}
        className="w-16 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm text-ink outline-none focus:border-burgundy"
      />
      <span className="text-white/70">%</span>
      {cambiado && (
        <button
          onClick={guardar}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
          title="Guardar participación"
        >
          <Check size={14} /> {pending ? "…" : "Guardar"}
        </button>
      )}
    </span>
  );
}
