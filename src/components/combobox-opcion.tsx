"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ui } from "@/components/ui";

type Opcion = { id: string; label: string };

/**
 * Variante de Combobox para listas donde el valor guardado (id) es distinto
 * del texto mostrado/buscado (label) — ej. Propiedad. Mismo look & feel
 * (buscador con fondo blanco) que Combobox, pero separa id de label.
 */
export function ComboboxOpcion({
  name,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  autoFocus = false,
}: {
  name: string;
  options: Opcion[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(() => options.find((o) => o.id === value)?.label ?? "");
  // Si aún no se escribió nada desde que se abrió, se muestran todas las
  // opciones — si no, reabrir un combo con un valor ya elegido solo mostraba
  // ese mismo valor (el texto del campo, que es el label actual, filtraba
  // la lista contra sí mismo).
  const [buscando, setBuscando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTexto(options.find((o) => o.id === value)?.label ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const q = buscando ? texto.trim().toLowerCase() : "";
  const filtradas = (
    q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options
  ).slice(0, 80);

  function revertir() {
    setTexto(options.find((o) => o.id === value)?.label ?? "");
  }

  function abrir() {
    setOpen(true);
    setBuscando(false);
  }

  // El cierre por `onBlur` no es confiable en algunos navegadores/PWA móviles
  // (queda desplegado aunque se toque fuera) — se refuerza con un listener de
  // clic/touch fuera del componente.
  useEffect(() => {
    if (!open) return;
    function onFuera(e: MouseEvent | TouchEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        revertir();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onFuera);
    document.addEventListener("touchstart", onFuera);
    return () => {
      document.removeEventListener("mousedown", onFuera);
      document.removeEventListener("touchstart", onFuera);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative" ref={contenedorRef}>
      <input type="hidden" name={name} value={value} required={required} />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        value={texto}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        placeholder={placeholder}
        onChange={(e) => {
          setTexto(e.target.value);
          setBuscando(true);
          setOpen(true);
        }}
        onFocus={abrir}
        onMouseDown={() => {
          // El input ya estaba enfocado (por eso `onFocus` no vuelve a
          // disparar): este clic es para alternar abrir/cerrar el desplegable.
          if (document.activeElement === inputRef.current) {
            if (open) {
              revertir();
              setOpen(false);
            } else {
              abrir();
            }
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            revertir();
            setOpen(false);
          }, 150);
        }}
        className={`${ui.input} pr-9`}
      />
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
      {open && !disabled && filtradas.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
          {filtradas.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.id);
                  setTexto(o.label);
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
