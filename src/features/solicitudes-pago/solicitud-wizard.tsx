"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Paperclip } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import { crearSolicitudPago, editarSolicitudPago, subirComprobanteSolicitud } from "./actions";
import type { SolicitudFormState, SolicitudPago } from "./types";

const MEDIO_OPCIONES = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

type TipoPaso = "monto" | "fecha" | "select" | "texto" | "archivo";
type Paso = { key: string; pregunta: string; tipo: TipoPaso; requerido?: boolean };

const PASOS: Paso[] = [
  { key: "monto_pagado", pregunta: "¿Cuánto pagaste?", tipo: "monto", requerido: true },
  { key: "fecha_pago", pregunta: "¿Qué fecha tiene el pago?", tipo: "fecha", requerido: true },
  { key: "medio_pago", pregunta: "¿Cuál fue el medio de pago?", tipo: "select" },
  { key: "referencia", pregunta: "¿Alguna observación adicional?", tipo: "texto" },
  { key: "comprobante", pregunta: "¿Tienes un comprobante para adjuntar?", tipo: "archivo" },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

/** Borrador solo para solicitudes nuevas (no al editar una ya existente, que ya trae sus datos reales). */
function draftKey(cargoId: string): string {
  return `rzk:draft:solicitud-pago:${cargoId}`;
}

type Borrador = {
  paso: number;
  valores: Record<string, string>;
  archivoNombre: string | null;
  comprobante: { path: string; nombre: string; tamano: number; mime: string | null } | null;
};

export function SolicitudPagoWizard({
  cargoId,
  saldoPendiente,
  solicitudExistente,
}: {
  cargoId: string;
  saldoPendiente: number;
  /** Si ya tiene una solicitud "pendiente" para este cargo, edita esa en vez de crear una nueva. */
  solicitudExistente?: SolicitudPago;
}) {
  const router = useRouter();
  const editando = Boolean(solicitudExistente);
  const accion = solicitudExistente
    ? editarSolicitudPago.bind(null, solicitudExistente.id, cargoId)
    : crearSolicitudPago.bind(null, cargoId);
  const [state, formAction, pending] = useActionState(accion, {
    error: null,
  } as SolicitudFormState);
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({
    monto_pagado: solicitudExistente ? String(solicitudExistente.monto) : "",
    fecha_pago: solicitudExistente?.fecha_pago ?? hoyISO(),
    medio_pago: solicitudExistente?.medio_pago ?? "transferencia",
    referencia: solicitudExistente?.referencia ?? "",
  });
  const [archivoNombre, setArchivoNombre] = useState<string | null>(
    solicitudExistente?.comprobante_nombre_archivo ?? null
  );
  const [comprobante, setComprobante] = useState<{
    path: string;
    nombre: string;
    tamano: number;
    mime: string | null;
  } | null>(
    solicitudExistente?.comprobante_storage_path
      ? {
          path: solicitudExistente.comprobante_storage_path,
          nombre: solicitudExistente.comprobante_nombre_archivo ?? "comprobante",
          tamano: solicitudExistente.comprobante_tamano_bytes ?? 0,
          mime: solicitudExistente.comprobante_mime_type,
        }
      : null
  );
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const enviado = useRef(false);
  // Con un solo campo visible por paso, algunos teclados móviles disparan el
  // submit implícito del formulario (tecla "Ir"/"Done") sin pasar por un
  // evento de teclado que JS pueda interceptar a tiempo — guardaba la
  // solicitud antes de terminar de adjuntar el comprobante. Bloquear en
  // onKeyDown no fue suficiente; acá se exige una marca explícita puesta SOLO
  // por una acción real de guardar (el botón final o "Sí, guardar" al salir).
  const permitirSubmit = useRef(false);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  function limpiarBorrador() {
    try {
      localStorage.removeItem(draftKey(cargoId));
    } catch {
      /* ignorar */
    }
  }

  // Restaurar borrador solo si se está creando una solicitud nueva: si ya se
  // está editando una existente, sus datos reales tienen prioridad sobre
  // cualquier borrador viejo que haya quedado guardado.
  useEffect(() => {
    if (editando) return;
    try {
      const raw = localStorage.getItem(draftKey(cargoId));
      if (!raw) return;
      const guardado: Borrador = JSON.parse(raw);
      if (guardado.valores) setValores((v) => ({ ...v, ...guardado.valores }));
      if (typeof guardado.paso === "number") setPaso(guardado.paso);
      if (guardado.archivoNombre) setArchivoNombre(guardado.archivoNombre);
      if (guardado.comprobante) setComprobante(guardado.comprobante);
    } catch {
      /* borrador corrupto o no disponible: ignorar */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editando) return;
    try {
      const borrador: Borrador = { paso, valores, archivoNombre, comprobante };
      localStorage.setItem(draftKey(cargoId), JSON.stringify(borrador));
    } catch {
      /* almacenamiento lleno o no disponible: ignorar */
    }
  }, [editando, cargoId, paso, valores, archivoNombre, comprobante]);

  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      limpiarBorrador();
      router.push("/portal/cargos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state.error, router]);

  function set(key: string, value: string) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

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
    setArchivoNombre(file.name);
  }

  function puedeAvanzar(): boolean {
    if (!actual.requerido) return true;
    return valores[actual.key].trim() !== "";
  }

  function siguiente() {
    if (!puedeAvanzar()) {
      setErrorPaso("Este dato es obligatorio para continuar.");
      return;
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function atras() {
    setErrorPaso(null);
    setPaso((p) => Math.max(p - 1, 0));
  }

  function renderInput(p: Paso, visible: boolean) {
    // El archivo se sube de inmediato al elegirlo (ver `onArchivo`), así que
    // acá solo se guarda su metadata en inputs hidden — no queda un `File`
    // crudo esperando el submit final del wizard.
    if (p.tipo === "archivo") {
      return (
        <div className={visible ? "flex flex-col items-center gap-2" : "hidden"}>
          <input type="hidden" name="comprobante_path" value={comprobante?.path ?? ""} />
          <input type="hidden" name="comprobante_nombre" value={comprobante?.nombre ?? ""} />
          <input type="hidden" name="comprobante_tamano" value={comprobante?.tamano ?? ""} />
          <input type="hidden" name="comprobante_mime" value={comprobante?.mime ?? ""} />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            <Paperclip size={15} />
            {subiendoArchivo
              ? "Subiendo…"
              : archivoNombre ?? "Adjuntar comprobante (opcional)"}
            <input type="file" className="hidden" onChange={onArchivo} disabled={subiendoArchivo} />
          </label>
          {errorArchivo && <p className="text-xs text-amber-200">{errorArchivo}</p>}
        </div>
      );
    }

    const val = valores[p.key];
    if (!visible) return <input type="hidden" name={p.key} value={val} />;

    if (p.tipo === "monto") {
      return (
        <input
          name={p.key}
          inputMode="numeric"
          value={fmt(val)}
          onChange={(e) => set(p.key, e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }
    if (p.tipo === "fecha") {
      return (
        <input
          name={p.key}
          type="date"
          value={val}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }
    if (p.tipo === "select") {
      return (
        <ComboboxOpcion
          name={p.key}
          options={MEDIO_OPCIONES.map((o) => ({ id: o.value, label: o.label }))}
          value={val}
          onChange={(v) => set(p.key, v)}
          placeholder="Selecciona…"
        />
      );
    }
    return (
      <input
        name={p.key}
        value={val}
        onChange={(e) => set(p.key, e.target.value)}
        className={`${ui.input} text-base`}
        autoFocus
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl bg-burgundy p-6 sm:p-10">
      <div className="flex items-center justify-end">
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium text-white/60">
            Pregunta {paso + 1} de {PASOS.length}
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-burgundy-strong p-5 shadow-lg">
            <p className="text-center text-sm text-white">
              ¿Deseas guardar {editando ? "los cambios" : "esta solicitud"} como está antes de salir?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  permitirSubmit.current = true;
                  enviado.current = true;
                  setConfirmandoCancelar(false);
                  formRef.current?.requestSubmit();
                }}
                disabled={subiendoArchivo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
              >
                Sí, guardar
              </button>
              <button
                type="button"
                onClick={() => router.push("/portal/cargos")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        onSubmit={(e) => {
          if (!permitirSubmit.current) {
            e.preventDefault();
            return;
          }
          enviado.current = true;
        }}
        onKeyDown={(e) => {
          // Solo para conveniencia (avanzar con Enter) — la protección real
          // contra el submit implícito es el chequeo de permitirSubmit arriba.
          if (
            e.key === "Enter" &&
            !esUltimo &&
            e.target instanceof HTMLElement &&
            e.target.tagName !== "TEXTAREA"
          ) {
            e.preventDefault();
            siguiente();
          }
        }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <p className="text-xs text-white/60">Saldo pendiente: ${saldoPendiente.toLocaleString("es-CL")}</p>

        {PASOS.filter((p) => p.tipo !== "archivo").map((p, i) => {
          const idx = PASOS.indexOf(p);
          return (
            <div key={p.key} className={idx === paso ? "contents" : "hidden"}>
              {idx !== paso && renderInput(p, false)}
            </div>
          );
        })}
        {renderInput(PASOS[PASOS.length - 1], paso === PASOS.length - 1)}

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {actual.pregunta}
            {actual.requerido && <span className="ml-1 text-amber-300">*</span>}
          </h1>
        </div>

        {actual.tipo !== "archivo" && (
          <div className="w-full max-w-sm" key={paso}>
            {renderInput(actual, true)}
          </div>
        )}

        {actual.key === "monto_pagado" &&
          Number(valores.monto_pagado || 0) > saldoPendiente && (
            <p className="max-w-sm text-sm text-amber-200">
              Este monto supera el saldo pendiente (${saldoPendiente.toLocaleString("es-CL")}).
              Puedes continuar igual — quedará marcado para que el propietario lo revise con más
              cuidado.
            </p>
          )}

        {errorPaso && <p className="text-sm text-amber-200">{errorPaso}</p>}
        {state.error && <p className="text-sm text-amber-200">{state.error}</p>}

        <div className="grid w-full grid-cols-3 items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmandoCancelar(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancelar
          </button>
          {paso > 0 ? (
            <button
              type="button"
              onClick={atras}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft size={15} /> Atrás
            </button>
          ) : (
            <span />
          )}
          {!esUltimo ? (
            <button
              type="button"
              onClick={siguiente}
              disabled={subiendoArchivo}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="submit"
              onClick={() => {
                permitirSubmit.current = true;
              }}
              disabled={pending || subiendoArchivo}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Check size={15} />{" "}
              {pending ? "Guardando…" : editando ? "Guardar cambios" : "Enviar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
