"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { crearCargo, type CobroFormState } from "./actions";
import { esTipoDesfazado } from "./constants";
import type { ContextoPropiedad } from "@/features/documentos/queries";

const TIPO_OPCIONES = [
  { value: "arriendo", label: "Arriendo" },
  { value: "gasto_comun", label: "Gasto común" },
  { value: "luz", label: "Luz" },
  { value: "agua", label: "Agua" },
  { value: "internet", label: "Internet" },
  { value: "multa", label: "Multa" },
  { value: "ajuste", label: "Ajuste" },
  { value: "otro", label: "Otro" },
];

type TipoPaso = "propiedad" | "select" | "periodo" | "monto" | "fecha" | "textarea";

type Paso = {
  key: string;
  pregunta: string;
  tipo: TipoPaso;
  requerido?: boolean;
  omitirSi?: (v: Valores) => boolean;
};

const PASOS: Paso[] = [
  { key: "propiedad_id", pregunta: "¿A qué propiedad y contrato corresponde el cargo?", tipo: "propiedad", requerido: true },
  { key: "tipo_cargo", pregunta: "¿Qué tipo de cargo es?", tipo: "select", requerido: true },
  { key: "periodo", pregunta: "¿A qué período corresponde (cobro/vencimiento)?", tipo: "periodo", requerido: true },
  {
    key: "fecha_consumo_desde",
    pregunta: "¿Desde cuándo es el período de consumo de esta boleta?",
    tipo: "fecha",
    omitirSi: (v) => !esTipoDesfazado(v.tipo_cargo),
  },
  {
    key: "fecha_consumo_hasta",
    pregunta: "¿Hasta cuándo es el período de consumo de esta boleta?",
    tipo: "fecha",
    omitirSi: (v) => !esTipoDesfazado(v.tipo_cargo),
  },
  { key: "monto", pregunta: "¿Cuál es el monto?", tipo: "monto", requerido: true },
  { key: "fecha_vencimiento", pregunta: "¿Cuál es la fecha de vencimiento?", tipo: "fecha" },
  { key: "observaciones", pregunta: "¿Alguna observación adicional?", tipo: "textarea" },
];

type Valores = Record<string, string>;

const VALORES_INICIALES: Valores = {
  propiedad_id: "",
  contrato_id: "",
  arrendatario_id: "",
  // En blanco a propósito: preseleccionar un tipo hacía que se guardaran
  // cargos con el tipo por defecto sin que nadie lo eligiera.
  tipo_cargo: "",
  periodo: "",
  fecha_consumo_desde: "",
  fecha_consumo_hasta: "",
  monto: "",
  fecha_vencimiento: "",
  observaciones: "",
};

const DRAFT_KEY = "rzk:draft:cargo-wizard";

