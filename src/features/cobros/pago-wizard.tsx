"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { registrarPago, type CobroFormState } from "./actions";

const MEDIO_OPCIONES = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

type TipoPaso = "monto" | "fecha" | "select" | "texto";
type Paso = { key: string; pregunta: string; tipo: TipoPaso; requerido?: boolean };

const PASOS: Paso[] = [
  { key: "monto_pagado", pregunta: "¿Cuál es el monto del pago?", tipo: "monto", requerido: true },
  { key: "fecha_pago", pregunta: "¿Qué fecha tiene el pago?", tipo: "fecha", requerido: true },
  { key: "medio_pago", pregunta: "¿Cuál fue el medio de pago?", tipo: "select" },
  { key: "referencia", pregunta: "¿Alguna observación adicional?", tipo: "texto" },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

export function PagoWizard({ cargoId, saldoPendiente }: { cargoId: string; saldoPendiente: number }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registrarPago.bind(null, cargoId), {
    error: null,
  } as CobroFormState);
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Record<string, string>>({
    monto_pagado: "",
    fecha_pago: hoyISO(),
    medio_pago: "transferencia",
    referencia: "",
  });
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const enviado = useRef(false);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      router.push(`/cobros/${cargoId}`);
    }
  }, [pending, state.error, cargoId, router]);

  function set(key: string, value: string) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
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
        <select
          name={p.key}
          value={val}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        >
          {MEDIO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
        onSubmit={() => {
          enviado.current = true;
        }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <p className="text-xs text-white/60">Saldo pendiente: ${saldoPendiente.toLocaleString("es-CL")}</p>

        {PASOS.map((p, i) => (
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmandoCancelar(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Cancelar
          </button>
          {paso > 0 && (
            <button
              type="button"
              onClick={atras}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft size={15} /> Atrás
            </button>
          )}
          {!esUltimo ? (
            <button
              type="button"
              onClick={siguiente}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Check size={15} /> {pending ? "Guardando…" : "Registrar pago"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
