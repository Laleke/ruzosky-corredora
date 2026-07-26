"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { Combobox } from "@/components/combobox";
import { NOMBRES_REGIONES, comunasDeRegion } from "@/data/chile";
import { eliminarPropiedad, type actualizarPropiedad } from "./actions";
import type { Propiedad } from "./types";

const TIPO_OPCIONES: { value: string; label: string }[] = [
  { value: "departamento", label: "Departamento" },
  { value: "casa", label: "Casa" },
  { value: "oficina", label: "Oficina" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "bodega", label: "Bodega" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];
const TIPO_LABEL: Record<string, string> = Object.fromEntries(
  TIPO_OPCIONES.map((o) => [o.value, o.label])
);

const ESTADO_OPCIONES: { value: string; label: string; tone: Parameters<typeof badge>[0] }[] = [
  { value: "disponible", label: "Disponible", tone: "neutral" },
  { value: "reservada", label: "Reservada", tone: "info" },
  { value: "arrendada", label: "Arrendada", tone: "success" },
  { value: "mantencion", label: "Mantención", tone: "warning" },
  { value: "inactiva", label: "Inactiva", tone: "danger" },
];
const ESTADO_TONE: Record<string, Parameters<typeof badge>[0]> = Object.fromEntries(
  ESTADO_OPCIONES.map((o) => [o.value, o.tone])
);

function dinero(v: number | null, moneda: string): string {
  if (v === null) return "—";
  return moneda === "UF"
    ? `UF ${v.toLocaleString("es-CL")}`
    : `$${v.toLocaleString("es-CL")}`;
}

/** Máscara de Rol SII: dígitos en formato #####-##### (manzana-predio). */
function formatRol(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Campo texto/número simple: en modo lectura muestra el valor, en edición un input en el mismo lugar. */
function Campo({
  editando,
  label,
  name,
  value,
  displayValue,
  type = "text",
}: {
  editando: boolean;
  label: string;
  name: string;
  value?: string | number | null;
  displayValue?: React.ReactNode;
  type?: "text" | "number" | "date";
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      {editando ? (
        <input
          name={name}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          step={type === "number" ? "any" : undefined}
          defaultValue={value ?? ""}
          className={`${ui.input} mt-1`}
        />
      ) : (
        <dd className="mt-0.5 text-sm text-white">{displayValue ?? (value || "—")}</dd>
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

export function PropiedadDetalle({
  id,
  propiedad,
  actualizarAction,
  eliminacionBloqueada,
}: {
  id: string;
  propiedad: Propiedad;
  actualizarAction: typeof actualizarPropiedad;
  eliminacionBloqueada: { bloqueada: boolean; motivo: string | null };
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarAction.bind(null, id), {
    error: null,
  });

  const [region, setRegion] = useState(propiedad.region ?? "");
  const [comuna, setComuna] = useState(propiedad.comuna ?? "");
  const comunas = useMemo(() => comunasDeRegion(region), [region]);
  const [rolSii, setRolSii] = useState(propiedad.rol_sii ?? "");
  const [tieneEst, setTieneEst] = useState((propiedad.estacionamientos ?? 0) > 0);
  const [tieneBod, setTieneBod] = useState((propiedad.bodegas ?? 0) > 0);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  async function onConfirmarEliminar() {
    setEliminando(true);
    setErrorEliminar(null);
    const res = await eliminarPropiedad(id);
    if (res?.error) {
      setEliminando(false);
      setErrorEliminar(res.error);
      setConfirmandoEliminar(false);
      return;
    }
    router.push("/propiedades");
  }

  const estadoTone = ESTADO_TONE[propiedad.estado] ?? "neutral";

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver a propiedades
      </button>

      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {propiedad.direccion ?? "Propiedad sin dirección"}
            {propiedad.numero ? ` ${propiedad.numero}` : ""}
            {propiedad.departamento ? `, ${propiedad.departamento}` : ""}
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
          {propiedad.codigo_interno && (
            <span className={badge("info")}>{propiedad.codigo_interno}</span>
          )}
          <span className={badge(estadoTone)}>
            {ESTADO_OPCIONES.find((o) => o.value === propiedad.estado)?.label ?? propiedad.estado}
          </span>
          {propiedad.publicada && <span className={badge("success")}>Publicada</span>}
          {!propiedad.activo && <span className={badge("neutral")}>Inactiva</span>}
        </div>
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-6">
        <Bloque titulo="Ubicación">
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
                    required
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
                    required
                  />
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Tipo</dt>
                <select
                  name="tipo"
                  defaultValue={propiedad.tipo}
                  className={`${ui.input} mt-1`}
                >
                  {TIPO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <Campo editando={false} label="Región" name="region" value={propiedad.region} />
              <Campo editando={false} label="Comuna" name="comuna" value={propiedad.comuna} />
              <Campo
                editando={false}
                label="Tipo"
                name="tipo"
                displayValue={TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo}
              />
            </>
          )}
          <Campo editando={editando} label="Calle" name="direccion" value={propiedad.direccion} />
          <Campo editando={editando} label="Número" name="numero" value={propiedad.numero} />
          <Campo
            editando={editando}
            label="Depto / Casa"
            name="departamento"
            value={propiedad.departamento}
          />
          {editando ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Rol SII</dt>
              <input
                name="rol_sii"
                value={rolSii ?? ""}
                onChange={(e) => setRolSii(formatRol(e.target.value))}
                inputMode="numeric"
                placeholder="#####-#####"
                className={`${ui.input} mt-1`}
              />
            </div>
          ) : (
            <Campo editando={false} label="Rol SII" name="rol_sii" value={propiedad.rol_sii} />
          )}
        </Bloque>

        <Bloque titulo="Características">
          <Campo
            editando={editando}
            label="Dormitorios"
            name="dormitorios"
            type="number"
            value={propiedad.dormitorios}
          />
          <Campo editando={editando} label="Baños" name="banos" type="number" value={propiedad.banos} />
          {editando ? (
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <input
                  type="checkbox"
                  checked={tieneEst}
                  onChange={(e) => setTieneEst(e.target.checked)}
                />
                Estacionamiento
              </label>
              {tieneEst && (
                <input
                  name="estacionamientos"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  required
                  defaultValue={propiedad.estacionamientos ?? 1}
                  className={`${ui.input} mt-1`}
                />
              )}
            </div>
          ) : (
            <Campo
              editando={false}
              label="Estacionamientos"
              name="estacionamientos"
              value={propiedad.estacionamientos}
            />
          )}
          {editando ? (
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <input
                  type="checkbox"
                  checked={tieneBod}
                  onChange={(e) => setTieneBod(e.target.checked)}
                />
                Bodega
              </label>
              {tieneBod && (
                <input
                  name="bodegas"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  required
                  defaultValue={propiedad.bodegas ?? 1}
                  className={`${ui.input} mt-1`}
                />
              )}
            </div>
          ) : (
            <Campo editando={false} label="Bodegas" name="bodegas" value={propiedad.bodegas} />
          )}
          <Campo
            editando={editando}
            label="Sup. útil"
            name="superficie_util_m2"
            type="number"
            value={propiedad.superficie_util_m2}
            displayValue={propiedad.superficie_util_m2 ? `${propiedad.superficie_util_m2} m²` : null}
          />
          <Campo
            editando={editando}
            label="Sup. total"
            name="superficie_total_m2"
            type="number"
            value={propiedad.superficie_total_m2}
            displayValue={propiedad.superficie_total_m2 ? `${propiedad.superficie_total_m2} m²` : null}
          />
        </Bloque>

        <Bloque titulo="Valorización">
          {editando ? (
            <>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Estado</dt>
                <select name="estado" defaultValue={propiedad.estado} className={`${ui.input} mt-1`}>
                  {ESTADO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/50">Moneda</dt>
                <select name="moneda" defaultValue={propiedad.moneda} className={`${ui.input} mt-1`}>
                  <option value="CLP">CLP</option>
                  <option value="UF">UF</option>
                </select>
              </div>
            </>
          ) : (
            <Campo editando={false} label="Moneda" name="moneda" value={propiedad.moneda} />
          )}
          <Campo
            editando={editando}
            label="Valor ref. arriendo"
            name="valor_referencial_arriendo"
            type="number"
            value={propiedad.valor_referencial_arriendo}
            displayValue={dinero(propiedad.valor_referencial_arriendo, propiedad.moneda)}
          />
          <Campo
            editando={editando}
            label="Gasto común estimado"
            name="gasto_comun_estimado"
            type="number"
            value={propiedad.gasto_comun_estimado}
            displayValue={dinero(propiedad.gasto_comun_estimado, propiedad.moneda)}
          />
          <Campo
            editando={editando}
            label="Fecha adquisición"
            name="fecha_adquisicion"
            type="date"
            value={propiedad.fecha_adquisicion}
          />
          {editando && (
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" name="publicada" defaultChecked={propiedad.publicada} />
              Publicada en portales
            </label>
          )}
        </Bloque>

        {(propiedad.observaciones || editando) && (
          <div className="rounded-xl bg-burgundy-strong p-5">
            <h2 className="mb-2 text-sm font-semibold text-white">Observaciones</h2>
            {editando ? (
              <textarea
                name="observaciones"
                defaultValue={propiedad.observaciones ?? ""}
                rows={3}
                className={ui.input}
              />
            ) : (
              <p className="text-sm text-white/90">{propiedad.observaciones}</p>
            )}
          </div>
        )}

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
          {eliminacionBloqueada.bloqueada ? (
            <p className="max-w-sm text-center text-xs text-white/60">
              No se puede eliminar esta propiedad: {eliminacionBloqueada.motivo}
            </p>
          ) : confirmandoEliminar ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white">
                ¿Eliminar esta propiedad? Esta acción no se puede deshacer.
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
              <Trash2 size={14} /> Eliminar propiedad
            </button>
          )}
          {errorEliminar && <p className="max-w-sm text-center text-xs text-amber-200">{errorEliminar}</p>}
        </div>
      )}
    </div>
  );
}
