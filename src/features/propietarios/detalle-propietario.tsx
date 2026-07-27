"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import { eliminarPropietario, type actualizarPropietario } from "./actions";
import type { Propietario } from "./types";

const TIPO_CUENTA_OPCIONES = [
  { value: "", label: "—" },
  { value: "corriente", label: "Cuenta corriente" },
  { value: "vista", label: "Cuenta vista" },
  { value: "ahorro", label: "Cuenta de ahorro" },
  { value: "rut", label: "Cuenta RUT" },
];
const TIPO_CUENTA_LABEL: Record<string, string> = Object.fromEntries(
  TIPO_CUENTA_OPCIONES.map((o) => [o.value, o.label])
);

function nombreMostrar(p: Propietario): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value || "—"}</dd>
    </div>
  );
}

function Campo({
  editando,
  label,
  name,
  value,
}: {
  editando: boolean;
  label: string;
  name: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      {editando ? (
        <input name={name} defaultValue={value ?? ""} className={`${ui.input} mt-1`} />
      ) : (
        <dd className="mt-0.5 text-sm text-white">{value || "—"}</dd>
      )}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-burgundy-strong p-5">
      <h2 className="mb-4 text-sm font-semibold text-white">{titulo}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

export function DetallePropietario({
  id,
  propietario,
  actualizarAction,
  eliminacionBloqueada,
}: {
  id: string;
  propietario: Propietario;
  actualizarAction: typeof actualizarPropietario;
  eliminacionBloqueada: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarAction.bind(null, id), {
    error: null,
  });

  const [tipoPersona, setTipoPersona] = useState(propietario.tipo_persona);
  const [region, setRegion] = useState(propietario.region ?? "");
  const [comuna, setComuna] = useState(propietario.comuna ?? "");
  const comunas = useMemo(() => comunasDeRegion(region), [region]);
  const esNatural = tipoPersona === "persona_natural";

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function onConfirmarEliminar() {
    setEliminando(true);
    setErrorEliminar(null);
    const res = await eliminarPropietario(id);
    if (res?.error) {
      setEliminando(false);
      setErrorEliminar(res.error);
      setConfirmandoEliminar(false);
      return;
    }
    router.push("/propietarios");
  }

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver a propietarios
      </button>

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {nombreMostrar(propietario)}
          </h1>
          {!editando && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
            >
              <Pencil size={16} />
              Editar
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={badge("info")}>{propietario.rut}</span>
          <span className={badge(propietario.activo ? "success" : "neutral")}>
            {propietario.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-6">
        <Bloque titulo="Identificación">
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Tipo de persona</dt>
              <select
                name="tipo_persona"
                value={tipoPersona}
                onChange={(e) =>
                  setTipoPersona(e.target.value as Propietario["tipo_persona"])
                }
                className={`${ui.input} mt-1`}
              >
                <option value="persona_natural">Persona natural</option>
                <option value="persona_juridica">Persona jurídica</option>
              </select>
            </div>
          ) : (
            <Dato
              label="Tipo de persona"
              value={esNatural ? "Persona natural" : "Persona jurídica"}
            />
          )}
          <Campo editando={editando} label="RUT" name="rut" value={propietario.rut} />
          {esNatural ? (
            <>
              <Campo editando={editando} label="Nombres" name="nombre" value={propietario.nombre} />
              <Campo
                editando={editando}
                label="Apellidos"
                name="apellido"
                value={propietario.apellido}
              />
            </>
          ) : (
            <Campo
              editando={editando}
              label="Razón social"
              name="razon_social"
              value={propietario.razon_social}
            />
          )}
        </Bloque>

        <Bloque titulo="Contacto">
          <Campo editando={editando} label="Email" name="email" value={propietario.email} />
          <Campo editando={editando} label="Teléfono" name="telefono" value={propietario.telefono} />
        </Bloque>

        <Bloque titulo="Dirección">
          {editando ? (
            <>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Región</dt>
                <div className="mt-1">
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
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Comuna</dt>
                <div className="mt-1">
                  <Combobox
                    name="comuna"
                    options={comunas}
                    value={comuna}
                    onChange={setComuna}
                    placeholder={region ? "Selecciona o escribe…" : "Elige una región primero"}
                    disabled={!region}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Dato label="Región" value={propietario.region} />
              <Dato label="Comuna" value={propietario.comuna} />
            </>
          )}
          <Campo editando={editando} label="Calle" name="direccion" value={propietario.direccion} />
          <Campo editando={editando} label="Número" name="numero" value={propietario.numero} />
        </Bloque>

        <Bloque titulo="Datos bancarios (para liquidaciones)">
          <Campo editando={editando} label="Banco" name="banco" value={propietario.banco} />
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Tipo de cuenta</dt>
              <select
                name="tipo_cuenta"
                defaultValue={propietario.tipo_cuenta ?? ""}
                className={`${ui.input} mt-1`}
              >
                {TIPO_CUENTA_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Dato
              label="Tipo de cuenta"
              value={propietario.tipo_cuenta ? TIPO_CUENTA_LABEL[propietario.tipo_cuenta] : null}
            />
          )}
          <Campo
            editando={editando}
            label="N° de cuenta"
            name="numero_cuenta"
            value={propietario.numero_cuenta}
          />
          <Campo
            editando={editando}
            label="Titular de la cuenta"
            name="titular_cuenta"
            value={propietario.titular_cuenta}
          />
          <Campo
            editando={editando}
            label="RUT del titular"
            name="rut_titular"
            value={propietario.rut_titular}
          />
        </Bloque>

        {state.error && (
          <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {state.error}
          </p>
        )}

        {editando && (
          <div className="flex justify-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>

      {!editando && (
        <div className="mt-2 flex flex-col items-center gap-2">
          {eliminacionBloqueada ? (
            <p className="max-w-sm text-center text-xs text-white/60">
              No se puede eliminar: tiene liquidaciones asociadas.
            </p>
          ) : confirmandoEliminar ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white">
                ¿Eliminar este propietario? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onConfirmarEliminar}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {eliminando ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(false)}
                  disabled={eliminando}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-white/90"
            >
              <Trash2 size={14} /> Eliminar propietario
            </button>
          )}
          {errorEliminar && <p className="max-w-sm text-center text-xs text-amber-200">{errorEliminar}</p>}
        </div>
      )}
    </div>
  );
}
