"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import type { ContratoFormState } from "./actions";
import type { Contrato } from "./types";

type Action = (
  prev: ContratoFormState,
  formData: FormData
) => Promise<ContratoFormState>;

const inputCls = ui.input;

function Campo({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        step={type === "number" ? "any" : undefined}
        className={inputCls}
      />
    </label>
  );
}

export function ContratoForm({
  action,
  contrato,
  propiedades,
}: {
  action: Action;
  contrato?: Contrato;
  propiedades: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Número de contrato"
          name="numero_contrato"
          defaultValue={contrato?.numero_contrato}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Propiedad <span className="text-red-600">*</span>
          </span>
          <select
            name="propiedad_id"
            defaultValue={contrato?.propiedad_id ?? ""}
            required
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <Campo
          label="Fecha de firma"
          name="fecha_firma"
          type="date"
          defaultValue={contrato?.fecha_firma}
        />
        <Campo
          label="Fecha de inicio"
          name="fecha_inicio"
          type="date"
          defaultValue={contrato?.fecha_inicio}
          required
        />
        <Campo
          label="Fecha de término"
          name="fecha_termino"
          type="date"
          defaultValue={contrato?.fecha_termino}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select
            name="estado"
            defaultValue={contrato?.estado ?? "borrador"}
            className={inputCls}
          >
            <option value="borrador">Borrador</option>
            <option value="vigente">Vigente</option>
            <option value="vencido">Vencido</option>
            <option value="terminado">Terminado</option>
            <option value="renovado">Renovado</option>
          </select>
        </label>
      </section>

      <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-line p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-ink">Canon y reajuste</legend>
        <Campo
          label="Canon"
          name="canon_monto"
          type="number"
          defaultValue={contrato?.canon_monto}
          required
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Moneda</span>
          <select
            name="canon_moneda"
            defaultValue={contrato?.canon_moneda ?? "CLP"}
            className={inputCls}
          >
            <option value="CLP">CLP</option>
            <option value="UF">UF</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Reajuste</span>
          <select
            name="reajuste_tipo"
            defaultValue={contrato?.reajuste_tipo ?? "sin_reajuste"}
            className={inputCls}
          >
            <option value="sin_reajuste">Sin reajuste</option>
            <option value="IPC">IPC</option>
            <option value="UF">UF</option>
          </select>
        </label>
        <Campo
          label="Periodicidad reajuste (meses)"
          name="periodicidad_reajuste_meses"
          type="number"
          defaultValue={contrato?.periodicidad_reajuste_meses}
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-line p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-ink">
          Comisión y administración
        </legend>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de comisión</span>
          <select
            name="tipo_comision"
            defaultValue={contrato?.tipo_comision ?? ""}
            className={inputCls}
          >
            <option value="">—</option>
            <option value="porcentaje">Porcentaje</option>
            <option value="monto_fijo">Monto fijo</option>
          </select>
        </label>
        <Campo
          label="Valor comisión (% o $)"
          name="comision_monto"
          type="number"
          defaultValue={contrato?.comision_monto}
        />
        <div />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="cobra_administracion"
            defaultChecked={contrato?.cobra_administracion ?? false}
          />
          <span className="font-medium">Cobra administración mensual</span>
        </label>
        <Campo
          label="Administración monto"
          name="administracion_monto"
          type="number"
          defaultValue={contrato?.administracion_monto}
        />
        <Campo
          label="Administración %"
          name="administracion_porcentaje"
          type="number"
          defaultValue={contrato?.administracion_porcentaje}
        />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observaciones</span>
        <textarea
          name="observaciones"
          defaultValue={contrato?.observaciones ?? ""}
          rows={3}
          className={inputCls}
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <Link href="/contratos" className={ui.btnSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
