"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import type { PropietarioFormState } from "./actions";

type Action = (
  prev: PropietarioFormState,
  formData: FormData
) => Promise<PropietarioFormState>;

type TipoPaso = "select" | "texto" | "region" | "comuna";

type Paso = {
  key: string;
  pregunta: string;
  tipo: TipoPaso;
  requerido?: boolean | ((v: Valores) => boolean);
  opciones?: { value: string; label: string }[];
  omitirSi?: (v: Valores) => boolean;
};

type Valores = Record<string, string>;

const VALORES_INICIALES: Valores = {
  tipo_persona: "persona_natural",
  rut: "",
  nombre: "",
  apellido: "",
  razon_social: "",
  email: "",
  telefono: "",
  region: "",
  comuna: "",
  direccion: "",
  numero: "",
  banco: "",
  tipo_cuenta: "",
  numero_cuenta: "",
  titular_cuenta: "",
  rut_titular: "",
};

const TIPO_CUENTA_OPCIONES = [
  { value: "", label: "No indicar por ahora" },
  { value: "corriente", label: "Cuenta corriente" },
  { value: "vista", label: "Cuenta vista" },
  { value: "ahorro", label: "Cuenta de ahorro" },
  { value: "rut", label: "Cuenta RUT" },
];

const PASOS: Paso[] = [
  {
    key: "tipo_persona",
    pregunta: "¿Es persona natural o jurídica?",
    tipo: "select",
    opciones: [
      { value: "persona_natural", label: "Persona natural" },
      { value: "persona_juridica", label: "Persona jurídica" },
    ],
  },
  { key: "rut", pregunta: "¿Cuál es el RUT?", tipo: "texto", requerido: true },
  {
    key: "nombre",
    pregunta: "¿Cuáles son los nombres?",
    tipo: "texto",
    requerido: (v) => v.tipo_persona === "persona_natural",
    omitirSi: (v) => v.tipo_persona === "persona_juridica",
  },
  {
    key: "apellido",
    pregunta: "¿Cuáles son los apellidos?",
    tipo: "texto",
    requerido: (v) => v.tipo_persona === "persona_natural",
    omitirSi: (v) => v.tipo_persona === "persona_juridica",
  },
  {
    key: "razon_social",
    pregunta: "¿Cuál es la razón social?",
    tipo: "texto",
    requerido: (v) => v.tipo_persona === "persona_juridica",
    omitirSi: (v) => v.tipo_persona === "persona_natural",
  },
  { key: "email", pregunta: "¿Cuál es el email?", tipo: "texto" },
  { key: "telefono", pregunta: "¿Cuál es el teléfono?", tipo: "texto" },
  { key: "region", pregunta: "¿En qué región vive?", tipo: "region" },
  { key: "comuna", pregunta: "¿En qué comuna vive?", tipo: "comuna" },
  { key: "direccion", pregunta: "¿Cuál es la calle?", tipo: "texto" },
  { key: "numero", pregunta: "¿Número de la calle?", tipo: "texto" },
  { key: "banco", pregunta: "¿En qué banco tiene su cuenta?", tipo: "texto" },
  {
    key: "tipo_cuenta",
    pregunta: "¿Qué tipo de cuenta es?",
    tipo: "select",
    opciones: TIPO_CUENTA_OPCIONES,
  },
  { key: "numero_cuenta", pregunta: "¿Cuál es el número de cuenta?", tipo: "texto" },
  { key: "titular_cuenta", pregunta: "¿A nombre de quién está la cuenta?", tipo: "texto" },
  { key: "rut_titular", pregunta: "¿Cuál es el RUT del titular de la cuenta?", tipo: "texto" },
];

const DRAFT_KEY = "rzk:draft:propietario-wizard";

export function PropietarioWizard({ action }: { action: Action }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const comunas = useMemo(() => comunasDeRegion(valores.region ?? ""), [valores.region]);

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

  function esRequerido(p: Paso): boolean {
    return typeof p.requerido === "function" ? p.requerido(valores) : Boolean(p.requerido);
  }

  function puedeAvanzar(): boolean {
    if (!esRequerido(actual)) return true;
    return valores[actual.key].trim() !== "";
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
    if (!visible) {
      if (p.omitirSi?.(valores)) return null;
      return <input type="hidden" name={p.key} value={val} />;
    }

    if (p.tipo === "select") {
      return (
        <select
          value={val}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        >
          {p.opciones!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (p.tipo === "region") {
      return (
        <Combobox
          name="region"
          options={NOMBRES_REGIONES}
          value={val}
          onChange={(v) => {
            set("region", v);
            set("comuna", "");
          }}
          placeholder="Selecciona o escribe…"
        />
      );
    }
    if (p.tipo === "comuna") {
      return (
        <Combobox
          name="comuna"
          options={comunas}
          value={val}
          onChange={(v) => set("comuna", v)}
          placeholder={valores.region ? "Selecciona o escribe…" : "Elige una región primero"}
          disabled={!valores.region}
        />
      );
    }
    return (
      <input
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
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4">
          <p className="text-sm text-white">Se perderá el avance de este propietario. ¿Cancelar de todas formas?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                limpiarBorrador();
                router.push("/propietarios");
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
              <Check size={15} /> {pending ? "Guardando…" : "Guardar propietario"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
