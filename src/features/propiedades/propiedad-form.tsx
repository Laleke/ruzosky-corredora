"use client";

import { useActionState, useState, useMemo } from "react";
import Link from "next/link";
import { ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import type { PropiedadFormState } from "./actions";
import type { Propiedad } from "./types";

type Action = (
  prev: PropiedadFormState,
  formData: FormData
) => Promise<PropiedadFormState>;

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

export function PropiedadForm({
  action,
  propiedad,
}: {
  action: Action;
  propiedad?: Propiedad;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [region, setRegion] = useState(propiedad?.region ?? "");
  const [comuna, setComuna] = useState(propiedad?.comuna ?? "");
  const comunas = useMemo(() => comunasDeRegion(region), [region]);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo</span>
          <select
            name="tipo"
            defaultValue={propiedad?.tipo ?? "departamento"}
            className={inputCls}
          >
            <option value="departamento">Departamento</option>
            <option value="casa">Casa</option>
            <option value="oficina">Oficina</option>
            <option value="local_comercial">Local comercial</option>
            <option value="bodega">Bodega</option>
            <option value="estacionamiento">Estacionamiento</option>
            <option value="terreno">Terreno</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Región <span className="text-red-600">*</span>
          </span>
          <Combobox
            name="region"
            options={NOMBRES_REGIONES}
            value={region}
            onChange={(v) => {
              setRegion(v);
              setComuna("");
            }}
            placeholder="Selecciona o escribe…"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Comuna <span className="text-red-600">*</span>
          </span>
          <Combobox
            name="comuna"
            options={comunas}
            value={comuna}
            onChange={setComuna}
            placeholder={region ? "Selecciona o escribe…" : "Elige una región primero"}
            disabled={!region}
            required
          />
        </label>

        <Campo label="Dirección" name="direccion" defaultValue={propiedad?.direccion} />
        <Campo label="Número" name="numero" defaultValue={propiedad?.numero} />
        <Campo
          label="Depto / Casa"
          name="departamento"
          defaultValue={propiedad?.departamento}
        />
        <Campo label="Rol SII" name="rol_sii" defaultValue={propiedad?.rol_sii} />
      </section>

      <fieldset className="grid grid-cols-2 gap-4 rounded-xl border border-line p-4 sm:grid-cols-4">
        <legend className="px-1 text-sm font-semibold text-ink">Características</legend>
        <Campo
          label="Dormitorios"
          name="dormitorios"
          type="number"
          defaultValue={propiedad?.dormitorios}
        />
        <Campo
          label="Baños"
          name="banos"
          type="number"
          defaultValue={propiedad?.banos}
        />
        <Campo
          label="Estacionamientos"
          name="estacionamientos"
          type="number"
          defaultValue={propiedad?.estacionamientos}
        />
        <Campo
          label="Bodegas"
          name="bodegas"
          type="number"
          defaultValue={propiedad?.bodegas}
        />
        <Campo
          label="Sup. útil (m²)"
          name="superficie_util_m2"
          type="number"
          defaultValue={propiedad?.superficie_util_m2}
        />
        <Campo
          label="Sup. total (m²)"
          name="superficie_total_m2"
          type="number"
          defaultValue={propiedad?.superficie_total_m2}
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-line p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold text-ink">
          Estado y valorización
        </legend>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select
            name="estado"
            defaultValue={propiedad?.estado ?? "disponible"}
            className={inputCls}
          >
            <option value="disponible">Disponible</option>
            <option value="reservada">Reservada</option>
            <option value="arrendada">Arrendada</option>
            <option value="mantencion">Mantención</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Moneda</span>
          <select
            name="moneda"
            defaultValue={propiedad?.moneda ?? "CLP"}
            className={inputCls}
          >
            <option value="CLP">CLP</option>
            <option value="UF">UF</option>
          </select>
        </label>
        <Campo
          label="Valor referencial arriendo"
          name="valor_referencial_arriendo"
          type="number"
          defaultValue={propiedad?.valor_referencial_arriendo}
        />
        <Campo
          label="Gasto común estimado"
          name="gasto_comun_estimado"
          type="number"
          defaultValue={propiedad?.gasto_comun_estimado}
        />
        <Campo
          label="Fecha de adquisición"
          name="fecha_adquisicion"
          type="date"
          defaultValue={propiedad?.fecha_adquisicion}
        />
        <label className="flex items-center gap-2 text-sm sm:mt-6">
          <input
            type="checkbox"
            name="publicada"
            defaultChecked={propiedad?.publicada ?? false}
          />
          <span className="font-medium">Publicada en portales</span>
        </label>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observaciones</span>
        <textarea
          name="observaciones"
          defaultValue={propiedad?.observaciones ?? ""}
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
        <Link href="/propiedades" className={ui.btnSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
