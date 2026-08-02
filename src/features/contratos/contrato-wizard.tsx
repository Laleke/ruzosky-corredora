"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { SelectStyled } from "@/components/select-styled";
import type { ContratoFormState } from "./actions";

type Action = (
  prev: ContratoFormState,
  formData: FormData
) => Promise<ContratoFormState>;

type TipoPaso = "propiedad" | "select" | "fecha" | "numero" | "entero" | "checkbox" | "textarea";

type Paso = {
  key: string;
  pregunta: string;
  ayuda?: string;
  tipo: TipoPaso;
  requerido?: boolean | ((v: Valores) => boolean);
  opciones?: { value: string; label: string }[];
  omitirSi?: (v: Valores) => boolean;
};

type Valores = Record<string, string | boolean>;

const ESTADO_OPCIONES = [
  { value: "borrador", label: "Borrador" },
  { value: "vigente", label: "Vigente" },
  { value: "vencido", label: "Vencido" },
  { value: "terminado", label: "Terminado" },
  { value: "renovado", label: "Renovado" },
];
const MONEDA_OPCIONES = [
  { value: "CLP", label: "CLP (pesos chilenos)" },
  { value: "UF", label: "UF" },
];
const REAJUSTE_OPCIONES = [
  { value: "sin_reajuste", label: "Sin reajuste" },
  { value: "IPC", label: "IPC" },
  { value: "UF", label: "UF" },
];
const TIPO_COMISION_OPCIONES = [
  { value: "", label: "No cobra comisión" },
  { value: "porcentaje", label: "Porcentaje" },
  { value: "monto_fijo", label: "Monto fijo" },
];

const VALORES_INICIALES: Valores = {
  propiedad_id: "",
  estado: "borrador",
  fecha_firma: "",
  fecha_inicio: "",
  fecha_termino: "",
  canon_monto: "",
  canon_moneda: "CLP",
  reajuste_tipo: "sin_reajuste",
  periodicidad_reajuste_meses: "",
  tipo_comision: "",
  comision_monto: "",
  cobra_administracion: false,
  administracion_monto: "",
  administracion_porcentaje: "",
  observaciones: "",
};

const DRAFT_KEY = "rzk:draft:contrato-wizard";

export function ContratoWizard({
  action,
  propiedades,
}: {
  action: Action;
  propiedades: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const PASOS: Paso[] = [
    { key: "propiedad_id", pregunta: "¿A qué propiedad corresponde el contrato?", tipo: "propiedad", requerido: true },
    { key: "fecha_inicio", pregunta: "¿Cuál es la fecha de inicio?", tipo: "fecha", requerido: true },
    { key: "fecha_firma", pregunta: "¿Cuál es la fecha de firma?", tipo: "fecha" },
    { key: "fecha_termino", pregunta: "¿Cuál es la fecha de término?", tipo: "fecha" },
    { key: "estado", pregunta: "¿Cuál es el estado del contrato?", tipo: "select", opciones: ESTADO_OPCIONES },
    { key: "canon_monto", pregunta: "¿Cuál es el monto del canon de arriendo?", tipo: "numero", requerido: true },
    { key: "canon_moneda", pregunta: "¿En qué moneda se expresa el canon?", tipo: "select", opciones: MONEDA_OPCIONES },
    { key: "reajuste_tipo", pregunta: "¿Tiene reajuste periódico?", tipo: "select", opciones: REAJUSTE_OPCIONES },
    {
      key: "periodicidad_reajuste_meses",
      pregunta: "¿Cada cuántos meses se reajusta?",
      tipo: "entero",
      requerido: (v) => v.reajuste_tipo !== "sin_reajuste",
      omitirSi: (v) => v.reajuste_tipo === "sin_reajuste",
    },
    { key: "tipo_comision", pregunta: "¿Cobra comisión la corredora?", tipo: "select", opciones: TIPO_COMISION_OPCIONES },
    {
      key: "comision_monto",
      pregunta: "¿Cuál es el valor de la comisión (% o $)?",
      tipo: "numero",
      requerido: (v) => v.tipo_comision !== "",
      omitirSi: (v) => v.tipo_comision === "",
    },
    { key: "cobra_administracion", pregunta: "¿Cobra administración mensual?", tipo: "checkbox" },
    {
      key: "administracion_monto",
      pregunta: "¿Monto fijo de administración (si aplica)?",
      tipo: "numero",
      omitirSi: (v) => !v.cobra_administracion,
    },
    {
      key: "administracion_porcentaje",
      pregunta: "¿Porcentaje de administración (si aplica)?",
      tipo: "numero",
      omitirSi: (v) => !v.cobra_administracion,
    },
    { key: "observaciones", pregunta: "¿Alguna observación adicional?", tipo: "textarea" },
  ];

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

  function set(key: string, value: string | boolean) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

  function esRequerido(p: Paso): boolean {
    return typeof p.requerido === "function" ? p.requerido(valores) : Boolean(p.requerido);
  }

  function puedeAvanzar(): boolean {
    if (!esRequerido(actual)) return true;
    const v = valores[actual.key];
    return typeof v === "string" ? v.trim() !== "" : true;
  }

  function avanzarDesde(desde: number): number {
    let next = desde + 1;
    while (next < PASOS.length && PASOS[next].omitirSi?.(valores)) next++;
    return Math.min(next, PASOS.length - 1);
  }

  function siguiente() {
    if (!puedeAvanzar()) {
      setErrorPaso("Este dato es obligatorio para continuar.");
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
    const val = valores[p.key];

    if (p.tipo === "checkbox") {
      if (!visible) return Boolean(val) && <input type="hidden" name={p.key} value="on" />;
      return (
        <label className="flex items-center justify-center gap-2 text-white">
          <input
            name={p.key}
            type="checkbox"
            value="on"
            checked={Boolean(val)}
            onChange={(e) => set(p.key, e.target.checked)}
            className="h-5 w-5"
          />
          Sí, cobra administración
        </label>
      );
    }

    if (!visible) {
      if (p.omitirSi?.(valores)) return null;
      return <input type="hidden" name={p.key} value={String(val)} />;
    }

    if (p.tipo === "propiedad") {
      return (
        <SelectStyled
          name={p.key}
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className="text-base"
          autoFocus
        >
          <option value="">Selecciona…</option>
          {propiedades.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </SelectStyled>
      );
    }

    if (p.tipo === "select") {
      return (
        <SelectStyled
          name={p.key}
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className="text-base"
          autoFocus
        >
          {p.opciones!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectStyled>
      );
    }

    if (p.tipo === "fecha") {
      return (
        <input
          name={p.key}
          type="date"
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }

    if (p.tipo === "numero" || p.tipo === "entero") {
      return (
        <input
          name={p.key}
          type="text"
          inputMode={p.tipo === "entero" ? "numeric" : "decimal"}
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }

    return (
      <textarea
        name={p.key}
        value={String(val)}
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
              Se perderá el avance de este contrato. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  limpiarBorrador();
                  router.push("/contratos");
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

      <form
        action={formAction}
        onSubmit={limpiarBorrador}
        className="flex flex-col items-center gap-4 text-center"
      >
        {PASOS.map((p, i) => (
          <div key={p.key} className={i === paso ? "contents" : "hidden"}>
            {i !== paso && renderInput(p, false)}
          </div>
        ))}

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {actual.pregunta}
            {esRequerido(actual) && <span className="ml-1 text-amber-300">*</span>}
          </h1>
          {actual.ayuda && <p className="text-sm text-white/60">{actual.ayuda}</p>}
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
              <Check size={15} /> {pending ? "Guardando…" : "Guardar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
