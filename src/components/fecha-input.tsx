"use client";

import { useState } from "react";
import { ui } from "@/components/ui";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function partesDeFecha(valor: string): { d: string; m: string; a: string } {
  const [a, m, d] = valor ? valor.split("-") : ["", "", ""];
  return { d: d ?? "", m: m ?? "", a: a ?? "" };
}

function diasDelMes(anio: string, mes: string): number {
  if (!anio || !mes) return 31;
  return new Date(Number(anio), Number(mes), 0).getDate();
}

/**
 * Selector de fecha por día/mes/año en selects independientes. El nativo
 * <input type="date"> obliga a navegar mes a mes para cambiar de año en
 * varios navegadores móviles; aquí el año se elige directo de una lista.
 * Modo controlado (value + onChange) o no controlado (defaultValue).
 */
export function FechaInput({
  name,
  value,
  defaultValue,
  onChange,
  anioMin,
  anioMax,
}: {
  name: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (v: string) => void;
  anioMin?: number;
  anioMax?: number;
}) {
  const anioActual = new Date().getFullYear();
  const min = anioMin ?? anioActual - 80;
  const max = anioMax ?? anioActual + 5;

  const [interno, setInterno] = useState(defaultValue ?? "");
  const actual = value ?? interno;
  const { d, m, a } = partesDeFecha(actual);

  function actualizar(nd: string, nm: string, na: string) {
    const nuevo = nd && nm && na ? `${na}-${nm}-${nd}` : "";
    if (value === undefined) setInterno(nuevo);
    onChange?.(nuevo);
  }

  const dias = Array.from({ length: diasDelMes(a, m) }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const anios = Array.from({ length: max - min + 1 }, (_, i) => String(max - i));

  return (
    <div className="grid grid-cols-3 gap-2">
      <input type="hidden" name={name} value={actual} />
      <select
        value={d}
        onChange={(e) => actualizar(e.target.value, m, a)}
        className={ui.input}
        aria-label="Día"
      >
        <option value="">Día</option>
        {dias.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <select
        value={m}
        onChange={(e) => actualizar(d, e.target.value, a)}
        className={ui.input}
        aria-label="Mes"
      >
        <option value="">Mes</option>
        {MESES.map((label, i) => (
          <option key={label} value={String(i + 1).padStart(2, "0")}>
            {label}
          </option>
        ))}
      </select>
      <select
        value={a}
        onChange={(e) => actualizar(d, m, e.target.value)}
        className={ui.input}
        aria-label="Año"
      >
        <option value="">Año</option>
        {anios.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </div>
  );
}
