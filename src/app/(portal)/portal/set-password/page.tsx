"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { marcarPasswordEstablecida } from "@/features/portal/actions";
import { ui } from "@/components/ui";

export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
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

    await marcarPasswordEstablecida();
    setPending(false);
    router.replace("/portal");
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 rounded-2xl bg-burgundy p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Crea tu contraseña</h1>
        <p className="mt-1 text-sm text-white/70">
          Define una contraseña para poder entrar al portal en el futuro, desde este u otro
          dispositivo, sin depender del link que te enviaron.
        </p>
        {email && (
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm text-white">
            Tu usuario para entrar será: <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-white">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ui.input}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmacion" className="text-sm font-medium text-white">
            Confirma la contraseña
          </label>
          <input
            id="confirmacion"
            type="password"
            autoComplete="new-password"
            required
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className={ui.input}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  );
}
