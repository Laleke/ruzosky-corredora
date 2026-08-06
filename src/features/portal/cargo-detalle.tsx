"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Pencil, Paperclip, Eye, Send } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { BotonVolver } from "@/components/boton-volver";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { FechaInput } from "@/components/fecha-input";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import {
  editarSolicitudPago,
  subirComprobanteSolicitud,
  getComprobanteUrlSolicitud,
} from "@/features/solicitudes-pago/actions";
import type { SolicitudFormState, SolicitudPago } from "@/features/solicitudes-pago/types";
import type { CargoConContexto } from "@/features/cobros/types";
import type { PersonaResumen } from "./queries";

const MEDIO_OPCIONES = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

const ESTADO_SOLICITUD: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  pendiente: { label: "Esperando validación", tone: "warning" },
  aprobada: { label: "Pago validado", tone: "success" },
  rechazada: { label: "Pago no validado", tone: "danger" },
};

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function fmtMonto(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

function Campo({
  editando,
  label,
  name,
  value,
  displayValue,
  type = "text",
  full = false,
}: {
  editando: boolean;
  label: string;
  name: string;
  value?: string | number | null;
  displayValue?: React.ReactNode;
  type?: "text" | "date";
  /** Ocupa el ancho completo de la grilla — para campos que necesitan más espacio (ej. selector de fecha). */
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      {editando ? (
        type === "date" ? (
          <div className="mt-1 max-w-xs">
            <FechaInput name={name} defaultValue={value as string | null} />
          </div>
        ) : (
          <input
            name={name}
            defaultValue={value ?? ""}
            className={`${ui.input} mt-1`}
          />
        )
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

function BloquePersonas({ titulo, personas }: { titulo: string; personas: PersonaResumen[] }) {
  if (personas.length === 0) return null;
  return (
    <div className="rounded-xl bg-burgundy-strong p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{titulo}</h2>
      <div className="flex flex-col gap-3">
        {personas.map((p, i) => (
          <dl key={i} className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-white/50">Nombre</dt>
              <dd className="mt-0.5 truncate text-sm text-white">{p.nombre}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-white/50">Email</dt>
              <dd className="mt-0.5 break-all text-sm text-white">{p.email ?? "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-white/50">Teléfono</dt>
              <dd className="mt-0.5 truncate text-sm text-white">{p.telefono ?? "—"}</dd>
            </div>
          </dl>
        ))}
      </div>
    </div>
  );
}

export function CargoDetalle({
  cargo,
  arrendatarios,
  propietarios,
  solicitud,
}: {
  cargo: CargoConContexto;
  arrendatarios: PersonaResumen[];
  propietarios: PersonaResumen[];
  solicitud: SolicitudPago | null;
}) {
  const saldo = Number(cargo.saldo_pendiente);
  const puedeEditar = solicitud?.estado === "pendiente";
  const estadoInfo = solicitud ? ESTADO_SOLICITUD[solicitud.estado] : null;

  const [editando, setEditando] = useState(false);
  const accion = solicitud
    ? editarSolicitudPago.bind(null, solicitud.id, cargo.id)
    : async (s: SolicitudFormState) => s;
  const [state, formAction, pending] = useActionState(accion, {
    error: null,
  } as SolicitudFormState);

  const [montoDigitos, setMontoDigitos] = useState(solicitud ? String(solicitud.monto) : "");
  const [medioPago, setMedioPago] = useState(solicitud?.medio_pago ?? "");

  const [comprobante, setComprobante] = useState<{
    path: string;
    nombre: string;
    tamano: number;
    mime: string | null;
  } | null>(
    solicitud?.comprobante_storage_path
      ? {
          path: solicitud.comprobante_storage_path,
          nombre: solicitud.comprobante_nombre_archivo ?? "comprobante",
          tamano: solicitud.comprobante_tamano_bytes ?? 0,
          mime: solicitud.comprobante_mime_type,
        }
      : null
  );
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [cargandoComprobante, setCargandoComprobante] = useState(false);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErrorArchivo(null);

    if (file.size > MAX_TAMANO_BYTES) {
      setErrorArchivo("El comprobante supera el tamaño máximo (25 MB).");
      return;
    }

    setSubiendoArchivo(true);
    const formData = new FormData();
    formData.set("comprobante", file);
    const res = await subirComprobanteSolicitud(formData);
    setSubiendoArchivo(false);

    if ("error" in res) {
      setErrorArchivo(res.error);
      return;
    }
    setComprobante(res);
  }

  async function verComprobante() {
    if (!solicitud) return;
    setCargandoComprobante(true);
    const { url, error } = await getComprobanteUrlSolicitud(solicitud.id);
    setCargandoComprobante(false);
    if (url) window.open(url, "_blank", "noopener");
    else setErrorArchivo(error ?? "No se pudo abrir el comprobante.");
  }

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <BotonVolver label="Volver a mis cargos y pagos" />

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {etiquetaTipoCargo(cargo.tipo_cargo)} · {formatearPeriodo(cargo.periodo)}
        </h1>
        <p className="text-sm text-white/70">{cargo.propiedad_direccion}</p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Bloque titulo="Cargo">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/50">Monto</dt>
            <dd className="mt-0.5 text-sm text-white">{clp(Number(cargo.monto))}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/50">Deuda pendiente</dt>
            <dd className="mt-0.5 text-sm text-white">{clp(saldo)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/50">Vence</dt>
            <dd className="mt-0.5 text-sm text-white">{formatearFecha(cargo.fecha_vencimiento)}</dd>
          </div>
          {(cargo.fecha_consumo_desde || cargo.fecha_consumo_hasta) && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Consumo</dt>
              <dd className="mt-0.5 text-sm text-white">
                {formatearFecha(cargo.fecha_consumo_desde)} – {formatearFecha(cargo.fecha_consumo_hasta)}
              </dd>
            </div>
          )}
        </Bloque>

        <BloquePersonas titulo="Arrendatario" personas={arrendatarios} />
        <BloquePersonas titulo="Propietario" personas={propietarios} />

        <form action={formAction} className="rounded-xl bg-burgundy-strong p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Pago informado</h2>
            <div className="flex items-center gap-2">
              {estadoInfo && <span className={badge(estadoInfo.tone)}>{estadoInfo.label}</span>}
              {puedeEditar && !editando && (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
                >
                  <Pencil size={14} /> Editar
                </button>
              )}
            </div>
          </div>

          {!solicitud ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-white/70">Aún no has informado un pago para este cargo.</p>
              {saldo > 0 && (
                <Link
                  href={`/portal/cargos/${cargo.id}/solicitar-pago`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
                >
                  <Send size={15} /> Informar pago
                </Link>
              )}
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {editando ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/50">Monto pagado</dt>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                        $
                      </span>
                      <input
                        inputMode="numeric"
                        value={fmtMonto(montoDigitos)}
                        onChange={(e) => setMontoDigitos(e.target.value.replace(/\D/g, ""))}
                        className={`${ui.input} pl-6`}
                      />
                      <input type="hidden" name="monto_pagado" value={montoDigitos} />
                    </div>
                  </div>
                ) : (
                  <Campo
                    editando={false}
                    label="Monto pagado"
                    name="monto_pagado"
                    displayValue={clp(Number(solicitud.monto))}
                  />
                )}
                <Campo
                  editando={editando}
                  label="Fecha de pago"
                  name="fecha_pago"
                  type="date"
                  value={solicitud.fecha_pago}
                  full
                />
                {editando ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/50">Medio de pago</dt>
                    <div className="mt-1">
                      <ComboboxOpcion
                        name="medio_pago"
                        options={MEDIO_OPCIONES.map((o) => ({ id: o.value, label: o.label }))}
                        value={medioPago}
                        onChange={setMedioPago}
                        placeholder="Selecciona…"
                      />
                    </div>
                  </div>
                ) : (
                  <Campo
                    editando={false}
                    label="Medio de pago"
                    name="medio_pago"
                    displayValue={
                      MEDIO_OPCIONES.find((o) => o.value === solicitud.medio_pago)?.label ?? "—"
                    }
                  />
                )}
                <Campo
                  editando={editando}
                  label="Referencia"
                  name="referencia"
                  value={solicitud.referencia}
                />
              </dl>

              {(solicitud.observaciones || editando) && (
                <div className="mt-4">
                  <dt className="text-xs uppercase tracking-wide text-white/50">Observaciones</dt>
                  {editando ? (
                    <textarea
                      name="observaciones"
                      defaultValue={solicitud.observaciones ?? ""}
                      rows={2}
                      className={`${ui.input} mt-1`}
                    />
                  ) : (
                    <dd className="mt-0.5 text-sm text-white">{solicitud.observaciones}</dd>
                  )}
                </div>
              )}

              <div className="mt-4">
                <dt className="text-xs uppercase tracking-wide text-white/50">Comprobante</dt>
                <input type="hidden" name="comprobante_path" value={comprobante?.path ?? ""} />
                <input type="hidden" name="comprobante_nombre" value={comprobante?.nombre ?? ""} />
                <input type="hidden" name="comprobante_tamano" value={comprobante?.tamano ?? ""} />
                <input type="hidden" name="comprobante_mime" value={comprobante?.mime ?? ""} />
                <div className="mt-1">
                  {editando ? (
                    <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                      <Paperclip size={15} />
                      {subiendoArchivo ? "Subiendo…" : comprobante?.nombre ?? "Adjuntar comprobante"}
                      <input type="file" className="hidden" onChange={onArchivo} disabled={subiendoArchivo} />
                    </label>
                  ) : comprobante ? (
                    <button
                      type="button"
                      onClick={verComprobante}
                      disabled={cargandoComprobante}
                      className="inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white disabled:opacity-50"
                    >
                      <Eye size={14} /> {cargandoComprobante ? "Abriendo…" : `Ver (${comprobante.nombre})`}
                    </button>
                  ) : (
                    <dd className="text-sm text-white">—</dd>
                  )}
                  {errorArchivo && <p className="mt-1 text-xs text-amber-200">{errorArchivo}</p>}
                </div>
              </div>

              {solicitud.estado === "rechazada" && solicitud.motivo_rechazo && (
                <p className="mt-3 text-xs text-white/60">Motivo: {solicitud.motivo_rechazo}</p>
              )}

              {state.error && (
                <p className="mt-3 rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
                  {state.error}
                </p>
              )}

              {editando && (
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="submit"
                    disabled={pending || subiendoArchivo}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {pending ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(false);
                      setMontoDigitos(String(solicitud.monto));
                      setMedioPago(solicitud.medio_pago ?? "");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
