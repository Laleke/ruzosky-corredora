"use client";

import { useActionState } from "react";
import Link from "next/link";
import { solicitarRecuperacionClave, type RecuperarState } from "@/app/(auth)/login/actions";
import { ui } from "@/components/ui";

const initialState: RecuperarState = { error: null, enviado: false };

export function RecuperarClaveForm() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacionClave, initialState);

  if (state.enviado) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-lg bg-emerald-600/20 px-3 py-2 text-sm text-white">
          Si ese email tiene una cuenta, te llegará un link para definir una contraseña nueva.
          Revisa tu bandeja de entrada (y spam).
        </p>
        <Link href="/login" className="text-center text-sm text-white/70 hover:text-white">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={ui.input}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-white" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar link"}
      </button>
      <Link href="/login" className="text-center text-sm text-white/70 hover:text-white">
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
