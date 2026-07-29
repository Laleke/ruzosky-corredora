"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ui } from "@/components/ui";

type Opcion = { id: string; label: string };
type Paso = { key: "propietario" | "periodo"; pregunta: string };

const PASOS: Paso[] = [
  { key: "propietario", pregunta: "¿Para qué propietario es la liquidación?" },
  { key: "periodo", pregunta: "¿De qué período?" },
];

/** Wizard liviano (sin borrador ni acción de servidor): solo arma la URL con
 * propietario+período y navega — la vista previa/confirmación real vive en
 * NuevaLiquidacionPage, sin cambios. */
export function SeleccionLiquidacionWizard({ propietarios }: { propietarios: Opcion[] }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [propietario, setPropietario] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [errorPaso, setErrorPaso] = useState<string | null>(null);

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;
  const valorActual = actual.key === "propietario" ? propietario : periodo;

  function siguiente() {
    if (valorActual.trim() === "") {
      setErrorPaso("Este dato es obligatorio para continuar.");
      return;
    }
    if (esUltimo) {
      router.push(`/liquidaciones/nueva?propietario=${propietario}&periodo=${periodo}`);
      return;
    }
    setErrorPaso(null);
    setPaso((p) => p + 1);
  }

  function atras() {
    setErrorPaso(null);
    setPaso((p) => Math.max(p - 1, 0));
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

      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {actual.pregunta}
          <span className="ml-1 text-amber-300">*</span>
        </h1>

        <div className="w-full max-w-sm" key={paso}>
          {actual.key === "propietario" ? (
            <select
              value={propietario}
              onChange={(e) => {
                setPropietario(e.target.value);
                setErrorPaso(null);
              }}
              className={`${ui.input} text-base`}
              autoFocus
            >
              <option value="">Selecciona…</option>
              {propietarios.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="month"
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.target.value);
                setErrorPaso(null);
              }}
              className={`${ui.input} text-base`}
              autoFocus
            />
          )}
        </div>

        {errorPaso && <p className="text-sm text-amber-200">{errorPaso}</p>}

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
          <button
            type="button"
            onClick={siguiente}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
          >
            {esUltimo ? "Ver vista previa" : "Siguiente"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
