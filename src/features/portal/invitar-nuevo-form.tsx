"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ui } from "@/components/ui";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { esEmailValido, formatearTelefono } from "@/lib/contacto";
import { linkWhatsApp, mensajeInvitacionPortal } from "@/lib/whatsapp";
import { invitarNuevo } from "./actions";
import type { EntidadPortal } from "./types";

const LABEL: Record<EntidadPortal, { titulo: string; volverHref: string; volverLabel: string }> = {
  arrendatario: {
    titulo: "Invitar arrendatario",
    volverHref: "/arrendatarios",
    volverLabel: "Volver a arrendatarios",
  },
  propietario: {
    titulo: "Invitar propietario",
    volverHref: "/propietarios",
    volverLabel: "Volver a propietarios",
  },
};

/**
 * Alta express: el admin solo ingresa email + teléfono, sin llenar la ficha
 * completa. La persona instala la app, sigue el link (WhatsApp) y completa
 * sus propios datos en `/portal/completar-perfil` al entrar por primera vez.
 */
export function InvitarNuevoForm({ entidad }: { entidad: EntidadPortal }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const t = LABEL[entidad];

  async function onEnviar() {
    setError(null);
    if (!esEmailValido(email) || !email.trim()) {
      setError("Ingresa un email válido.");
      return;
    }
    if (!telefono.trim()) {
      setError("Ingresa un teléfono.");
      return;
    }

    const ventana = window.open("", "_blank");
    setPending(true);
    const res = await invitarNuevo(entidad, email, telefono);
    setPending(false);

    if (res.error || !res.link) {
      ventana?.close();
      setError(res.error);
      return;
    }

    const wa = linkWhatsApp(telefono, mensajeInvitacionPortal(res.link));
    if (ventana) ventana.location.href = wa;
    else window.open(wa, "_blank", "noopener");
    setEnviado(true);
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl bg-burgundy p-6">
      <button
        type="button"
        onClick={() => router.push(t.volverHref)}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        <ArrowLeft size={15} /> {t.volverLabel}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-white">{t.titulo}</h1>
        <p className="mt-1 text-sm text-white/70">
          Solo necesitas su email y teléfono — el resto lo completa la propia persona al instalar
          la app.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.cl"
            className={ui.input}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(formatearTelefono(e.target.value))}
            placeholder="+56912345678"
            className={ui.input}
          />
        </div>
        {error && <p className="text-sm text-amber-200">{error}</p>}
        <button
          type="button"
          onClick={onEnviar}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
        >
          <WhatsAppIcon size={16} /> {pending ? "Generando…" : "Enviar por WhatsApp"}
        </button>
        {enviado && (
          <button
            type="button"
            onClick={() => {
              setEnviado(false);
              setEmail("");
              setTelefono("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Invitar a otra persona
          </button>
        )}
      </div>
    </div>
  );
}
