"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { formatearFecha } from "@/lib/fecha";
import {
  eliminarContrato,
  aplicarReajusteUF,
  postergarReajuste,
  type actualizarContrato,
} from "./actions";
import type { Contrato } from "./types";

const ESTADO_OPCIONES: { value: string; label: string; tone: Parameters<typeof badge>[0] }[] = [
  { value: "borrador", label: "Borrador", tone: "neutral" },
  { value: "vigente", label: "Vigente", tone: "success" },
  { value: "vencido", label: "Vencido", tone: "warning" },
  { value: "terminado", label: "Terminado", tone: "neutral" },
  { value: "renovado", label: "Renovado", tone: "info" },
];
const ESTADO_TONE: Record<string, Parameters<typeof badge>[0]> = Object.fromEntries(
  ESTADO_OPCIONES.map((o) => [o.value, o.tone])
);
const ESTADO_LABEL: Record<string, string> = Object.fromEntries(
  ESTADO_OPCIONES.map((o) => [o.value, o.label])
);

const REAJUSTE_OPCIONES = [
  { value: "sin_reajuste", label: "Sin reajuste" },
  { value: "IPC", label: "IPC" },
  { value: "UF", label: "UF" },
];
const TIPO_COMISION_OPCIONES = [
  { value: "", label: "—" },
  { value: "porcentaje", label: "Porcentaje" },
  { value: "monto_fijo", label: "Monto fijo" },
];

