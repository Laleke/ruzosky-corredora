"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { BANCOS } from "@/data/chile";
import type { PropietarioFormState } from "./actions";
import type { Propietario } from "./types";

type Action = (
  prev: PropietarioFormState,
  formData: FormData
) => Promise<PropietarioFormState>;

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
  defaultValue?: string | null;
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
        className={inputCls}
      />
    </label>
  );
}

export function PropietarioForm({
  action,
  propietario,
}: {
  action: Action;
  propietario?: Propietario;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [tipoPersona, setTipoPersona] = useState(
    propietario?.tipo_persona ?? "persona_natural"
  );
  const [banco, setBanco] = useState(propietario?.banco ?? "");
  const esNatural = tipoPersona === "persona_natural";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de persona</span>
          <select
            name="tipo_persona"
            value={tipoPersona}
            onChange={(e) =>
              setTipoPersona(e.target.value as Propietario["tipo_persona"])
            }
            className={inputCls}
          >
            <option value="persona_natural">Persona natural</option>
            <option value="persona_juridica">Persona jurídica</option>
          </select>
        </label>

        <Campo label="RUT" name="rut" defaultValue={propietario?.rut} required />

        {esNatural ? (
          <>
            <Campo
              label="Nombre"
              name="nombre"
              defaultValue={propietario?.nombre}
              required
            />
            <Campo
              label="Apellido"
              name="apellido"
              defaultValue={propietario?.apellido}
            />
          </>
        ) : (
          <Campo
            label="Razón social"
            name="razon_social"
            defaultValue={propietario?.razon_social}
            required
          />
        )}

        <Campo
          label="Email"
          name="email"
          type="email"
          defaultValue={propietario?.email}
        />
        <Campo
          label="Teléfono"
          name="telefono"
          defaultValue={propietario?.telefono}
        />
        <Campo
          label="Dirección"
          name="direccion"
          defaultValue={propietario?.direccion}
        />
        <Campo label="Comuna" name="comuna" defaultValue={propietario?.comuna} />
        <Campo label="Región" name="region" defaultValue={propietario?.region} />
      </section>

      <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold text-ink">
          Datos bancarios (liquidaciones)
        </legend>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Banco</span>
          <Combobox
            name="banco"
            options={BANCOS}
            value={banco}
            onChange={setBanco}
            placeholder="Selecciona o escribe…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de cuenta</span>
          <select
            name="tipo_cuenta"
            defaultValue={propietario?.tipo_cuenta ?? ""}
            className={inputCls}
          >
            <option value="">—</option>
            <option value="corriente">Corriente</option>
            <option value="vista">Vista</option>
            <option value="ahorro">Ahorro</option>
            <option value="rut">CuentaRUT</option>
          </select>
        </label>
        <Campo
          label="N° de cuenta"
          name="numero_cuenta"
          defaultValue={propietario?.numero_cuenta}
        />
        <Campo
          label="Titular de la cuenta"
          name="titular_cuenta"
          defaultValue={propietario?.titular_cuenta}
        />
        <Campo
          label="RUT del titular"
          name="rut_titular"
          defaultValue={propietario?.rut_titular}
        />
      </fieldset>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <Link href="/propietarios" className={ui.btnSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
