"use client";

import { useState } from "react";

/**
 * Input de monto en CLP con separador de miles mientras se escribe.
 * Muestra el valor formateado (es-CL) y envía el número crudo (solo dígitos)
 * en un input oculto con el `name` indicado, para que las Server Actions lo
 * lean como número. Pensado para montos enteros en pesos.
 */
export function MoneyInput({
  name,
  defaultValue,
  required,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const inicial =
    defaultValue !== undefined && defaultValue !== null && defaultValue !== ""
      ? String(defaultValue).replace(/\D/g, "")
      : "";
  const fmt = (digits: string) =>
    digits === "" ? "" : Number(digits).toLocaleString("es-CL");

  const [raw, setRaw] = useState(inicial);
  const [display, setDisplay] = useState(fmt(inicial));

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setRaw(digits);
    setDisplay(fmt(digits));
  }

  return (
    <>
      <input
        inputMode="numeric"
        value={display}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        aria-required={required}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  );
}
