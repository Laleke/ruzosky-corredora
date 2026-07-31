"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { badge, ui } from "@/components/ui";
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
  const [link, setLink] = useState<string | null>(null);

  async function onInvitar() {
    setError(null);
    setLink(null);
    if (!esEmailValido(email) || !email.trim()) {
      setError("Ingresa un email válido.");
      return;
    }
    setPending(true);
    const res = await invitarAlPortal(entidad, entidadId, email);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setLink(res.link);
  }

  const est = ESTADO_LABEL[estadoInvitacion];
  const puedeWhatsapp = Boolean(link && telefonoDefault);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={badge(est.tone)}>{est.label}</span>
      </div>

      {estadoInvitacion !== "activo" && (
        <div className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.cl"
            className={ui.input}
          />
          <button
            type="button"
            onClick={onInvitar}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send size={15} />
            {pending
              ? "Generando…"
              : estadoInvitacion === "invitado"
                ? "Reenviar invitación"
                : "Invitar al portal"}
          </button>
          {error && <p className="text-xs text-amber-200">{error}</p>}
          {link && (
            <div className="flex flex-col gap-2 rounded-lg bg-white/10 p-3">
              {puedeWhatsapp ? (
                <a
                  href={linkWhatsApp(telefonoDefault!, mensajeInvitacionPortal(link))}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageCircle size={16} /> Enviar por WhatsApp
                </a>
              ) : (
                <p className="text-xs text-amber-200">
                  Falta un teléfono registrado para enviar por WhatsApp — agrégalo y vuelve a
                  invitar.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
