"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import type { PropiedadFormState } from "./actions";

type Action = (
  prev: PropiedadFormState,
  formData: FormData
) => Promise<PropiedadFormState>;

type TipoPaso =
  | "select"
  | "texto"
  | "numero"
  | "fecha"
  | "textarea"
  | "checkbox"
  | "region"
  | "comuna"
  | "estacionamiento"
  | "bodega";

type Paso = {
  key: string;
  pregunta: string;
  ayuda?: string;
  tipo: TipoPaso;
  requerido?: boolean;
  opciones?: { value: string; label: string }[];
};

const TIPO_OPCIONES = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "oficina", label: "Oficina" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "bodega", label: "Bodega" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];
const ESTADO_OPCIONES = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "arrendada", label: "Arrendada" },
  { value: "mantencion", label: "Mantención" },
  { value: "inactiva", label: "Inactiva" },
];
const MONEDA_OPCIONES = [
  { value: "CLP", label: "CLP (pesos chilenos)" },
  { value: "UF", label: "UF" },
];

/**
 * Orden estratégico: primero lo que define la propiedad (tipo, ubicación),
 * luego dirección exacta, características físicas, y por último estado y
 * valorización — que es lo que más cambia en el tiempo.
 */
const PASOS: Paso[] = [
  { key: "tipo", pregunta: "¿Qué tipo de propiedad es?", tipo: "select", opciones: TIPO_OPCIONES },
  { key: "region", pregunta: "¿En qué región está ubicada?", tipo: "region", requerido: true },
  { key: "comuna", pregunta: "¿En qué comuna está ubicada?", tipo: "comuna", requerido: true },
  { key: "direccion", pregunta: "¿Cuál es la calle?", tipo: "texto" },
  { key: "numero", pregunta: "¿Número de la calle?", tipo: "numero" },
  { key: "departamento", pregunta: "¿Número de departamento o casa?", tipo: "numero" },
  {
    key: "rol_sii",
    pregunta: "¿Cuál es el Rol SII?",
    ayuda: "Formato #####-#####. Si no lo tienes a mano, puedes omitir esta pregunta.",
    tipo: "texto",
  },
  { key: "dormitorios", pregunta: "¿Cuántos dormitorios tiene?", tipo: "numero" },
  { key: "banos", pregunta: "¿Cuántos baños tiene?", tipo: "numero" },
  { key: "estacionamiento", pregunta: "¿Tiene estacionamiento?", tipo: "estacionamiento" },
  { key: "bodega", pregunta: "¿Tiene bodega?", tipo: "bodega" },
  { key: "superficie_util_m2", pregunta: "¿Superficie útil, en m²?", tipo: "numero" },
  { key: "superficie_total_m2", pregunta: "¿Superficie total, en m²?", tipo: "numero" },
  { key: "estado", pregunta: "¿Cuál es el estado actual de la propiedad?", tipo: "select", opciones: ESTADO_OPCIONES },
  { key: "moneda", pregunta: "¿En qué moneda se expresa el valor de arriendo?", tipo: "select", opciones: MONEDA_OPCIONES },
  { key: "valor_referencial_arriendo", pregunta: "¿Cuál es el valor referencial de arriendo?", tipo: "numero" },
  { key: "gasto_comun_estimado", pregunta: "¿Cuál es el gasto común estimado?", tipo: "numero" },
  { key: "fecha_adquisicion", pregunta: "¿Cuándo adquiriste la propiedad?", tipo: "fecha" },
  { key: "publicada", pregunta: "¿Está publicada en portales externos (Portalinmobiliario, Yapo, etc.)?", tipo: "checkbox" },
  { key: "observaciones", pregunta: "¿Alguna observación adicional?", tipo: "textarea" },
];

type Valores = Record<string, string | boolean>;

const VALORES_INICIALES: Valores = {
  tipo: "departamento",
  region: "",
  comuna: "",
  direccion: "",
  numero: "",
  departamento: "",
  rol_sii: "",
  dormitorios: "",
  banos: "",
  tieneEst: false,
  estacionamientos: "",
  tieneBod: false,
  bodegas: "",
  superficie_util_m2: "",
  superficie_total_m2: "",
  estado: "disponible",
  moneda: "CLP",
  valor_referencial_arriendo: "",
  gasto_comun_estimado: "",
  fecha_adquisicion: "",
  publicada: false,
  observaciones: "",
};

