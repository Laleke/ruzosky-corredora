"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import { ui } from "@/components/ui";

export function FiltroPropietarios({
  comunas,
  regiones,
  valores,
  hayFiltros,
}: {
  comunas: string[];
  regiones: string[];
  valores: { comuna?: string; region?: string; activo?: string };
  hayFiltros: boolean;
}) {
  const [abierto, setAbierto] = useState(false);

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
            <span className="font-medium text-canvas-fg">Comuna</span>
            <select name="comuna" defaultValue={valores.comuna ?? ""} className={ui.input}>
              <option value="">Todas</option>
              {comunas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Región</span>
            <select name="region" defaultValue={valores.region ?? ""} className={ui.input}>
              <option value="">Todas</option>
              {regiones.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-canvas-fg">Activo</span>
            <select name="activo" defaultValue={valores.activo ?? ""} className={ui.input}>
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={ui.btnSecondary}>
              Aplicar
            </button>
            <Link
              href="/propietarios"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-canvas-muted transition-colors hover:bg-white/10 hover:text-canvas-fg"
            >
              Limpiar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
