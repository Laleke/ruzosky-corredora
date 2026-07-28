"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ui } from "@/components/ui";

/**
 * Igual que `Combobox` (mismo input + lista desplegable propia, nada de
 * picker nativo del sistema operativo) pero para opciones con label
 * distinto del value guardado — ej. "Cuenta corriente" se ve en pantalla,
 * "corriente" es lo que se guarda en la BD.
 */
export function SelectCombo({
  name,
  opciones,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  name: string;
  opciones: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");

  const actual = opciones.find((o) => o.value === value);
  const mostrado = open ? texto : (actual?.label ?? "");

  const q = texto.trim().toLowerCase();
  const filtradas = q ? opciones.filter((o) => o.label.toLowerCase().includes(q)) : opciones;

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        value={mostrado}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        placeholder={placeholder}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={() => {
          setTexto("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`${ui.input} pr-9`}
      />
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
      {open && !disabled && filtradas.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
          {filtradas.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-burgundy-50"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
