"use client";

import { useState } from "react";
import { badge, ui } from "@/components/ui";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { esEmailValido } from "@/lib/contacto";
import { linkWhatsApp, mensajeInvitacionPortal } from "@/lib/whatsapp";
import { invitarAlPortal } from "./actions";
import type { EntidadPortal, EstadoInvitacion } from "./types";

const ESTADO_LABEL: Record<EstadoInvitacion, { label: string; tone: Parameters<typeof badge>[0] }> = {
  sin_invitar: { label: "Sin invitar al portal", tone: "neutral" },
  invitado: { label: "Invitado — sin confirmar", tone: "warning" },
  activo: { label: "Activo en el portal", tone: "success" },
};

export function InvitarPortal({
  entidad,
  entidadId,
  emailDefault,
  telefonoDefault,
  estadoInvitacion,
}: {
  entidad: EntidadPortal;
  entidadId: string;
  emailDefault: string | null;
  telefonoDefault: string | null;
  estadoInvitacion: EstadoInvitacion;
}) {
  const [email, setEmail] = useState(emailDefault ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const est = ESTADO_LABEL[estadoInvitacion];
  const activo = estadoInvitacion === "activo";

  /**
   * Genera la invitación (o, si ya está activo, un link de restablecer
   * contraseña) y abre WhatsApp en un solo paso. La ventana se abre síncrono
   * al click (antes del await) para no chocar con el bloqueador de popups —
   * se le asigna la URL real una vez que la tenemos.
   */
  async function onEnviar() {
    setError(null);
    const correo = activo ? emailDefault ?? "" : email;
    if (!esEmailValido(correo) || !correo.trim()) {
      setError("Ingresa un email válido.");
      return;
    }
    if (!telefonoDefault) {
      setError("Falta un teléfono registrado para enviar por WhatsApp.");
      return;
    }

    const ventana = window.open("", "_blank");
    setPending(true);
    const res = await invitarAlPortal(entidad, entidadId, correo);
    setPending(false);

    if (res.error || !res.link) {
      ventana?.close();
      setError(res.error ?? "No se pudo generar la invitación.");
      return;
    }

    const wa = linkWhatsApp(telefonoDefault, mensajeInvitacionPortal(res.link));
    if (ventana) ventana.location.href = wa;
    else window.open(wa, "_blank", "noopener");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={badge(est.tone)}>{est.label}</span>
      </div>

      {!activo && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.cl"
          className={ui.input}
        />
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
      >
        <WhatsAppIcon size={16} />
        {pending ? "Generando…" : activo ? "Restablecer contraseña" : "Enviar por WhatsApp"}
      </button>
      {error && <p className="text-xs text-amber-200">{error}</p>}
    </div>
  );
}
