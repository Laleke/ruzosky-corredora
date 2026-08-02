"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { SelectStyled } from "@/components/select-styled";
import { CATEGORIAS_GASTO, ESTADOS_GASTO } from "./constants";
import { crearGasto, type GastoFormState } from "./actions";
import type { ContextoPropiedad } from "@/features/documentos/queries";

type TipoPaso = "propiedad" | "select" | "texto" | "monto" | "fecha" | "checkbox" | "textarea";

type Paso = {
  key: string;
  pregunta: string;
  tipo: TipoPaso;
  requerido?: boolean;
};

const PASOS: Paso[] = [
  { key: "propiedad_id", pregunta: "¿A qué propiedad corresponde el gasto?", tipo: "propiedad", requerido: true },
  { key: "categoria", pregunta: "¿Qué categoría de gasto es?", tipo: "select" },
  { key: "descripcion", pregunta: "¿Cuál es la descripción del gasto?", tipo: "texto", requerido: true },
  { key: "monto", pregunta: "¿Cuál es el monto?", tipo: "monto", requerido: true },
  { key: "fecha", pregunta: "¿Qué fecha tiene el gasto?", tipo: "fecha", requerido: true },
  { key: "estado", pregunta: "¿Cuál es el estado del gasto?", tipo: "select" },
  { key: "descontar_de_liquidacion", pregunta: "¿Se descuenta de la liquidación del propietario?", tipo: "checkbox" },
  { key: "observaciones", pregunta: "¿Alguna observación adicional?", tipo: "textarea" },
];

type Valores = Record<string, string | boolean>;

const VALORES_INICIALES: Valores = {
  propiedad_id: "",
  contrato_id: "",
  categoria: "mantencion",
  descripcion: "",
  monto: "",
  fecha: "",
  estado: "pendiente",
  descontar_de_liquidacion: false,
  observaciones: "",
};

const DRAFT_KEY = "rzk:draft:gasto-wizard";

function fmt(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("es-CL");
}

export function GastoWizard({
  propiedades,
  contexto,
}: {
  propiedades: { id: string; label: string }[];
  contexto: ContextoPropiedad;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearGasto, { error: null });
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

  function set(key: string, value: string | boolean) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

  function puedeAvanzar(): boolean {
    if (actual.key === "propiedad_id") return Boolean(valores.propiedad_id);
    if (!actual.requerido) return true;
    const v = valores[actual.key];
    return typeof v === "string" ? v.trim() !== "" : true;
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
          Sí, se descuenta de su liquidación
        </label>
      );
    }

    if (p.key === "propiedad_id") {
      if (!visible) {
        return (
          <>
            <input type="hidden" name="propiedad_id" value={String(valores.propiedad_id)} />
            <input type="hidden" name="contrato_id" value={String(valores.contrato_id)} />
          </>
        );
      }
      return (
        <SelectorPropiedadWizard valores={valores} set={set} propiedades={propiedades} contexto={contexto} />
      );
    }

    if (!visible) return <input type="hidden" name={p.key} value={String(val)} />;

    if (p.tipo === "select") {
      const opciones = p.key === "categoria" ? CATEGORIAS_GASTO : ESTADOS_GASTO.filter((e) => e.value !== "anulado");
      return (
        <SelectStyled
          name={p.key}
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className="text-base"
          autoFocus
        >
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectStyled>
      );
    }

    if (p.tipo === "monto") {
      return (
        <input
          name={p.key}
          inputMode="numeric"
          value={fmt(String(val))}
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
          value={String(val)}
          onChange={(e) => set(p.key, e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }

    if (p.tipo === "textarea") {
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
      <input
        name={p.key}
        value={String(val)}
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
              Se perderá el avance de este gasto. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  limpiarBorrador();
                  router.push("/gastos");
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
              <Check size={15} /> {pending ? "Guardando…" : "Registrar gasto"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SelectorPropiedadWizard({
  valores,
  set,
  propiedades,
  contexto,
}: {
  valores: Valores;
  set: (key: string, value: string | boolean) => void;
  propiedades: { id: string; label: string }[];
  contexto: ContextoPropiedad;
}) {
  const propiedadId = String(valores.propiedad_id);
  const contratos = contexto[propiedadId] ?? [];

  function onProp(id: string) {
    set("propiedad_id", id);
    const cs = contexto[id] ?? [];
    set("contrato_id", cs.length === 1 ? cs[0].contratoId : "");
  }

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Propiedad</label>
        <ComboboxOpcion
          name="propiedad_id_buscador"
          options={propiedades}
          value={propiedadId}
          onChange={onProp}
          placeholder="Selecciona o escribe…"
        />
      </div>

      {contratos.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Contrato</label>
          <SelectStyled
            value={String(valores.contrato_id)}
            onChange={(e) => set("contrato_id", e.target.value)}
          >
            <option value="">Selecciona…</option>
            {contratos.map((c) => (
              <option key={c.contratoId} value={c.contratoId}>
                {c.contratoLabel}
              </option>
            ))}
          </SelectStyled>
        </div>
      )}
    </div>
  );
}
