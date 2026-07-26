"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { badge } from "@/components/ui";
import { PropiedadForm } from "./propiedad-form";
import type { actualizarPropiedad } from "./actions";
import type { Propiedad } from "./types";

const TIPO_LABEL: Record<string, string> = {
  departamento: "Departamento",
  casa: "Casa",
  oficina: "Oficina",
  local_comercial: "Local comercial",
  bodega: "Bodega",
  estacionamiento: "Estacionamiento",
  terreno: "Terreno",
  otro: "Otro",
};

const ESTADO: Record<string, { label: string; tone: Parameters<typeof badge>[0] }> = {
  disponible: { label: "Disponible", tone: "neutral" },
  reservada: { label: "Reservada", tone: "info" },
  arrendada: { label: "Arrendada", tone: "success" },
  mantencion: { label: "Mantención", tone: "warning" },
  inactiva: { label: "Inactiva", tone: "danger" },
};

function dinero(v: number | null, moneda: string): string {
  if (v === null) return "—";
  return moneda === "UF"
    ? `UF ${v.toLocaleString("es-CL")}`
    : `$${v.toLocaleString("es-CL")}`;
}

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value || "—"}</dd>
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
}: {
  id: string;
  propiedad: Propiedad;
  actualizarAction: typeof actualizarPropiedad;
}) {
  const [editando, setEditando] = useState(false);
  const est = ESTADO[propiedad.estado] ?? { label: propiedad.estado, tone: "neutral" as const };

  return (
    <div className="rounded-2xl bg-burgundy p-6">
      <Link
        href="/propiedades"
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> Volver a propiedades
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {propiedad.direccion ?? "Propiedad sin dirección"}
            {propiedad.numero ? ` ${propiedad.numero}` : ""}
            {propiedad.departamento ? `, ${propiedad.departamento}` : ""}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {propiedad.codigo_interno && (
              <span className={badge("info")}>{propiedad.codigo_interno}</span>
            )}
            <span className={badge(est.tone)}>{est.label}</span>
            {propiedad.publicada && <span className={badge("success")}>Publicada</span>}
            {!propiedad.activo && <span className={badge("neutral")}>Inactiva</span>}
          </div>
        </div>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
          >
            <Pencil size={16} />
            Editar
          </button>
        )}
      </div>

      <div className="mt-6">
        {editando ? (
          <PropiedadForm
            action={actualizarAction.bind(null, id)}
            propiedad={propiedad}
            onCancel={() => setEditando(false)}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <Bloque titulo="Ubicación">
              <Dato label="Región" value={propiedad.region} />
              <Dato label="Comuna" value={propiedad.comuna} />
              <Dato label="Tipo" value={TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo} />
              <Dato label="Calle" value={propiedad.direccion} />
              <Dato label="Número" value={propiedad.numero} />
              <Dato label="Depto / Casa" value={propiedad.departamento} />
              <Dato label="Rol SII" value={propiedad.rol_sii} />
            </Bloque>

            <Bloque titulo="Características">
              <Dato label="Dormitorios" value={propiedad.dormitorios} />
              <Dato label="Baños" value={propiedad.banos} />
              <Dato label="Estacionamientos" value={propiedad.estacionamientos} />
              <Dato label="Bodegas" value={propiedad.bodegas} />
              <Dato
                label="Sup. útil"
                value={propiedad.superficie_util_m2 ? `${propiedad.superficie_util_m2} m²` : null}
              />
              <Dato
                label="Sup. total"
                value={propiedad.superficie_total_m2 ? `${propiedad.superficie_total_m2} m²` : null}
              />
            </Bloque>

            <Bloque titulo="Valorización">
              <Dato label="Moneda" value={propiedad.moneda} />
              <Dato
                label="Valor ref. arriendo"
                value={dinero(propiedad.valor_referencial_arriendo, propiedad.moneda)}
              />
              <Dato
                label="Gasto común estimado"
                value={dinero(propiedad.gasto_comun_estimado, propiedad.moneda)}
              />
              <Dato label="Fecha adquisición" value={propiedad.fecha_adquisicion} />
            </Bloque>

            {propiedad.observaciones && (
              <div className="rounded-xl bg-burgundy-strong p-5">
                <h2 className="mb-2 text-sm font-semibold text-white">Observaciones</h2>
                <p className="text-sm text-white/90">{propiedad.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
