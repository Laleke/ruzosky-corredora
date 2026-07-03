"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { useFormDraft, readDraft } from "@/components/use-form-draft";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import type { ArrendatarioFormState } from "./actions";
import type { Arrendatario } from "./types";

type Action = (
  prev: ArrendatarioFormState,
  formData: FormData
) => Promise<ArrendatarioFormState>;

const inputCls = ui.input;
const CONTROLADOS = ["tipo_persona", "telefono", "region", "comuna"];

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

export function ArrendatarioForm({
  action,
  arrendatario,
}: {
  action: Action;
  arrendatario?: Arrendatario;
}) {
  const draftKey = arrendatario ? null : "rzk:draft:arrendatario";
  const { ref, clear } = useFormDraft(draftKey, CONTROLADOS);

  const [state, formAction, pending] = useActionState(action, { error: null });
  const [tipoPersona, setTipoPersona] = useState(
    arrendatario?.tipo_persona ?? "persona_natural"
  );
  const [telefono, setTelefono] = useState(arrendatario?.telefono ?? "");
  const [region, setRegion] = useState(arrendatario?.region ?? "");
  const [comuna, setComuna] = useState(arrendatario?.comuna ?? "");
  const comunas = useMemo(() => comunasDeRegion(region), [region]);
  const esNatural = tipoPersona === "persona_natural";

  useEffect(() => {
    const d = readDraft(draftKey);
    if (d.tipo_persona)
      setTipoPersona(d.tipo_persona as Arrendatario["tipo_persona"]);
    if (d.telefono) setTelefono(d.telefono);
    if (d.region) setRegion(d.region);
    if (d.comuna) setComuna(d.comuna);
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
              setTipoPersona(e.target.value as Arrendatario["tipo_persona"])
            }
            className={inputCls}
          >
            <option value="persona_natural">Persona natural</option>
            <option value="persona_juridica">Persona jurídica</option>
          </select>
        </label>

        <Campo label="RUT" name="rut" defaultValue={arrendatario?.rut} required />

        {esNatural ? (
          <>
            <Campo
              label="Nombres"
              name="nombre"
              defaultValue={arrendatario?.nombre}
              required
            />
            <Campo
              label="Apellidos"
              name="apellido"
              defaultValue={arrendatario?.apellido}
              required
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

        <Campo label="Calle" name="direccion" defaultValue={arrendatario?.direccion} />
        <Campo label="Número" name="numero" defaultValue={arrendatario?.numero} />
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