function dinero(v: number | null, moneda: string): string {
  if (v === null) return "—";
  return moneda === "UF" ? `UF ${v.toLocaleString("es-CL")}` : `$${v.toLocaleString("es-CL")}`;
}

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
  displayValue,
  type = "text",
}: {
  editando: boolean;
  label: string;
  name: string;
  value?: string | number | null;
  displayValue?: React.ReactNode;
  type?: "text" | "number" | "entero" | "date";
}) {
  const esNumerico = type === "number" || type === "entero";
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      {editando ? (
        <input
          name={name}
          type={esNumerico ? "text" : type}
          inputMode={esNumerico ? (type === "entero" ? "numeric" : "decimal") : undefined}
          defaultValue={value ?? ""}
          className={`${ui.input} mt-1`}
        />
      ) : (
        <dd className="mt-0.5 text-sm text-white">
          {displayValue ?? (type === "date" ? formatearFecha(value as string | null) : value || "—")}
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

export function DetalleContrato({
  id,
  contrato,
  propiedadLabel,
  propiedades,
  actualizarAction,
  eliminacionBloqueada,
}: {
  id: string;
  contrato: Contrato;
  propiedadLabel: string;
  propiedades: { id: string; label: string }[];
  actualizarAction: typeof actualizarContrato;
  eliminacionBloqueada: { bloqueada: boolean; motivo: string | null };
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarAction.bind(null, id), {
    error: null,
  });

  const [reajusteTipo, setReajusteTipo] = useState(contrato.reajuste_tipo);
  const [tipoComision, setTipoComision] = useState(contrato.tipo_comision ?? "");
  const [cobraAdministracion, setCobraAdministracion] = useState(contrato.cobra_administracion);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const [recalculando, setRecalculando] = useState(false);
  const [errorRecalculo, setErrorRecalculo] = useState<string | null>(null);
  const [mesesPostergar, setMesesPostergar] = useState("1");
  const [postergando, setPostergando] = useState(false);

  async function onAplicarReajuste() {
    setRecalculando(true);
    setErrorRecalculo(null);
    const res = await aplicarReajusteUF(id, { error: null });
    setRecalculando(false);
    if (res.error) setErrorRecalculo(res.error);
    else router.refresh();
  }

  async function onPostergar() {
    setPostergando(true);
    setErrorRecalculo(null);
    const res = await postergarReajuste(id, Number(mesesPostergar), { error: null });
    setPostergando(false);
    if (res.error) setErrorRecalculo(res.error);
    else router.refresh();
  }

  async function onConfirmarEliminar() {
    setEliminando(true);
    setErrorEliminar(null);
    const res = await eliminarContrato(id);
    if (res?.error) {
      setEliminando(false);
      setErrorEliminar(res.error);
      setConfirmandoEliminar(false);
      return;
    }
    router.push("/contratos");
  }

  const estadoTone = ESTADO_TONE[contrato.estado] ?? "neutral";
  const reajustePendiente = Boolean(
    contrato.fecha_proximo_reajuste &&
      contrato.fecha_proximo_reajuste <= new Date().toISOString().slice(0, 10)
  );

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver a contratos
      </button>

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{propiedadLabel}</h1>
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
          <span className={badge("info")}>{contrato.numero_contrato}</span>
          <span className={badge(estadoTone)}>{ESTADO_LABEL[contrato.estado] ?? contrato.estado}</span>
          {!contrato.activo && <span className={badge("neutral")}>Inactivo</span>}
        </div>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-6">
        <Bloque titulo="Propiedad y estado">
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Propiedad</dt>
              <select
                name="propiedad_id"
                defaultValue={contrato.propiedad_id}
                required
                className={`${ui.input} mt-1`}
              >
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Dato label="Propiedad" value={propiedadLabel} />
          )}
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Estado</dt>
              <select name="estado" defaultValue={contrato.estado} className={`${ui.input} mt-1`}>
                {ESTADO_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Dato label="Estado" value={ESTADO_LABEL[contrato.estado] ?? contrato.estado} />
          )}
          <Dato label="N° de contrato" value={contrato.numero_contrato} />
        </Bloque>

        <Bloque titulo="Fechas">
          <Campo editando={editando} label="Fecha de firma" name="fecha_firma" type="date" value={contrato.fecha_firma} />
          <Campo
            editando={editando}
            label="Fecha de inicio"
            name="fecha_inicio"
            type="date"
            value={contrato.fecha_inicio}
          />
          <Campo
            editando={editando}
            label="Fecha de término"
            name="fecha_termino"
            type="date"
            value={contrato.fecha_termino}
          />
        </Bloque>

        <Bloque titulo="Canon y reajuste">
          <Campo
            editando={editando}
            label="Canon contrato (original)"
            name="canon_monto"
            type="number"
            value={contrato.canon_monto}
            displayValue={dinero(contrato.canon_monto, contrato.canon_moneda)}
          />
          <Campo
            editando={editando}
            label="Canon actual (transferencia)"
            name="canon_actual"
            type="number"
            value={contrato.canon_actual ?? contrato.canon_monto}
            displayValue={dinero(contrato.canon_actual ?? contrato.canon_monto, contrato.canon_moneda)}
          />
          {(editando ? reajusteTipo === "UF" : contrato.canon_uf_base !== null) && (
            <Campo
              editando={editando}
              label="Canon fijo en UF"
              name="canon_uf_base"
              type="number"
              value={contrato.canon_uf_base}
              displayValue={contrato.canon_uf_base ? `UF ${contrato.canon_uf_base}` : "—"}
            />
          )}
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Moneda</dt>
              <select name="canon_moneda" defaultValue={contrato.canon_moneda} className={`${ui.input} mt-1`}>
                <option value="CLP">CLP</option>
                <option value="UF">UF</option>
              </select>
            </div>
          ) : (
            <Dato label="Moneda" value={contrato.canon_moneda} />
          )}
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Reajuste</dt>
              <select
                name="reajuste_tipo"
                value={reajusteTipo}
                onChange={(e) => setReajusteTipo(e.target.value as Contrato["reajuste_tipo"])}
                className={`${ui.input} mt-1`}
              >
                {REAJUSTE_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Dato
              label="Reajuste"
              value={REAJUSTE_OPCIONES.find((o) => o.value === contrato.reajuste_tipo)?.label}
            />
          )}
          {(editando ? reajusteTipo !== "sin_reajuste" : !!contrato.periodicidad_reajuste_meses) && (
            <Campo
              editando={editando}
              label="Periodicidad (meses)"
              name="periodicidad_reajuste_meses"
              type="entero"
              value={contrato.periodicidad_reajuste_meses}
            />
          )}
          {(editando ? reajusteTipo !== "sin_reajuste" : !!contrato.fecha_proximo_reajuste) && (
            <Campo
              editando={editando}
              label="Próximo reajuste (fecha)"
              name="fecha_proximo_reajuste"
              type="date"
              value={contrato.fecha_proximo_reajuste}
            />
          )}
        </Bloque>

        {!editando && contrato.reajuste_tipo !== "sin_reajuste" && (
          <div className="rounded-xl bg-burgundy-strong p-5">
            {reajustePendiente ? (
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300">
                <Clock size={15} />
                Reajuste pendiente de revisar desde el {formatearFecha(contrato.fecha_proximo_reajuste)}. No se
                aplicó solo — puede haber un arreglo con el arrendatario.
              </p>
            ) : (
              contrato.fecha_proximo_reajuste && (
                <p className="mb-3 text-sm text-white/70">
                  Próximo reajuste a revisar: {formatearFecha(contrato.fecha_proximo_reajuste)}.
                </p>
              )
            )}
            <div className="flex flex-wrap items-center gap-3">
              {contrato.reajuste_tipo === "UF" && contrato.canon_uf_base !== null && (
                <button
                  type="button"
                  onClick={onAplicarReajuste}
                  disabled={recalculando}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  <RefreshCw size={14} className={recalculando ? "animate-spin" : ""} />
                  {recalculando ? "Aplicando…" : "Aplicar reajuste (UF)"}
                </button>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={mesesPostergar}
                  onChange={(e) => setMesesPostergar(e.target.value)}
                  className={`${ui.input} w-16`}
                  aria-label="Meses a postergar"
                />
                <button
                  type="button"
                  onClick={onPostergar}
                  disabled={postergando}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50"
                >
                  {postergando ? "Postergando…" : "Postergar reajuste"}
                </button>
              </div>
            </div>
          </div>
        )}
        {errorRecalculo && (
          <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {errorRecalculo}
          </p>
        )}

        <Bloque titulo="Comisión y administración">
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Tipo de comisión</dt>
              <select
                name="tipo_comision"
                value={tipoComision}
                onChange={(e) => setTipoComision(e.target.value)}
                className={`${ui.input} mt-1`}
              >
                {TIPO_COMISION_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Dato
              label="Tipo de comisión"
              value={TIPO_COMISION_OPCIONES.find((o) => o.value === contrato.tipo_comision)?.label}
            />
          )}
          {(editando ? tipoComision !== "" : contrato.comision_monto !== null) && (
            <Campo
              editando={editando}
              label="Valor comisión"
              name="comision_monto"
              type="number"
              value={contrato.comision_monto}
            />
          )}
          {editando ? (
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                name="cobra_administracion"
                checked={cobraAdministracion}
                onChange={(e) => setCobraAdministracion(e.target.checked)}
              />
              Cobra administración
            </label>
          ) : (
            <Dato label="Cobra administración" value={contrato.cobra_administracion ? "Sí" : "No"} />
          )}
          {(editando ? cobraAdministracion : contrato.administracion_monto !== null) && (
            <Campo
              editando={editando}
              label="Administración monto"
              name="administracion_monto"
              type="number"
              value={contrato.administracion_monto}
            />
          )}
          {(editando ? cobraAdministracion : contrato.administracion_porcentaje !== null) && (
            <Campo
              editando={editando}
              label="Administración %"
              name="administracion_porcentaje"
              type="number"
              value={contrato.administracion_porcentaje}
            />
          )}
        </Bloque>

        {(contrato.observaciones || editando) && (
          <div className="rounded-xl bg-burgundy-strong p-5">
            <h2 className="mb-2 text-sm font-semibold text-white">Observaciones</h2>
            {editando ? (
              <textarea
                name="observaciones"
                defaultValue={contrato.observaciones ?? ""}
                rows={3}
                className={ui.input}
              />
            ) : (
              <p className="text-sm text-white/90">{contrato.observaciones}</p>
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
        <div className="mt-2 flex flex-col items-center gap-2">
          {eliminacionBloqueada.bloqueada ? (
            <p className="max-w-sm text-center text-xs text-white/60">
              No se puede eliminar este contrato: {eliminacionBloqueada.motivo}
            </p>
          ) : confirmandoEliminar ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white">
                ¿Eliminar este contrato? Esta acción no se puede deshacer.
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
              <Trash2 size={14} /> Eliminar contrato
            </button>
          )}
          {errorEliminar && <p className="max-w-sm text-center text-xs text-amber-200">{errorEliminar}</p>}
        </div>
      )}
    </div>
  );
}
