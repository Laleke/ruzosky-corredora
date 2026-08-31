"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Paperclip } from "lucide-react";
import { ui } from "@/components/ui";
import { SelectStyled } from "@/components/select-styled";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import { subirArchivo, limpiarArchivo } from "@/features/documentos/storage-client";
import { registrarDocumento } from "@/features/documentos/actions";
import { registrarPago, type CobroFormState } from "./actions";
import { MEDIOS_PAGO } from "./constants";

type TipoPaso = "monto" | "fecha" | "select" | "texto" | "archivo";
type Paso = { key: string; pregunta: string; tipo: TipoPaso; requerido?: boolean };

const PASOS: Paso[] = [
  { key: "monto_pagado", pregunta: "¿Cuál es el monto del pago?", tipo: "monto", requerido: true },
  { key: "fecha_pago", pregunta: "¿Qué fecha tiene el pago?", tipo: "fecha", requerido: true },
  { key: "medio_pago", pregunta: "¿Cuál fue el medio de pago?", tipo: "select" },
  { key: "referencia", pregunta: "¿Alguna observación adicional?", tipo: "texto" },
  { key: "documento_id", pregunta: "¿Deseas adjuntar un comprobante?", tipo: "archivo" },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

export function PagoWizard({
  cargoId,
  saldoPendiente,
  contratoId,
  empresaId,
}: {
  cargoId: string;
  saldoPendiente: number;
  contratoId: string;
  empresaId: string;
}) {
  const router = useRouter();
  const pasos = PASOS;
  const [state, formAction, pending] = useActionState(registrarPago.bind(null, cargoId), {
    error: null,
  } as CobroFormState);
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({
    monto_pagado: "",
    fecha_pago: hoyISO(),
    medio_pago: "transferencia",
    referencia: "",
    documento_id: "",
  });
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const enviado = useRef(false);
  // Con un solo campo visible por paso, algunos teclados móviles disparan el
  // submit implícito del formulario (tecla "Ir"/"Done") sin que llegue a
  // pasar por un evento de teclado que JS pueda interceptar a tiempo — guardó
  // el pago antes de terminar de adjuntar el comprobante. Bloquear en
  // onKeyDown no fue suficiente; acá se exige una marca explícita puesta SOLO
  // por el botón real de guardar antes de dejar pasar el submit.
  const permitirSubmit = useRef(false);

  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const actual = pasos[paso];
  const esUltimo = paso === pasos.length - 1;

  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      router.push(`/cobros/${cargoId}`);
    }
  }, [pending, state.error, cargoId, router]);

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
    const { archivo, error: errUp } = await subirArchivo(file, empresaId);
    if (!archivo) {
      setSubiendoArchivo(false);
      setErrorArchivo(errUp ?? "No se pudo subir el comprobante.");
      return;
    }

    const res = await registrarDocumento({
      nombre: `Comprobante de pago`.slice(0, 200),
      categoria: "comprobante_pago",
      contrato_id: contratoId,
      archivo,
    });
    setSubiendoArchivo(false);
    if (res.error || !res.id) {
      await limpiarArchivo(archivo.storage_path);
      setErrorArchivo(res.error ?? "No se pudo registrar el comprobante.");
      return;
    }

    set("documento_id", res.id);
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
    setPaso((p) => Math.min(p + 1, pasos.length - 1));
  }

  function atras() {
    setErrorPaso(null);
    setPaso((p) => Math.max(p - 1, 0));
  }

  function renderInput(p: Paso, visible: boolean) {
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
        <SelectStyled
          name={p.key}
          value={val}
          onChange={(e) => set(p.key, e.target.value)}
          className="text-base"
          autoFocus
        >
          {MEDIOS_PAGO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectStyled>
      );
    }
    if (p.tipo === "archivo") {
      return (
        <div className="flex flex-col items-center gap-2">
          <input type="hidden" name={p.key} value={val} />
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
            Pregunta {paso + 1} de {pasos.length}
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${((paso + 1) / pasos.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-burgundy-strong p-5 shadow-lg">
            <p className="text-center text-sm text-white">
              Se perderá el avance de este pago. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/cobros/${cargoId}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
              >
                Sí, cancelar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoCancelar(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <form
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
        <p className="text-xs text-white/60">
          Saldo pendiente: ${saldoPendiente.toLocaleString("es-CL")}
        </p>

        {pasos.map((p, i) => (
          <div key={p.key} className={i === paso ? "contents" : "hidden"}>
            {i !== paso && renderInput(p, false)}
          </div>
        ))}

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {actual.pregunta}
            {actual.requerido && <span className="ml-1 text-amber-300">*</span>}
          </h1>
        </div>

        <div className="w-full max-w-sm" key={paso}>
          {renderInput(actual, true)}
        </div>

        {errorPaso && <p className="text-sm text-amber-200">{errorPaso}</p>}
        {esUltimo && state.error && <p className="text-sm text-amber-200">{state.error}</p>}

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
              <Check size={15} /> {pending ? "Guardando…" : "Registrar pago"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
