"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Wrench } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { formatearFecha } from "@/lib/fecha";
import { ESTADO_INCIDENCIA, clp } from "./constants";
import {
  actualizarIncidencia,
  cambiarEstadoIncidencia,
  generarGastoDeIncidencia,
  eliminarIncidencia,
} from "./actions";
import type { IncidenciaListado } from "./types";
import type { EstadoIncidencia } from "@/types/database.types";

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value ?? "—"}</dd>
    </div>
  );
}

function Campo({
  editando,
  label,
  name,
  value,
  type = "text",
}: {
  editando: boolean;
  label: string;
  name: string;
  value?: string | number | null;
  type?: "text" | "number" | "date";
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      {editando ? (
        type === "number" ? (
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink/60">
              $
            </span>
            <MoneyInput name={name} defaultValue={value ?? ""} className={`${ui.input} pl-7`} />
          </div>
        ) : (
          <input
            name={name}
            type={type}
            defaultValue={value ?? ""}
            className={`${ui.input} mt-1`}
          />
        )
      ) : (
        <dd className="mt-0.5 text-sm text-white">
          {type === "date"
            ? formatearFecha(value as string | null)
            : type === "number"
              ? value != null
                ? clp(Number(value))
                : "—"
              : value || "—"}
        </dd>
      )}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-burgundy-strong p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{titulo}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoIncidencia, { valor: EstadoIncidencia; label: string }>> = {
  reportada: { valor: "agendada", label: "Agendar" },
  agendada: { valor: "en_proceso", label: "Marcar en proceso" },
  en_proceso: { valor: "resuelta", label: "Marcar resuelta" },
};

export function DetalleIncidencia({
  id,
  incidencia,
}: {
  id: string;
  incidencia: IncidenciaListado;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarIncidencia.bind(null, id), {
    error: null,
  });

  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [generandoGasto, setGenerandoGasto] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const est = ESTADO_INCIDENCIA[incidencia.estado];
  const siguiente = SIGUIENTE_ESTADO[incidencia.estado];
  const puedeCancelar = incidencia.estado !== "resuelta" && incidencia.estado !== "cancelada";
  const puedeGenerarGasto =
    incidencia.estado === "resuelta" && incidencia.costo != null && !incidencia.gasto_id;

  async function onCambiarEstado(nuevo: EstadoIncidencia) {
    setCambiandoEstado(true);
    setErrorEstado(null);
    const res = await cambiarEstadoIncidencia(id, nuevo);
    setCambiandoEstado(false);
    if (res.error) setErrorEstado(res.error);
    else router.refresh();
  }

  async function onGenerarGasto() {
    setGenerandoGasto(true);
    setErrorEstado(null);
    const res = await generarGastoDeIncidencia(id);
    setGenerandoGasto(false);
    if (res.error) setErrorEstado(res.error);
    else router.refresh();
  }

  async function onConfirmarEliminar() {
    setEliminando(true);
    const res = await eliminarIncidencia(id);
    if (res.error) {
      setEliminando(false);
      setErrorEliminar(res.error);
      setConfirmandoEliminar(false);
      return;
    }
    router.push("/incidencias");
  }

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <Link
        href="/incidencias"
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver a incidencias
      </Link>

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{incidencia.titulo}</h1>
          {!editando && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={badge("neutral")}>{incidencia.propiedad_label ?? "—"}</span>
          <span className={badge(est.tone)}>{est.label}</span>
          {incidencia.gasto_id && (
            <span className={badge("info")}>
              <Wrench size={12} /> Gasto generado
            </span>
          )}
        </div>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-6">
        <Bloque titulo="Incidencia">
          <Campo editando={editando} label="Título" name="titulo" value={incidencia.titulo} />
          <Dato label="Propiedad" value={incidencia.propiedad_label} />
          <Campo
            editando={editando}
            label="Fecha reportada"
            name="fecha_reportada"
            type="date"
            value={incidencia.fecha_reportada}
          />
          {(editando || incidencia.fecha_agendada) && (
            <Dato label="Fecha agendada" value={formatearFecha(incidencia.fecha_agendada)} />
          )}
          {(editando || incidencia.fecha_resuelta) && (
            <Dato label="Fecha resuelta" value={formatearFecha(incidencia.fecha_resuelta)} />
          )}
          <Campo
            editando={editando}
            label="Costo estimado"
            name="costo"
            type="number"
            value={incidencia.costo}
          />
        </Bloque>

        <Bloque titulo="Proveedor">
          <Campo
            editando={editando}
            label="Nombre"
            name="proveedor_nombre"
            value={incidencia.proveedor_nombre}
          />
          <Campo
            editando={editando}
            label="Contacto"
            name="proveedor_contacto"
            value={incidencia.proveedor_contacto}
          />
        </Bloque>

        <div className="rounded-xl bg-burgundy-strong p-5">
          <h2 className="mb-2 text-sm font-semibold text-white">Descripción</h2>
          {editando ? (
            <textarea
              name="descripcion"
              defaultValue={incidencia.descripcion ?? ""}
              rows={3}
              className={ui.input}
            />
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm text-white/90">
              {incidencia.descripcion || "—"}
            </p>
          )}
        </div>

        {(incidencia.observaciones || editando) && (
          <div className="rounded-xl bg-burgundy-strong p-5">
            <h2 className="mb-2 text-sm font-semibold text-white">Observaciones</h2>
            {editando ? (
              <textarea
                name="observaciones"
                defaultValue={incidencia.observaciones ?? ""}
                rows={3}
                className={ui.input}
              />
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm text-white/90">
                {incidencia.observaciones}
              </p>
            )}
          </div>
        )}

        {state.error && (
          <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {state.error}
          </p>
        )}

        {editando && (
          <div className="flex justify-center gap-3">
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
        )}
      </form>

      {!editando && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {siguiente && (
              <button
                type="button"
                onClick={() => onCambiarEstado(siguiente.valor)}
                disabled={cambiandoEstado}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {cambiandoEstado ? "Guardando…" : siguiente.label}
              </button>
            )}
            {puedeCancelar && (
              <button
                type="button"
                onClick={() => onCambiarEstado("cancelada")}
                disabled={cambiandoEstado}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancelar incidencia
              </button>
            )}
            {puedeGenerarGasto && (
              <button
                type="button"
                onClick={onGenerarGasto}
                disabled={generandoGasto}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50"
              >
                <Wrench size={14} /> {generandoGasto ? "Generando…" : "Generar gasto"}
              </button>
            )}
          </div>
          {errorEstado && <p className="max-w-sm text-center text-xs text-amber-200">{errorEstado}</p>}

          {incidencia.gasto_id ? (
            <p className="max-w-sm text-center text-xs text-white/60">
              Esta incidencia ya generó un gasto; no se puede eliminar.
            </p>
          ) : confirmandoEliminar ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white">
                ¿Eliminar esta incidencia? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onConfirmarEliminar}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {eliminando ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(false)}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-white/90"
            >
              <Trash2 size={14} /> Eliminar incidencia
            </button>
          )}
          {errorEliminar && <p className="max-w-sm text-center text-xs text-amber-200">{errorEliminar}</p>}
        </div>
      )}
    </div>
  );
}
