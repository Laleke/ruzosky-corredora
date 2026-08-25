"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { TIPO_CARGO_LABEL, TIPOS_DESFAZADOS } from "@/features/cobros/constants";
import { actualizarRecordatorio, alternarActivoRecordatorio, eliminarRecordatorio } from "./actions";
import type { RecordatorioConFaltantes } from "./types";

const TIPO_OPCIONES = TIPOS_DESFAZADOS.map((value) => ({
  id: value,
  label: TIPO_CARGO_LABEL[value] ?? value,
}));

export function RecordatorioCard({ recordatorio }: { recordatorio: RecordatorioConFaltantes }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [tipoCargo, setTipoCargo] = useState(recordatorio.tipo_cargo);
  const [state, formAction, pending] = useActionState(
    actualizarRecordatorio.bind(null, recordatorio.id),
    { error: null }
  );
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cambiandoActivo, setCambiandoActivo] = useState(false);

  const enviandoRef = useRef(false);
  useEffect(() => {
    if (pending) enviandoRef.current = true;
    if (!pending && enviandoRef.current && !state.error) {
      enviandoRef.current = false;
      setEditando(false);
    }
  }, [pending, state.error]);

  async function onEliminar() {
    setEliminando(true);
    await eliminarRecordatorio(recordatorio.id);
    router.refresh();
  }

  async function onAlternarActivo() {
    setCambiandoActivo(true);
    await alternarActivoRecordatorio(recordatorio.id, !recordatorio.activo);
    setCambiandoActivo(false);
    router.refresh();
  }

  return (
    <div className={`${ui.listCard} ${recordatorio.activo ? "" : "opacity-50"}`}>
      {!editando ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">
                {recordatorio.nombre || `Recordatorio de ${TIPO_CARGO_LABEL[recordatorio.tipo_cargo]}`}
              </p>
              <p className="text-sm text-white/70">
                {TIPO_CARGO_LABEL[recordatorio.tipo_cargo]} · avisa desde el día{" "}
                {recordatorio.dia_mes_aviso} de cada mes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className={ui.listCardIconBtn}
              aria-label="Editar recordatorio"
              title="Editar"
            >
              <Pencil size={16} />
            </button>
          </div>

          {recordatorio.faltantes.length > 0 ? (
            <div className="rounded-lg bg-amber-500/20 p-3 text-sm text-amber-200">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={14} />
                Falta este mes en {recordatorio.faltantes.length} propiedad
                {recordatorio.faltantes.length === 1 ? "" : "es"}
              </p>
              <ul className="flex flex-col gap-0.5 text-white/90">
                {recordatorio.faltantes.map((f) => (
                  <li key={f.contratoId}>· {f.propiedadDireccion}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-emerald-400">Al día — no falta ningún cargo este mes.</p>
          )}

          {confirmandoEliminar ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-white/10 p-3">
              <p className="text-sm text-white">¿Eliminar este recordatorio?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onEliminar}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {eliminando ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(false)}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onAlternarActivo}
                disabled={cambiandoActivo}
                className="text-sm font-medium text-white/80 underline hover:text-white disabled:opacity-50"
              >
                {recordatorio.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(true)}
                className="text-sm font-medium text-red-300 underline hover:text-red-200"
              >
                Eliminar
              </button>
            </div>
          )}
        </>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-white/50">Cargo a recordar</label>
            <ComboboxOpcion
              name="tipo_cargo"
              options={TIPO_OPCIONES}
              value={tipoCargo}
              onChange={(v) => setTipoCargo(v as typeof tipoCargo)}
              placeholder="Selecciona…"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Avisar desde el día
            </label>
            <input
              name="dia_mes_aviso"
              type="number"
              min={1}
              max={28}
              defaultValue={recordatorio.dia_mes_aviso}
              required
              className={`${ui.input} w-24`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Nombre (opcional)
            </label>
            <input name="nombre" defaultValue={recordatorio.nombre ?? ""} className={ui.input} />
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={pending}
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
        </form>
      )}
    </div>
  );
}
