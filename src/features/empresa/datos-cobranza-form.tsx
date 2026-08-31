"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Pencil, Plus } from "lucide-react";
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

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor ?? "—"}</dd>
    </div>
  );
}

/** Datos de cobranza con edición en línea (mismo patrón que Arrendatarios/Gasto/Cargo). */
export function DatosCobranzaForm({ empresa }: { empresa: Empresa }) {
  const hayDatos = Boolean(empresa.banco || empresa.numero_cuenta);
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarDatosCobranza, {
    error: null,
    exito: false,
  } as EmpresaFormState);

  // actualizarDatosCobranza no redirige: cerramos la edición manualmente al
  // guardar sin error (mismo patrón que Pago/Cargo/Gasto).
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current && !pending && !state.error) {
      enviado.current = false;
      setEditando(false);
    }
  }, [pending, state.error]);

  if (!editando) {
    return (
      <div className={`${ui.card} flex flex-col gap-4 p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Datos de transferencia</h2>
            <p className="mt-1 text-sm text-muted">
              Aparecen en la sección &quot;Cómo regularizar&quot; del estado de cuenta que se
              le envía al arrendatario.
            </p>
          </div>
          <button type="button" onClick={() => setEditando(true)} className={ui.btnSecondary}>
            {hayDatos ? (
              <>
                <Pencil size={16} /> Editar
              </>
            ) : (
              <>
                <Plus size={16} /> Agregar datos de cobranza
              </>
            )}
          </button>
        </div>

        {hayDatos ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Dato label="Banco" valor={empresa.banco} />
            <Dato label="Tipo de cuenta" valor={empresa.tipo_cuenta} />
            <Dato label="N° de cuenta" valor={empresa.numero_cuenta} />
            <Dato label="Nombre del titular" valor={empresa.titular_nombre} />
            <Dato label="RUT del titular" valor={empresa.rut_titular} />
            <Dato label="Email para comprobantes" valor={empresa.email_pagos} />
          </dl>
        ) : (
          <p className="text-sm text-muted">Sin datos de cobranza registrados.</p>
        )}
      </div>
    );
  }

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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          onClick={() => {
            enviado.current = true;
          }}
          className={ui.btnPrimary}
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          disabled={pending}
          className={ui.btnSecondary}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
