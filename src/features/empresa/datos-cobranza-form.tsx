"use client";

import { useActionState } from "react";
import { ui } from "@/components/ui";
import { SelectStyled } from "@/components/select-styled";
import { actualizarDatosCobranza, type EmpresaFormState } from "./actions";
import type { Empresa } from "@/features/estado-cuenta/types";

const TIPOS_CUENTA = [
  "Cuenta Corriente",
  "Cuenta Vista",
  "Cuenta de Ahorro",
  "Chequera Electrónica",
];

function Campo({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={ui.input}
      />
    </label>
  );
}

export function DatosCobranzaForm({ empresa }: { empresa: Empresa }) {
  const [state, formAction, pending] = useActionState(actualizarDatosCobranza, {
    error: null,
    exito: false,
  } as EmpresaFormState);

  return (
    <form action={formAction} className={`${ui.card} flex flex-col gap-4 p-5`}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Datos de transferencia</h2>
        <p className="mt-1 text-sm text-muted">
          Aparecen en la sección &quot;Cómo regularizar&quot; del estado de cuenta que se le envía
          al arrendatario.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Banco" name="banco" defaultValue={empresa.banco} placeholder="Banco de Chile" />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Tipo de cuenta</span>
          <SelectStyled name="tipo_cuenta" defaultValue={empresa.tipo_cuenta ?? ""}>
            <option value="">—</option>
            {TIPOS_CUENTA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectStyled>
        </label>
        <Campo
          label="N° de cuenta"
          name="numero_cuenta"
          defaultValue={empresa.numero_cuenta}
          placeholder="00012345678"
        />
        <Campo
          label="Nombre del titular"
          name="titular_nombre"
          defaultValue={empresa.titular_nombre}
        />
        <Campo
          label="RUT del titular"
          name="rut_titular"
          defaultValue={empresa.rut_titular}
          placeholder="12.345.678-9"
        />
        <Campo
          label="Email para comprobantes"
          name="email_pagos"
          type="email"
          defaultValue={empresa.email_pagos}
          placeholder="pagos@ejemplo.cl"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.exito && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          Datos guardados.
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
