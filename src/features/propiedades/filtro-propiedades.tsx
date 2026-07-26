"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import { ui } from "@/components/ui";

const TIPO_OPCIONES = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "oficina", label: "Oficina" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "bodega", label: "Bodega" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];

const ESTADO_OPCIONES = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "arrendada", label: "Arrendada" },
  { value: "mantencion", label: "Mantención" },
  { value: "inactiva", label: "Inactiva" },
];

export function FiltroPropiedades({
  comunas,
  valores,
  hayFiltros,
}: {
  comunas: string[];
  valores: { tipo?: string; comuna?: string; estado?: string; activo?: string };
  hayFiltros: boolean;
}) {
  // Siempre arranca oculto: se abre con el ícono, y al aplicar (recarga de
  // página con los filtros en la URL) vuelve a quedar oculto por defecto.
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
          className={`${ui.card} mt-3 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Tipo</span>
            <select name="tipo" defaultValue={valores.tipo ?? ""} className={ui.input}>
              <option value="">Todos</option>
              {TIPO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Comuna</span>
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
            <span className="font-medium text-ink">Estado</span>
            <select name="estado" defaultValue={valores.estado ?? ""} className={ui.input}>
              <option value="">Todos</option>
              {ESTADO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Activo</span>
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
            <Link href="/propiedades" className={ui.btnGhost}>
              Limpiar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
