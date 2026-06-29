"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ui } from "@/components/ui";

/**
 * Desplegable con buscador. El valor real viaja en un input OCULTO con `name`,
 * y el campo de texto es solo de búsqueda (sin name, anti-autofill) para que el
 * teclado/memoria del navegador no interfiera con la selección.
 */
export function Combobox({
  name,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const q = value.trim().toLowerCase();
  const filtradas = (
    q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  ).slice(0, 80);

  return (
    <div className="relative">
      {/* Valor real para el formulario */}
      <input type="hidden" name={name} value={value} />
      {/* Campo de búsqueda (no se autocompleta) */}
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
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
            <li key={o}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-burgundy-50"
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
