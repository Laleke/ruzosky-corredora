"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { ui } from "@/components/ui";
import { ComboboxOpcion } from "@/components/combobox-opcion";
import { TIPO_CARGO_LABEL, TIPOS_DESFAZADOS } from "@/features/cobros/constants";
import { crearRecordatorio } from "./actions";
import type { RecordatorioFormState } from "./types";

const initial: RecordatorioFormState = { error: null };

const TIPO_OPCIONES = TIPOS_DESFAZADOS.map((value) => ({
  id: value,
  label: TIPO_CARGO_LABEL[value] ?? value,
}));

export function RecordatorioForm() {
  const [state, formAction, pending] = useActionState(crearRecordatorio, initial);
  const [tipoCargo, setTipoCargo] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (pending) enviandoRef.current = true;
    if (!pending && enviandoRef.current && !state.error) {
      enviandoRef.current = false;
      formRef.current?.reset();
      setTipoCargo("");
    }
  }, [pending, state.error]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-[180px] flex-col gap-1 text-sm">
        <span className="font-medium text-white">Cargo a recordar</span>
        <ComboboxOpcion
          name="tipo_cargo"
          options={TIPO_OPCIONES}
          value={tipoCargo}
          onChange={setTipoCargo}
          placeholder="Selecciona…"
          required
        />
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-white">Avisar desde el día</span>
        <input
          name="dia_mes_aviso"
          type="number"
          min={1}
          max={28}
          defaultValue={20}
          required
          className={`${ui.input} w-24`}
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-white">Nombre (opcional)</span>
        <input name="nombre" placeholder="Ej: Cargar cuentas de luz" className={ui.input} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear recordatorio"}
      </button>
      {state.error && (
        <p className="w-full text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
