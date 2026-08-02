"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ui } from "@/components/ui";

const REQUISITOS = [
  { key: "largo", label: "Al menos 8 caracteres", cumple: (p: string) => p.length >= 8 },
  { key: "mayuscula", label: "Una letra mayúscula", cumple: (p: string) => /[A-Z]/.test(p) },
  { key: "numero", label: "Un número", cumple: (p: string) => /[0-9]/.test(p) },
];

export function cumpleRequisitosPassword(p: string): boolean {
  return REQUISITOS.every((r) => r.cumple(p));
}

/**
 * Formulario de contraseña compartido por `/portal/set-password` (primera
 * vez, obligatorio) y `/portal/cuenta` (cambiarla después) — misma UI
 * (mostrar/ocultar, checklist de requisitos en vivo, validación de
 * coincidencia), distinto texto y qué pasa después de guardar.
 */
export function PasswordForm({
  titulo,
  descripcion,
  info,
  textoBoton = "Guardar",
  alGuardar,
}: {
  titulo: string;
  descripcion: string;
  /** Contenido adicional dentro de un recuadro, ej. mostrar el email de la cuenta. */
  info?: React.ReactNode;
  textoBoton?: string;
  /** Qué hacer después de actualizar la contraseña en Supabase Auth (redirigir, marcar password_set, mostrar éxito, etc). */
  alGuardar: () => Promise<void> | void;
}) {
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [pending, setPending] = useState(false);

  const coinciden = confirmacion.length > 0 && password === confirmacion;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (!cumpleRequisitosPassword(password)) {
      setError("La contraseña no cumple los requisitos.");
      return;
    }
    if (!coinciden) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: errorUpdate } = await supabase.auth.updateUser({ password });

    if (errorUpdate) {
      setPending(false);
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      return;
    }

    await alGuardar();
    setPending(false);
    setExito(true);
    setPassword("");
    setConfirmacion("");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-burgundy p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{titulo}</h1>
        <p className="mt-1 text-sm text-white/70">{descripcion}</p>
        {info && (
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-white">{info}</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-white">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={verPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${ui.input} pr-10`}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              tabIndex={-1}
              aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <ul className="mt-1 flex flex-col gap-1">
            {REQUISITOS.map((r) => {
              const ok = r.cumple(password);
              return (
                <li
                  key={r.key}
                  className={`flex items-center gap-1.5 text-xs ${
                    ok ? "text-emerald-400" : "text-white/60"
                  }`}
                >
                  {ok ? <Check size={13} /> : <X size={13} />}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmacion" className="text-sm font-medium text-white">
            Confirma la contraseña
          </label>
          <input
            id="confirmacion"
            type={verPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className={ui.input}
          />
          {confirmacion.length > 0 && (
            <p
              className={`flex items-center gap-1.5 text-xs ${
                coinciden ? "text-emerald-400" : "text-white/60"
              }`}
            >
              {coinciden ? <Check size={13} /> : <X size={13} />}
              Las contraseñas coinciden
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {error}
          </p>
        )}
        {exito && (
          <p className="rounded-lg bg-emerald-600/20 px-3 py-2 text-sm text-white" role="status">
            Contraseña actualizada.
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !cumpleRequisitosPassword(password) || !coinciden}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Guardando…" : textoBoton}
        </button>
      </form>
    </div>
  );
}