/** Máscara de Rol SII: dígitos en formato #####-##### (manzana-predio). */
function formatRol(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

const DRAFT_KEY = "rzk:draft:propiedad-wizard";

export function PropiedadWizard({ action }: { action: Action }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const comunas = useMemo(() => comunasDeRegion(String(valores.region ?? "")), [valores.region]);

  // Restaura el avance guardado (si el usuario salió de la app a medio llenar).
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

  // Guarda el avance en cada cambio.
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

  /** El paso "departamento" no aplica a Casa: el número de calle ya la identifica. */
  function esPasoOmisibleAutomatico(p: Paso): boolean {
    return p.key === "departamento" && valores.tipo === "casa";
  }

  function set(key: string, value: string | boolean) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

  function puedeAvanzar(): boolean {
    if (!actual.requerido) return true;
    const v = valores[actual.key];
    return typeof v === "string" ? v.trim() !== "" : true;
  }

  function avanzarDesde(desde: number): number {
    let next = desde + 1;
    while (next < PASOS.length && esPasoOmisibleAutomatico(PASOS[next])) next++;
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
      while (prev >= 0 && esPasoOmisibleAutomatico(PASOS[prev])) prev--;
      return Math.max(prev, 0);
    });
  }

  function renderInput(p: Paso, visible: boolean) {
    const val = valores[p.key];

    switch (p.tipo) {
      case "select":
        return visible ? (
          <select
            value={String(val)}
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
        ) : (
          <input type="hidden" name={p.key} value={String(val)} />
        );

      case "region":
        return visible ? (
          <Combobox
            name="region"
            options={NOMBRES_REGIONES}
            value={String(val)}
            onChange={(v) => {
              set("region", v);
              set("comuna", "");
            }}
            placeholder="Selecciona o escribe…"
          />
        ) : (
          <input type="hidden" name="region" value={String(val)} />
        );

      case "comuna":
        return visible ? (
          <Combobox
            name="comuna"
            options={comunas}
            value={String(val)}
            onChange={(v) => set("comuna", v)}
            placeholder={valores.region ? "Selecciona o escribe…" : "Elige una región primero"}
            disabled={!valores.region}
          />
        ) : (
          <input type="hidden" name="comuna" value={String(val)} />
        );

      case "texto":
        if (!visible) return <input type="hidden" name={p.key} value={String(val)} />;
        if (p.key === "rol_sii") {
          return (
            <input
              value={String(val)}
              onChange={(e) => set(p.key, formatRol(e.target.value))}
              inputMode="numeric"
              placeholder="#####-#####"
              className={`${ui.input} text-base`}
              autoFocus
            />
          );
        }
        return (
          <input
            value={String(val)}
            onChange={(e) => set(p.key, e.target.value)}
            className={`${ui.input} text-base`}
            autoFocus
          />
        );

      case "numero": {
        const esEntero = p.key === "numero" || p.key === "departamento";
        return visible ? (
          <input
            type="number"
            inputMode={esEntero ? "numeric" : "decimal"}
            step={esEntero ? "1" : "any"}
            value={String(val)}
            onChange={(e) => set(p.key, e.target.value)}
            className={`${ui.input} text-base`}
            autoFocus
          />
        ) : (
          <input type="hidden" name={p.key} value={String(val)} />
        );
      }

      case "fecha":
        return visible ? (
          <input
            type="date"
            value={String(val)}
            onChange={(e) => set(p.key, e.target.value)}
            className={`${ui.input} text-base`}
            autoFocus
          />
        ) : (
          <input type="hidden" name={p.key} value={String(val)} />
        );

      case "textarea":
        return visible ? (
          <textarea
            value={String(val)}
            onChange={(e) => set(p.key, e.target.value)}
            rows={4}
            className={`${ui.input} text-base`}
            autoFocus
          />
        ) : (
          <input type="hidden" name={p.key} value={String(val)} />
        );

      case "checkbox":
        return visible ? (
          <label className="flex items-center justify-center gap-2 text-white">
            <input
              type="checkbox"
              checked={Boolean(val)}
              onChange={(e) => set(p.key, e.target.checked)}
              className="h-5 w-5"
            />
            Sí, está publicada
          </label>
        ) : (
          Boolean(val) && <input type="hidden" name={p.key} value="on" />
        );

      case "estacionamiento": {
        const tiene = Boolean(valores.tieneEst);
        if (!visible) {
          return tiene && <input type="hidden" name="estacionamientos" value={String(valores.estacionamientos || 1)} />;
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={tiene}
                onChange={(e) => set("tieneEst", e.target.checked)}
                className="h-5 w-5"
              />
              Sí, tiene estacionamiento
            </label>
            {tiene && (
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="N° de estacionamiento"
                value={String(valores.estacionamientos)}
                onChange={(e) => set("estacionamientos", e.target.value)}
                className={`${ui.input} max-w-xs text-base`}
              />
            )}
          </div>
        );
      }

      case "bodega": {
        const tiene = Boolean(valores.tieneBod);
        if (!visible) {
          return tiene && <input type="hidden" name="bodegas" value={String(valores.bodegas || 1)} />;
        }
        return (
          <div className="flex flex-col items-center gap-3">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={tiene}
                onChange={(e) => set("tieneBod", e.target.checked)}
                className="h-5 w-5"
              />
              Sí, tiene bodega
            </label>
            {tiene && (
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="N° de bodega"
                value={String(valores.bodegas)}
                onChange={(e) => set("bodegas", e.target.value)}
                className={`${ui.input} max-w-xs text-base`}
              />
            )}
          </div>
        );
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl bg-burgundy p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/propiedades")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          <ArrowLeft size={15} /> Cancelar
        </button>
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

      <form
        action={formAction}
        onSubmit={limpiarBorrador}
        className="flex flex-col items-center gap-4 text-center"
      >
        {/* Campos ocultos con todo lo ya respondido (y lo no visitado, con su valor inicial). */}
        {PASOS.map((p, i) => (
          <div key={p.key} className={i === paso ? "contents" : "hidden"}>
            {i !== paso && !esPasoOmisibleAutomatico(p) && renderInput(p, false)}
          </div>
        ))}

        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {actual.key === "departamento"
              ? `¿Número de ${(TIPO_OPCIONES.find((o) => o.value === valores.tipo)?.label ?? "unidad").toLowerCase()}?`
              : actual.pregunta}
            {actual.requerido && <span className="ml-1 text-amber-300">*</span>}
          </h1>
          {actual.ayuda && <p className="text-sm text-white/70">{actual.ayuda}</p>}
        </div>

        <div className="w-full max-w-sm" key={paso}>
          {renderInput(actual, true)}
        </div>

        {errorPaso && <p className="text-sm text-amber-200">{errorPaso}</p>}
        {esUltimo && state.error && <p className="text-sm text-amber-200">{state.error}</p>}

        <div className="flex flex-wrap items-center justify-center gap-3">
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
              <Check size={15} /> {pending ? "Guardando…" : "Guardar propiedad"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