function fmt(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

export function CargoWizard({
  propiedades,
  contexto,
}: {
  propiedades: { id: string; label: string }[];
  contexto: ContextoPropiedad;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearCargo, { error: null });
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const guardado = JSON.parse(raw);
      if (guardado?.valores) setValores({ ...VALORES_INICIALES, ...guardado.valores });
      if (typeof guardado?.paso === "number") setPaso(guardado.paso);
    } catch {
      /* borrador corrupto o no disponible: ignorar */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ paso, valores }));
    } catch {
      /* almacenamiento lleno o no disponible: ignorar */
    }
  }, [paso, valores]);

  function limpiarBorrador() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignorar */
    }
  }

  function set(key: string, value: string) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

  function puedeAvanzar(): boolean {
    if (actual.key === "propiedad_id") return Boolean(valores.contrato_id);
    if (!actual.requerido) return true;
    return valores[actual.key].trim() !== "";
  }

  function avanzarDesde(desde: number): number {
    let next = desde + 1;
    while (next < PASOS.length && PASOS[next].omitirSi?.(valores)) next++;
    return Math.min(next, PASOS.length - 1);
  }

  function siguiente() {
    if (!puedeAvanzar()) {
      setErrorPaso(
        actual.key === "propiedad_id"
          ? "Selecciona una propiedad con contrato vigente."
          : "Este dato es obligatorio para continuar."
      );
      return;
    }
    setPaso(avanzarDesde(paso));
  }

  function atras() {
    setErrorPaso(null);
    setPaso((p) => {
      let prev = p - 1;
      while (prev >= 0 && PASOS[prev].omitirSi?.(valores)) prev--;
      return Math.max(prev, 0);
    });
  }

  function renderInput(p: Paso, visible: boolean) {
    const val = valores[p.key] ?? "";

    if (p.key === "propiedad_id") {
      if (!visible) {
        return (
          <>
            <input type="hidden" name="propiedad_id" value={valores.propiedad_id} />
            <input type="hidden" name="contrato_id" value={valores.contrato_id} />
            <input type="hidden" name="arrendatario_id" value={valores.arrendatario_id} />
          </>
        );
      }
      return (
        <div className="flex flex-col gap-3 text-left">
          <SelectorPropiedadContratoWizard valores={valores} set={set} propiedades={propiedades} contexto={contexto} />
        </div>
      );
    }

    if (!visible) {
      if (p.omitirSi?.(valores)) return null;
      return <input type="hidden" name={p.key} value={val} />;
    }

    if (p.tipo === "select") {
      return (
        <ComboboxOpcion
          name={p.key}
          options={TIPO_OPCIONES.map((o) => ({ id: o.value, label: o.label }))}
          value={val}
          onChange={(v) => set(p.key, v)}
          placeholder="Selecciona…"
        />
      );
    }

    if (p.tipo === "periodo") {
      return (
        <input
          name={p.key}
          type="month"
          value={val}
          onChange={(e) => set(p.key, e.target.value)}
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

    return (
      <textarea
        name={p.key}
        value={val}
        onChange={(e) => set(p.key, e.target.value)}
        rows={4}
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
              Se perderá el avance de este cargo. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  limpiarBorrador();
                  router.push("/cobros");
                }}
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

      <form action={formAction} onSubmit={limpiarBorrador} className="flex flex-col items-center gap-4 text-center">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Check size={15} /> {pending ? "Guardando…" : "Crear cargo"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** Deriva contrato_id/arrendatario_id vía contexto y los sincroniza al estado del wizard. */
function SelectorPropiedadContratoWizard({
  valores,
  set,
  propiedades,
  contexto,
}: {
  valores: Valores;
  set: (key: string, value: string) => void;
  propiedades: { id: string; label: string }[];
  contexto: ContextoPropiedad;
}) {
  const contratos = contexto[valores.propiedad_id] ?? [];

  function onProp(id: string) {
    set("propiedad_id", id);
    const cs = contexto[id] ?? [];
    const contratoId = cs.length === 1 ? cs[0].contratoId : "";
    set("contrato_id", contratoId);
    set("arrendatario_id", cs.find((c) => c.contratoId === contratoId)?.arrendatarioId ?? "");
  }

  function onContrato(id: string) {
    set("contrato_id", id);
    set("arrendatario_id", contratos.find((c) => c.contratoId === id)?.arrendatarioId ?? "");
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Propiedad</label>
        <ComboboxOpcion
          name="propiedad_id_buscador"
          options={propiedades}
          value={valores.propiedad_id}
          onChange={onProp}
          placeholder="Selecciona o escribe…"
        />
      </div>

      {contratos.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Contrato</label>
          {/* El valor real viaja en el hidden `contrato_id` del paso de
              propiedad, por eso este buscador usa un name aparte. */}
          <ComboboxOpcion
            name="contrato_id_buscador"
            options={contratos.map((c) => ({
              id: c.contratoId,
              label: `${c.contratoLabel}${c.arrendatario ? ` · ${c.arrendatario}` : ""}`,
            }))}
            value={valores.contrato_id}
            onChange={onContrato}
            placeholder="Selecciona…"
          />
        </div>
      )}

      {valores.propiedad_id && contratos.length === 0 && (
        <p className="rounded-lg bg-amber-400/20 px-3 py-2 text-sm text-amber-200">
          La propiedad no tiene un contrato vigente; no se puede generar el cobro hasta que exista uno.
        </p>
      )}
    </>
  );
}
