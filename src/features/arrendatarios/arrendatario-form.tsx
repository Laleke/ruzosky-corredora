"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import type { ArrendatarioFormState } from "./actions";
import type { Arrendatario } from "./types";

type Action = (
  prev: ArrendatarioFormState,
  formData: FormData
) => Promise<ArrendatarioFormState>;

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

export function ArrendatarioForm({
  action,
  arrendatario,
}: {
  action: Action;
  arrendatario?: Arrendatario;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [tipoPersona, setTipoPersona] = useState(
    arrendatario?.tipo_persona ?? "persona_natural"
  );
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
              setTipoPersona(e.target.value as Arrendatario["tipo_persona"])
            }
            className={inputCls}
          >
            <option value="persona_natural">Persona natural</option>
            <option value="persona_juridica">Persona jurídica</option>
          </select>
        </label>

        <Campo
          label="RUT"
          name="rut"
          defaultValue={arrendatario?.rut}
          required
        />

        {esNatural ? (
          <>
            <Campo
              label="Nombre"
              name="nombre"
              defaultValue={arrendatario?.nombre}
              required
            />
            <Campo
              label="Apellido"
              name="apellido"
              defaultValue={arrendatario?.apellido}
            />
          </>
        ) : (
          <Campo
            label="Razón social"
            name="razon_social"
            defaultValue={arrendatario?.razon_social}
            required
          />
        )}

        <Campo
          label="Email"
          name="email"
          type="email"
          defaultValue={arrendatario?.email}
        />
        <Campo
          label="Teléfono"
          name="telefono"
          defaultValue={arrendatario?.telefono}
        />
        <Campo
          label="Dirección"
          name="direccion"
          defaultValue={arrendatario?.direccion}
        />
        <Campo
          label="Comuna"
          name="comuna"
          defaultValue={arrendatario?.comuna}
        />
        <Campo
          label="Región"
          name="region"
          defaultValue={arrendatario?.region}
        />
      </section>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <Link href="/arrendatarios" className={ui.btnSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
