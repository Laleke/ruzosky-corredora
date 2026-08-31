"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ui } from "@/components/ui";
import { RESPONSABLE_GASTO_LABEL, clp } from "./constants";
import {
  generarCuotas,
  resolverMontoObligacion,
  sumarMeses,
  validarReparto,
  type FilaObligacion,
  type TipoMontoObligacion,
} from "./reparto";
import type { ResponsableGasto } from "@/types/database.types";

const RESPONSABLES: ResponsableGasto[] = ["propietario", "arrendatario", "corredora"];

function filaDefault(fechaGasto: string, montoTotalGasto: number): FilaObligacion {
  return {
    responsable: "propietario",
    tipo_monto: "porcentaje",
    valor: 100,
    cuotas: [{ numero_cuota: 1, monto: montoTotalGasto, fecha_vencimiento: fechaGasto || null }],
  };
}

function repartirParejo(n: number, total: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor((total / n) * 100) / 100;
  const partes = Array(n).fill(base);
  partes[n - 1] = Math.round((total - base * (n - 1)) * 100) / 100;
  return partes;
}

/**
 * Editor de reparto de un gasto: quién paga (% o monto fijo) y en cuántas
 * cuotas. Serializa el reparto en un input oculto `obligaciones` (JSON) para
 * que la server action lo lea — mismo patrón que `ajustes` en Liquidaciones.
 * En modo soloLectura no emite el input oculto (el servidor lo ignora igual
 * cuando el gasto ya no está libre para reescribir su reparto completo).
 */
