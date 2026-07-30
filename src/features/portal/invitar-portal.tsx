"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { badge, ui } from "@/components/ui";
import { esEmailValido } from "@/lib/contacto";
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
  estadoInvitacion,
}: {
  entidad: EntidadPortal;
  entidadId: string;
  emailDefault: string | null;
  estadoInvitacion: EstadoInvitacion;
}) {
  const [email, setEmail] = useState(emailDefault ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  async function onCopiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const est = ESTADO_LABEL[estadoInvitacion];

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
            <div className="flex flex-col gap-1.5 rounded-lg bg-white/10 p-3">
              <p className="text-xs text-white/70">
                Copia este link y compártelo con la persona (WhatsApp, etc.):
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="min-w-0 flex-1 rounded-lg border border-white/20 bg-transparent px-2 py-1.5 text-xs text-white"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={onCopiar}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/25"
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  {copiado ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
