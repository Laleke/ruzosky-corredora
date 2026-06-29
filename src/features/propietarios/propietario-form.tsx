"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { useFormDraft, readDraft } from "@/components/use-form-draft";
import { NOMBRES_REGIONES, comunasDeRegion, BANCOS } from "@/data/chile";
import type { PropietarioFormState } from "./actions";
import type { Propietario } from "./types";

type Action = (
  prev: PropietarioFormState,
  formData: FormData
) => Promise<PropietarioFormState>;

const inputCls = ui.input;
const CONTROLADOS = ["tipo_persona", "telefono", "region", "comuna", "banco"];

/** Teléfono: solo dígitos, con un + opcional al inicio. */
function formatTel(raw: string): string {
  const plus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return (plus ? "+" : "") + digits;
}

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
  const draftKey = propietario ? null : "ruzosky:draft:propietario";
  const { ref, clear } = useFormDraft(draftKey, CONTROLADOS);

  const [state, formAction, pending] = useActionState(action, { error: null });
  const [tipoPersona, setTipoPersona] = useState(
    propietario?.tipo_persona ?? "persona_natural"
  );
  const [telefono, setTelefono] = useState(propietario?.telefono ?? "");
  const [region, setRegion] = useState(propietario?.region ?? "");
  const [comuna, setComuna] = useState(propietario?.comuna ?? "");
  const [banco, setBanco] = useState(propietario?.banco ?? "");
  const comunas = useMemo(() => comunasDeRegion(region), [region]);
  const esNatural = tipoPersona === "persona_natural";

  // Restaura los campos controlados desde el borrador (tras montar, sin romper hidratación).
  useEffect(() => {
    const d = readDraft(draftKey);
    if (d.tipo_persona)
      setTipoPersona(d.tipo_persona as Propietario["tipo_persona"]);
    if (d.telefono) setTelefono(d.telefono);
    if (d.region) setRegion(d.region);
    if (d.comuna) setComuna(d.comuna);
    if (d.banco) setBanco(d.banco);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form ref={ref} action={formAction} onSubmit={clear} className="flex max-w-2xl flex-col gap-6">
      <p className="rounded-lg bg-burgundy-50/60 px-3 py-2 text-sm text-muted">
        Los campos con <span className="font-medium text-red-600">*</span> son
        obligatorios. Lo que escribes se guarda como borrador por si la app se
        recarga.
      </p>

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
              label="Nombres"
              name="nombre"
              defaultValue={propietario?.nombre}
              required
            />
            <Campo
              label="Apellidos"
              name="apellido"
              defaultValue={propietario?.apellido}
              required
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Teléfono</span>
          <input
            name="telefono"
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(formatTel(e.target.value))}
            placeholder="+56912345678"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Región</span>
          <Combobox
            name="region"
            options={NOMBRES_REGIONES}
            value={region}
            onChange={(v) => {
              setRegion(v);
              setComuna("");
            }}
            placeholder="Selecciona o escribe…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Comuna</span>
          <Combobox
            name="comuna"
            options={comunas}
            value={comuna}
            onChange={setComuna}
            placeholder={region ? "Selecciona o escribe…" : "Elige una región primero"}
            disabled={!region}
          />
        </label>

        <Campo label="Calle" name="direccion" defaultValue={propietario?.direccion} />
        <Campo label="Número" name="numero" defaultValue={propietario?.numero} />
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