export function ObligacionesEditor({
  montoTotalGasto,
  fechaGasto,
  valorInicial,
  soloLectura = false,
}: {
  montoTotalGasto: number;
  fechaGasto: string;
  valorInicial?: FilaObligacion[];
  soloLectura?: boolean;
}) {
  const [filas, setFilas] = useState<FilaObligacion[]>(
    () => (valorInicial && valorInicial.length ? valorInicial : [filaDefault(fechaGasto, montoTotalGasto)])
  );
  const [cuotasAbiertas, setCuotasAbiertas] = useState<Record<number, boolean>>({});

  // Mantiene sincronizado el monto de las filas "pago único" (la mayoría de
  // los casos) cuando cambia el monto total del gasto. Las filas con cuotas
  // múltiples se dejan tal cual (el usuario las regenera si hace falta).
  useEffect(() => {
    if (soloLectura) return;
    setFilas((prev) =>
      prev.map((f) => {
        if (f.cuotas.length !== 1) return f;
        const monto = resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor);
        return { ...f, cuotas: [{ ...f.cuotas[0], monto }] };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoTotalGasto]);

  const tipoMonto: TipoMontoObligacion = filas[0]?.tipo_monto ?? "porcentaje";
  const disponibles = RESPONSABLES.filter((r) => !filas.some((f) => f.responsable === r));
  const errorReparto = validarReparto(filas, montoTotalGasto);

  function actualizar(idx: number, patch: Partial<FilaObligacion>) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function cambiarTipoMonto(nuevo: TipoMontoObligacion) {
    const partes = repartirParejo(filas.length, nuevo === "porcentaje" ? 100 : montoTotalGasto);
    setFilas((prev) =>
      prev.map((f, i) => {
        const valor = partes[i] ?? 0;
        const monto = resolverMontoObligacion(montoTotalGasto, nuevo, valor);
        return {
          ...f,
          tipo_monto: nuevo,
          valor,
          cuotas: f.cuotas.length === 1 ? [{ ...f.cuotas[0], monto }] : f.cuotas,
        };
      })
    );
  }

  function cambiarValor(idx: number, valor: number) {
    const monto = resolverMontoObligacion(montoTotalGasto, filas[idx].tipo_monto, valor);
    actualizar(idx, {
      valor,
      cuotas: filas[idx].cuotas.length === 1 ? [{ ...filas[idx].cuotas[0], monto }] : filas[idx].cuotas,
    });
  }

  function agregarResponsable() {
    if (disponibles.length === 0) return;
    setFilas((prev) => [...prev, { responsable: disponibles[0], tipo_monto: tipoMonto, valor: 0, cuotas: [{ numero_cuota: 1, monto: 0, fecha_vencimiento: fechaGasto || null }] }]);
  }

  function quitarResponsable(idx: number) {
    if (filas.length <= 1) return;
    setFilas((prev) => prev.filter((_, i) => i !== idx));
  }

  function generarCuotasFila(idx: number, numeroCuotas: number, fechaInicio: string) {
    const f = filas[idx];
    const montoObligacion = resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor);
    const cuotas = generarCuotas(montoObligacion, numeroCuotas, fechaInicio || fechaGasto);
    actualizar(idx, { cuotas });
  }

  function editarCuota(idx: number, numeroCuota: number, patch: { monto?: number; fecha_vencimiento?: string }) {
    setFilas((prev) =>
      prev.map((f, i) =>
        i !== idx
          ? f
          : {
              ...f,
              cuotas: f.cuotas.map((c) =>
                c.numero_cuota === numeroCuota ? { ...c, ...patch } : c
              ),
            }
      )
    );
  }

  if (soloLectura) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
        {filas.map((f, i) => (
          <div key={i} className="text-sm">
            <p className="font-medium text-ink">
              {RESPONSABLE_GASTO_LABEL[f.responsable]} —{" "}
              {f.tipo_monto === "porcentaje" ? `${f.valor}%` : clp(f.valor)} ·{" "}
              {clp(resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor))}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {f.cuotas.length === 1
                ? "Pago único"
                : `${f.cuotas.length} cuotas: ${f.cuotas.map((c) => clp(c.monto)).join(", ")}`}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <label className={ui.label}>¿Cómo se reparte el pago?</label>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => cambiarTipoMonto("porcentaje")}
            className={`rounded-md px-2 py-1 ${tipoMonto === "porcentaje" ? "bg-burgundy text-white" : "bg-stone-100 text-muted"}`}
          >
            Por %
          </button>
          <button
            type="button"
            onClick={() => cambiarTipoMonto("monto_fijo")}
            className={`rounded-md px-2 py-1 ${tipoMonto === "monto_fijo" ? "bg-burgundy text-white" : "bg-stone-100 text-muted"}`}
          >
            Por monto fijo
          </button>
        </div>
      </div>

      {filas.map((f, idx) => (
        <div key={f.responsable} className="rounded-lg bg-stone-50 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">Responsable</span>
              <select
                value={f.responsable}
                onChange={(e) => actualizar(idx, { responsable: e.target.value as ResponsableGasto })}
                className={`${ui.input} py-1.5`}
              >
                <option value={f.responsable}>{RESPONSABLE_GASTO_LABEL[f.responsable]}</option>
                {disponibles.map((r) => (
                  <option key={r} value={r}>
                    {RESPONSABLE_GASTO_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">{tipoMonto === "porcentaje" ? "%" : "Monto ($)"}</span>
              <input
                type="number"
                min={0}
                value={f.valor || ""}
                onChange={(e) => cambiarValor(idx, Number(e.target.value))}
                className={`${ui.input} w-28 py-1.5`}
              />
            </div>
            <span className="pb-2 text-sm text-muted">
              = {clp(resolverMontoObligacion(montoTotalGasto, f.tipo_monto, f.valor))}
            </span>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => quitarResponsable(idx)}
                className="ml-auto rounded-md p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Quitar responsable"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => setCuotasAbiertas((v) => ({ ...v, [idx]: !v[idx] }))}
              className="text-xs font-medium text-burgundy underline"
            >
              {f.cuotas.length > 1 ? `${f.cuotas.length} cuotas` : "Pago único"} · {cuotasAbiertas[idx] ? "ocultar" : "configurar cuotas"}
            </button>

            {cuotasAbiertas[idx] && (
              <GeneradorCuotas
                fechaGasto={fechaGasto}
                cuotaActualCount={f.cuotas.length}
                onGenerar={(n, fecha) => generarCuotasFila(idx, n, fecha)}
              />
            )}

            {f.cuotas.length > 1 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {f.cuotas.map((c) => (
                  <div key={c.numero_cuota} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-muted">Cuota {c.numero_cuota}</span>
                    <input
                      type="number"
                      min={0}
                      value={c.monto || ""}
                      onChange={(e) =>
                        editarCuota(idx, c.numero_cuota, { monto: Number(e.target.value) })
                      }
                      className={`${ui.input} w-28 py-1`}
                    />
                    <input
                      type="date"
                      value={c.fecha_vencimiento ?? ""}
                      onChange={(e) =>
                        editarCuota(idx, c.numero_cuota, { fecha_vencimiento: e.target.value })
                      }
                      className={`${ui.input} py-1`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {disponibles.length > 0 && (
        <button
          type="button"
          onClick={agregarResponsable}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-burgundy"
        >
          <Plus size={15} /> Agregar responsable
        </button>
      )}

      {errorReparto && <p className="text-xs text-red-700">{errorReparto}</p>}

      <input type="hidden" name="obligaciones" value={JSON.stringify(filas)} />
    </div>
  );
}

function GeneradorCuotas({
  fechaGasto,
  cuotaActualCount,
  onGenerar,
}: {
  fechaGasto: string;
  cuotaActualCount: number;
  onGenerar: (numeroCuotas: number, fechaInicio: string) => void;
}) {
  const [n, setN] = useState(cuotaActualCount > 1 ? cuotaActualCount : 3);
  const [fecha, setFecha] = useState(fechaGasto);
  const fechaUltima = n > 1 ? sumarMeses(fecha || fechaGasto, n - 1) : fecha || fechaGasto;

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-white p-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">N° de cuotas</span>
        <input
          type="number"
          min={1}
          value={n}
          onChange={(e) => setN(Math.max(1, Number(e.target.value)))}
          className={`${ui.input} w-20 py-1`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Primera cuota</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={`${ui.input} py-1`}
        />
      </div>
      <span className="pb-1.5 text-xs text-muted">hasta {fechaUltima}</span>
      <button
        type="button"
        onClick={() => onGenerar(n, fecha || fechaGasto)}
        className="rounded-md bg-burgundy px-3 py-1.5 text-xs font-medium text-white"
      >
        Generar cuotas
      </button>
    </div>
  );
}
