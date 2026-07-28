"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import { formatearRut } from "@/lib/rut";
import { formatearTelefono, esEmailValido } from "@/lib/contacto";
import type { ArrendatarioFormState } from "./actions";

type Action = (
  prev: ArrendatarioFormState,
  formData: FormData
) => Promise<ArrendatarioFormState>;

type TipoPaso = "select" | "texto" | "region" | "comuna" | "rut" | "telefono" | "email";

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
};

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
  { key: "rut", pregunta: "¿Cuál es el RUT?", tipo: "rut", requerido: true },
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
  { key: "email", pregunta: "¿Cuál es el email?", tipo: "email" },
  { key: "telefono", pregunta: "¿Cuál es el teléfono?", tipo: "telefono" },
  { key: "region", pregunta: "¿En qué región vive?", tipo: "region" },
  { key: "comuna", pregunta: "¿En qué comuna vive?", tipo: "comuna" },
  { key: "direccion", pregunta: "¿Cuál es la calle?", tipo: "texto" },
  { key: "numero", pregunta: "¿Número de la calle?", tipo: "texto" },
];

const DRAFT_KEY = "rzk:draft:arrendatario-wizard";

export function ArrendatarioWizard({ action }: { action: Action }) {
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
    if (actual.tipo === "email" && !esEmailValido(valores.email)) return false;
    if (!esRequerido(actual)) return true;
    return valores[actual.key].trim() !== "";
  }

  function avanzarDesde(desde: number): number {
    let next = desde + 1;
    while (next < PASOS.length && PASOS[next].omitirSi?.(valores)) next++;
    return Math.min(next, PASOS.length - 1);
  }

  function siguiente() {
    if (actual.tipo === "email" && !esEmailValido(valores.email)) {
      setErrorPaso("El formato del correo no es válido.");
      return;
    }
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
        onChange={(e) => {
          const raw = e.target.value;
          const formateado =
            p.tipo === "rut" ? formatearRut(raw) : p.tipo === "telefono" ? formatearTelefono(raw) : raw;
          set(p.key, formateado);
        }}
        type={p.tipo === "email" ? "email" : p.tipo === "telefono" ? "tel" : "text"}
        inputMode={p.tipo === "telefono" ? "tel" : undefined}
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
              Se perderá el avance de este arrendatario. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  limpiarBorrador();
                  router.push("/arrendatarios");
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
