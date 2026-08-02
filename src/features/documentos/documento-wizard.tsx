"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, UploadCloud } from "lucide-react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { SelectStyled } from "@/components/select-styled";
import { CATEGORIAS, MAX_TAMANO_BYTES, formatearTamano } from "./constants";
import { subirArchivo, limpiarArchivo } from "./storage-client";
import { registrarDocumento } from "./actions";
import type { OpcionesRelacion } from "./types";
import type { ContextoPropiedad } from "./queries";

type TipoPaso = "archivo" | "texto" | "select" | "fecha" | "propiedad" | "textarea";

type Paso = { key: string; pregunta: string; tipo: TipoPaso; requerido?: boolean };

const PASOS: Paso[] = [
  { key: "archivo", pregunta: "¿Qué archivo quieres subir?", tipo: "archivo", requerido: true },
  { key: "nombre", pregunta: "¿Qué nombre le pones al documento?", tipo: "texto", requerido: true },
  { key: "categoria", pregunta: "¿Qué categoría es?", tipo: "select" },
  { key: "fecha_documento", pregunta: "¿Qué fecha tiene el documento?", tipo: "fecha" },
  { key: "propiedad_id", pregunta: "¿A qué propiedad corresponde?", tipo: "propiedad" },
  { key: "observaciones", pregunta: "¿Alguna observación adicional?", tipo: "textarea" },
];

type Valores = {
  nombre: string;
  categoria: string;
  fecha_documento: string;
  propiedad_id: string;
  contrato_id: string;
  arrendatario_id: string;
  observaciones: string;
};

const VALORES_INICIALES: Valores = {
  nombre: "",
  categoria: "contrato",
  fecha_documento: "",
  propiedad_id: "",
  contrato_id: "",
  arrendatario_id: "",
  observaciones: "",
};

export function DocumentoWizard({
  opciones,
  empresaId,
  contexto,
}: {
  opciones: OpcionesRelacion;
  empresaId: string;
  contexto: ContextoPropiedad;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errorPaso, setErrorPaso] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorFinal, setErrorFinal] = useState<string | null>(null);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  function set(key: keyof Valores, value: string) {
    setValores((v) => ({ ...v, [key]: value }));
    setErrorPaso(null);
  }

  function puedeAvanzar(): boolean {
    if (actual.key === "archivo") return archivo !== null;
    if (!actual.requerido) return true;
    return valores[actual.key as keyof Valores].trim() !== "";
  }

  function siguiente() {
    if (!puedeAvanzar()) {
      setErrorPaso(
        actual.key === "archivo" ? "Selecciona un archivo." : "Este dato es obligatorio para continuar."
      );
      return;
    }
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function atras() {
    setErrorPaso(null);
    setPaso((p) => Math.max(p - 1, 0));
  }

  async function onGuardar() {
    if (!archivo) return;
    if (archivo.size > MAX_TAMANO_BYTES) {
      setErrorFinal("El archivo supera el tamaño máximo (25 MB).");
      return;
    }

    setPending(true);
    setErrorFinal(null);

    const { archivo: subido, error: errUp } = await subirArchivo(archivo, empresaId);
    if (!subido) {
      setPending(false);
      setErrorFinal(errUp ?? "No se pudo subir el archivo.");
      return;
    }

    const res = await registrarDocumento({
      nombre: valores.nombre,
      categoria: valores.categoria,
      arrendatario_id: valores.arrendatario_id || null,
      propiedad_id: valores.propiedad_id || null,
      contrato_id: valores.contrato_id || null,
      observaciones: valores.observaciones || null,
      fecha_documento: valores.fecha_documento || null,
      archivo: subido,
    });

    if (res.error || !res.id) {
      await limpiarArchivo(subido.storage_path);
      setPending(false);
      setErrorFinal(res.error ?? "No se pudo registrar el documento.");
      return;
    }

    router.push(`/documentos/${res.id}`);
  }

  function renderInput() {
    if (actual.tipo === "archivo") {
      return (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/30 bg-white/5 px-4 py-8 text-center transition hover:bg-white/10">
          <UploadCloud size={26} className="text-white" />
          <span className="text-sm text-white">
            {archivo ? archivo.name : "Haz clic para seleccionar un archivo"}
          </span>
          <span className="text-xs text-white/60">
            {archivo ? formatearTamano(archivo.size) : "PDF, imágenes, Word, Excel… hasta 25 MB"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setArchivo(f);
              setErrorPaso(null);
              if (f && !valores.nombre) set("nombre", f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </label>
      );
    }

    if (actual.tipo === "texto") {
      return (
        <input
          value={valores.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej: Contrato de arriendo firmado"
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }

    if (actual.tipo === "select") {
      return (
        <SelectStyled
          value={valores.categoria}
          onChange={(e) => set("categoria", e.target.value)}
          className="text-base"
          autoFocus
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectStyled>
      );
    }

    if (actual.tipo === "fecha") {
      return (
        <input
          type="date"
          value={valores.fecha_documento}
          onChange={(e) => set("fecha_documento", e.target.value)}
          className={`${ui.input} text-base`}
          autoFocus
        />
      );
    }

    if (actual.tipo === "propiedad") {
      const contratos = contexto[valores.propiedad_id] ?? [];
      return (
        <div className="flex flex-col gap-3 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white">Propiedad</label>
            <ComboboxOpcion
              name="propiedad_id_buscador"
              options={opciones.propiedades}
              value={valores.propiedad_id}
              onChange={(id) => {
                set("propiedad_id", id);
                const cs = contexto[id] ?? [];
                const contratoId = cs.length === 1 ? cs[0].contratoId : "";
                set("contrato_id", contratoId);
                set("arrendatario_id", cs.find((c) => c.contratoId === contratoId)?.arrendatarioId ?? "");
              }}
              placeholder="Sin propiedad asociada (opcional)"
            />
          </div>
          {contratos.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white">Contrato</label>
              <SelectStyled
                value={valores.contrato_id}
                onChange={(e) => {
                  const id = e.target.value;
                  set("contrato_id", id);
                  set("arrendatario_id", contratos.find((c) => c.contratoId === id)?.arrendatarioId ?? "");
                }}
              >
                <option value="">Selecciona…</option>
                {contratos.map((c) => (
                  <option key={c.contratoId} value={c.contratoId}>
                    {c.contratoLabel}
                    {c.arrendatario ? ` · ${c.arrendatario}` : ""}
                  </option>
                ))}
              </SelectStyled>
            </div>
          )}
        </div>
      );
    }

    return (
      <textarea
        value={valores.observaciones}
        onChange={(e) => set("observaciones", e.target.value)}
        rows={4}
        placeholder="Notas internas (opcional)"
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
              Se perderá el avance de esta subida. ¿Cancelar de todas formas?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/documentos")}
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

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {actual.pregunta}
            {actual.requerido && <span className="ml-1 text-amber-300">*</span>}
          </h1>
        </div>

        <div className="w-full max-w-sm" key={paso}>
          {renderInput()}
        </div>

        {errorPaso && <p className="text-sm text-amber-200">{errorPaso}</p>}
        {esUltimo && errorFinal && <p className="text-sm text-amber-200">{errorFinal}</p>}

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
              type="button"
              onClick={onGuardar}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <Check size={15} /> {pending ? "Subiendo…" : "Guardar documento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
