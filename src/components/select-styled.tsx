import { ChevronDown } from "lucide-react";
import { ui } from "@/components/ui";

/**
 * Select nativo con la misma apariencia que el Combobox (mismo input + chevron
 * superpuesto), para que un desplegable de opciones fijas no se vea distinto
 * al resto de los campos tipo combobox de la pantalla.
 */
export function SelectStyled(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className, ...rest } = props;
  return (
    <div className="relative">
      <select {...rest} className={`${ui.input} appearance-none pr-9 ${className ?? ""}`} />
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
