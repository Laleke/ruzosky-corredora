"use client";

import { useState } from "react";
import { Printer, Link2, Copy, Check, Ban } from "lucide-react";
import { ui } from "@/components/ui";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { linkWhatsApp, mensajeEstadoCuenta } from "@/lib/whatsapp";
import { generarLinkEstadoCuenta, revocarLinkEstadoCuenta } from "./actions";

export function AccionesEstadoCuenta({
  arrendatarioId,
  nombre,
  telefono,
  total,
  cantidadCargos,
  diasMora,
  propiedad,
  tokenInicial,
  baseUrl,
}: {
  arrendatarioId: string;
  nombre: string;
  telefono: string | null;
  total: number;
  cantidadCargos: number;
  diasMora: number;
  propiedad: string | null;
  tokenInicial: string | null;
  /** Origen público del sitio, para armar el link que se envía. */
  baseUrl: string;
}) {
  const [token, setToken] = useState(tokenInicial);
  const [pending, setPending] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = token ? `${baseUrl}/e/${token}` : null;
  const mensaje = mensajeEstadoCuenta({
    nombre,
    total,
    cantidadCargos,
    diasMora,
    propiedad,
    link,
  });

  async function onGenerar() {
    setPending(true);
    setError(null);
    const res = await generarLinkEstadoCuenta(arrendatarioId);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setToken(res.token);
  }

  async function onRevocar() {
    if (!confirm("¿Revocar el link? Quien lo tenga dejará de ver el estado de cuenta.")) return;
    setPending(true);
    setError(null);
    const res = await revocarLinkEstadoCuenta(arrendatarioId);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setToken(null);
  }

  async function onCopiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="no-print flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => window.print()} className={ui.btnSecondary}>
          <Printer size={16} /> Descargar PDF
        </button>

        {!token ? (
          <button
            type="button"
            onClick={onGenerar}
            disabled={pending}
            className={ui.btnSecondary}
          >
            <Link2 size={16} /> {pending ? "Generando…" : "Generar link para compartir"}
          </button>
        ) : (
          <>
            <button type="button" onClick={onCopiar} className={ui.btnSecondary}>
              {copiado ? <Check size={16} /> : <Copy size={16} />}
              {copiado ? "Copiado" : "Copiar link"}
            </button>
            <button
              type="button"
              onClick={onRevocar}
              disabled={pending}
              className={`${ui.btnSecondary} text-red-600`}
            >
              <Ban size={16} /> Revocar
            </button>
          </>
        )}

        {telefono ? (
          <a
            href={linkWhatsApp(telefono, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <WhatsAppIcon size={16} /> Enviar por WhatsApp
          </a>
        ) : (
          <span className="inline-flex items-center text-xs text-canvas-muted">
            Sin teléfono registrado — agrégalo en la ficha del arrendatario para enviar por WhatsApp.
          </span>
        )}
      </div>

      {link && (
        <p className="break-all rounded-lg bg-white/5 px-3 py-2 text-xs text-canvas-muted">
          {link}
        </p>
      )}
      {!token && (
        <p className="text-xs text-canvas-muted">
          Sin link generado: el mensaje de WhatsApp irá con el resumen de la deuda, pero sin
          detalle en línea. Puedes adjuntar el PDF a mano.
        </p>
      )}
      {error && <p className="text-xs text-amber-300">{error}</p>}
    </div>
  );
}
