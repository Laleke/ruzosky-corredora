"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Pencil } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { actualizarCargo, eliminarCargo } from "./actions";
import { TIPO_CARGO_LABEL, esTipoDesfazado } from "./constants";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import type { CargoConContexto } from "./types";

const TIPO_OPCIONES = Object.entries(TIPO_CARGO_LABEL).map(([value, label]) => ({
  id: value,
  label,
}));

const DESTINO_OPCIONES = [
  { id: "transferencia", label: "Me transfiere a mí (corredora / propietario)" },
  { id: "directo", label: "Paga directo a la empresa de servicios" },
];

function monto(n: number | null): string {
  if (n === null) return "—";
  return `$${Number(n).toLocaleString("es-CL")}`;
}

export function DetalleCargo({ id, cargo }: { id: string; cargo: CargoConContexto }) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarCargo.bind(null, id), {
    error: null,
  });

  // Tras guardar sin error, vuelve a la vista de lectura en la misma tarjeta
  // (mismo patrón que el resto de los módulos: Arrendatarios, Propietarios,
  // Propiedades, Contratos) — antes redirigía a /cobros, único módulo que
  // expulsaba al admin de la tarjeta recién editada.
  useEffect(() => {
    if (!state.mensaje) return;
    setEditando(false);
  }, [state.mensaje]);

  const [nombre, setNombre] = useState(cargo.nombre ?? "");
  const [tipoCargo, setTipoCargo] = useState(cargo.tipo_cargo);
  const [periodo, setPeriodo] = useState(cargo.periodo.slice(0, 7));
  const [destinoPago, setDestinoPago] = useState(
    cargo.pago_directo_servicio ? "directo" : "transferencia"
  );
  const desfazado = esTipoDesfazado(tipoCargo);

  const saldo = Number(cargo.saldo_pendiente);
  const pagado = Number(cargo.monto) - saldo;

  return (
    <section className="rounded-2xl bg-burgundy p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!editando && (
            <>
              <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                {TIPO_CARGO_LABEL[cargo.tipo_cargo] ?? cargo.tipo_cargo} · {formatearPeriodo(cargo.periodo)}
              </h1>
              {cargo.nombre && (
                <p className="mt-1 text-sm font-medium text-white/90">{cargo.nombre}</p>
              )}
            </>
          )}
          <p className="mt-1 text-sm text-white/70">
            {cargo.numero_contrato ? `Contrato ${cargo.numero_contrato} · ` : ""}
            {cargo.propiedad_direccion}
          </p>
        </div>
        {!editando && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
            >
              <Pencil size={14} /> Editar
            </button>
            <form action={eliminarCargo.bind(null, id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90"
              >
                Eliminar cargo
              </button>
            </form>
          </div>
        )}
      </div>

      <form action={formAction}>
        {editando && (
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Nombre del cobro (opcional)
            </label>
            <input
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Luz depto 907-A"
              className={ui.input}
            />
          </div>
        )}
        {editando && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wide text-white/50">Tipo de cargo</label>
              <ComboboxOpcion
                name="tipo_cargo"
                options={TIPO_OPCIONES}
                value={tipoCargo}
                onChange={(v) => setTipoCargo(v as CargoConContexto["tipo_cargo"])}
                placeholder="Selecciona…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wide text-white/50">Período</label>
              <input
                name="periodo"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className={`${ui.input} w-40`}
              />
            </div>
          </div>
        )}

        <div className="mt-5 rounded-lg bg-burgundy-strong px-4 py-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-white/60">Monto</p>
              {editando ? (
                <input
                  name="monto"
                  inputMode="decimal"
                  defaultValue={cargo.monto}
                  className={`${ui.input} mt-1`}
                />
              ) : (
                <p className="text-lg font-semibold text-white">{monto(cargo.monto)}</p>
              )}
            </div>
            {pagado > 0 && !editando && (
              <div>
                <p className="text-xs text-white/60">Pagado</p>
                <p className="text-lg font-semibold text-emerald-400">{monto(pagado)}</p>
              </div>
            )}
          </div>
          <div className="my-3 border-t border-white/10" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!editando && (
              <div>
                <p className="text-xs text-white/60">Saldo pendiente</p>
                <p className="text-lg font-semibold text-white">{monto(saldo)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-white/60">Vence</p>
              {editando ? (
                <input
                  name="fecha_vencimiento"
                  type="date"
                  defaultValue={cargo.fecha_vencimiento ?? ""}
                  className={`${ui.input} mt-1`}
                />
              ) : (
                <p className="text-lg font-semibold text-white">{formatearFecha(cargo.fecha_vencimiento)}</p>
              )}
            </div>
          </div>

          {editando && desfazado && (
            <>
              <div className="my-3 border-t border-white/10" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-white/60">Consumo desde</p>
                  <input
                    name="fecha_consumo_desde"
                    type="date"
                    defaultValue={cargo.fecha_consumo_desde ?? ""}
                    className={`${ui.input} mt-1`}
                  />
                </div>
                <div>
                  <p className="text-xs text-white/60">Consumo hasta</p>
                  <input
                    name="fecha_consumo_hasta"
                    type="date"
                    defaultValue={cargo.fecha_consumo_hasta ?? ""}
                    className={`${ui.input} mt-1`}
                  />
                </div>
              </div>
              <div className="my-3 border-t border-white/10" />
              <div>
                <p className="text-xs text-white/60">¿Cómo paga el arrendatario?</p>
                <div className="mt-1 max-w-sm">
                  <ComboboxOpcion
                    name="destino_pago"
                    options={DESTINO_OPCIONES}
                    value={destinoPago}
                    onChange={setDestinoPago}
                    placeholder="Selecciona…"
                  />
                </div>
              </div>
            </>
          )}
          {editando && !desfazado && <input type="hidden" name="destino_pago" value="transferencia" />}

          {editando && (
            <>
              <div className="my-3 border-t border-white/10" />
              <div>
                <p className="text-xs text-white/60">Observaciones</p>
                <textarea
                  name="observaciones"
                  defaultValue={cargo.observaciones ?? ""}
                  rows={3}
                  className={`${ui.input} mt-1`}
                />
              </div>
            </>
          )}
        </div>

        {!editando && (cargo.fecha_consumo_desde || cargo.fecha_consumo_hasta) && (
          <p className="mt-3 text-sm text-white/70">
            Período de consumo: {formatearFecha(cargo.fecha_consumo_desde)} –{" "}
            {formatearFecha(cargo.fecha_consumo_hasta)}
          </p>
        )}
        {!editando && cargo.observaciones && (
          <p className="mt-3 text-sm text-white/70">Observaciones: {cargo.observaciones}</p>
        )}

        {state.error && (
          <p className="mt-3 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {state.error}
          </p>
        )}
        {state.mensaje && (
          <p className="mt-3 rounded-lg bg-emerald-600/20 px-3 py-2 text-sm text-emerald-300">
            {state.mensaje}
          </p>
        )}

        {editando && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="submit"
              disabled={pending || Boolean(state.mensaje)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
