"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { CATEGORIAS } from "./constants";

type Opcion = { id: string; label: string };
type Campos = {
  q: string;
  categoria: string;
  propiedad: string;
  propietario: string;
  arrendatario: string;
  desde: string;
  hasta: string;
};
const VACIOS: Campos = {
  q: "",
  categoria: "",
  propiedad: "",
  propietario: "",
  arrendatario: "",
  desde: "",
  hasta: "",
};

export function FiltroDocumentos({
  valores,
  propiedades,
  propietarios,
  arrendatarios,
  hayFiltros,
}: {
  valores: Partial<Campos>;
  propiedades: Opcion[];
  propietarios: Opcion[];
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
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-canvas-fg">Buscar</span>
            <input
              name="q"
              value={campos.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Nombre u observaciones…"
              className={ui.input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Categoría</span>
            <select
              name="categoria"
              value={campos.categoria}
              onChange={(e) => set("categoria", e.target.value)}
              className={ui.input}
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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
            <span className="font-medium text-canvas-fg">Desde</span>
            <input
              type="date"
              name="desde"
              value={campos.desde}
              onChange={(e) => set("desde", e.target.value)}
              className={ui.input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Hasta</span>
            <input
              type="date"
              name="hasta"
              value={campos.hasta}
              onChange={(e) => set("hasta", e.target.value)}
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
