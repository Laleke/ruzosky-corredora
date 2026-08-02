"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { SelectStyled } from "@/components/select-styled";

const ESTADO_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Parcial" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
];

type Opcion = { id: string; label: string };

type Campos = {
  propiedad: string;
  arrendatario: string;
  estado: string;
  periodo: string;
  venceDesde: string;
  venceHasta: string;
};
const VACIOS: Campos = {
  propiedad: "",
  arrendatario: "",
  estado: "",
  periodo: "",
  venceDesde: "",
  venceHasta: "",
};

export function FiltroCobros({
  valores,
  propiedades,
  arrendatarios,
  hayFiltros,
}: {
  valores: Partial<Campos>;
  propiedades: Opcion[];
  arrendatarios: Opcion[];
  hayFiltros: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [campos, setCampos] = useState<Campos>({ ...VACIOS, ...valores });

  function set(key: keyof Campos, value: string) {
    setCampos((c) => ({ ...c, [key]: value }));
  }

  return (
    <div className="mb-5">
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
            <span className="font-medium text-canvas-fg">Arrendatario</span>
            <ComboboxOpcion
              name="arrendatario"
              options={arrendatarios}
              value={campos.arrendatario}
              onChange={(v) => set("arrendatario", v)}
              placeholder="Todos"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Estado</span>
            <SelectStyled
              name="estado"
              value={campos.estado}
              onChange={(e) => set("estado", e.target.value)}
            >
              <option value="">Todos</option>
              {ESTADO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectStyled>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Período</span>
            <input
              type="month"
              name="periodo"
              value={campos.periodo}
              onChange={(e) => set("periodo", e.target.value)}
              className={ui.input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Vence desde</span>
            <input
              type="date"
              name="venceDesde"
              value={campos.venceDesde}
              onChange={(e) => set("venceDesde", e.target.value)}
              className={ui.input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Vence hasta</span>
            <input
              type="date"
              name="venceHasta"
              value={campos.venceHasta}
              onChange={(e) => set("venceHasta", e.target.value)}
              className={ui.input}
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={ui.btnSecondary}>
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setCampos(VACIOS)}
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
