"use client";

import { useState } from "react";
import { ui } from "@/components/ui";
import type { ContextoPropiedad } from "@/features/documentos/queries";

type Opcion = { id: string; label: string };

/**
 * Flujo unificado: el usuario elige la Propiedad; el sistema deriva el contrato
 * vigente (único → automático; varios → se pide elegir) y de ahí el arrendatario,
 * que se muestra solo como información. Emite hidden `propiedad_id`, `contrato_id`
 * y `arrendatario_id`.
 */
export function SelectorPropiedadContrato({
  propiedades,
  contexto,
  propiedadDefault = "",
  contratoDefault = "",
  requiereContrato = false,
}: {
  propiedades: Opcion[];
  contexto: ContextoPropiedad;
  propiedadDefault?: string;
  contratoDefault?: string;
  /** Si true, avisa cuando la propiedad no tiene contrato vigente (ej. Cobros). */
  requiereContrato?: boolean;
}) {
  const [prop, setProp] = useState(propiedadDefault);
  const [contratoSel, setContratoSel] = useState(() => {
    const cs = contexto[propiedadDefault] ?? [];
    return contratoDefault || (cs.length === 1 ? cs[0].contratoId : "");
  });

  const contratos = contexto[prop] ?? [];
  const arr = contratos.find((c) => c.contratoId === contratoSel) ?? null;

  function onProp(id: string) {
    setProp(id);
    const cs = contexto[id] ?? [];
    setContratoSel(cs.length === 1 ? cs[0].contratoId : "");
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={ui.label}>Propiedad *</label>
        <select
          value={prop}
          onChange={(e) => onProp(e.target.value)}
          className={ui.input}
        >
          <option value="">Selecciona…</option>
          {propiedades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Contrato: solo se pide si hay más de un contrato vigente. */}
      {contratos.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className={ui.label}>Contrato *</label>
          <select
            value={contratoSel}
            onChange={(e) => setContratoSel(e.target.value)}
            className={ui.input}
          >
            <option value="">Selecciona…</option>
            {contratos.map((c) => (
              <option key={c.contratoId} value={c.contratoId}>
                {c.contratoLabel}
                {c.arrendatario ? ` · ${c.arrendatario}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Arrendatario: solo lectura, derivado del contrato. */}
      <div className="flex flex-col gap-1.5">
        <label className={ui.label}>Arrendatario</label>
        <div className="rounded-lg border border-line bg-stone-50 px-3 py-2 text-sm text-ink">
          {arr?.arrendatario ??
            (prop
              ? contratos.length === 0
                ? "Sin contrato vigente"
                : "—"
              : "Selecciona una propiedad")}
        </div>
      </div>

      {requiereContrato && prop && contratos.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:col-span-2">
          La propiedad no tiene un contrato vigente; no se puede generar el cobro
          hasta que exista uno.
        </p>
      )}

      <input type="hidden" name="propiedad_id" value={prop} />
      <input type="hidden" name="contrato_id" value={contratoSel} />
      <input type="hidden" name="arrendatario_id" value={arr?.arrendatarioId ?? ""} />
    </>
  );
}
