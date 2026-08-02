"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { SelectStyled } from "@/components/select-styled";

type Opcion = { id: string; label: string };
type Campos = { anio: string; propiedad: string; propietario: string };

export function FiltroReportes({
  valores,
  anios,
  propiedades,
  propietarios,
  hayFiltros,
}: {
  valores: Campos;
  anios: number[];
  propiedades: Opcion[];
  propietarios: Opcion[];
  hayFiltros: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [campos, setCampos] = useState<Campos>(valores);

  function set(key: keyof Campos, value: string) {
    setCampos((c) => ({ ...c, [key]: value }));
  }

  return (
    <div className="no-print mb-5">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-canvas-fg transition-colors hover:bg-white/20"
      >
        {abierto ? <X size={15} /> : <Filter size={15} />}
        {abierto ? "Ocultar filtros" : "Filtros"}
        {hayFiltros && !abierto && (
          <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-burgundy" />
        )}
      </button>

      {abierto && (
        <form
          method="get"
          className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Año</span>
            <SelectStyled
              name="anio"
              value={campos.anio}
              onChange={(e) => set("anio", e.target.value)}
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </SelectStyled>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Propiedad</span>
            <ComboboxOpcion
              name="propiedad"
              options={propiedades}
              value={campos.propiedad}
              onChange={(v) => set("propiedad", v)}
              placeholder="Todas"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Propietario</span>
            <ComboboxOpcion
              name="propietario"
              options={propietarios}
              value={campos.propietario}
              onChange={(v) => set("propietario", v)}
              placeholder="Todos"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={ui.btnSecondary}>
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setCampos({ anio: String(anios[0]), propiedad: "", propietario: "" })}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-canvas-muted transition-colors hover:bg-white/10 hover:text-canvas-fg"
            >
              Limpiar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
