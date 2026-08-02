"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn, type LoginState } from "./actions";
import { ui } from "@/components/ui";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [verPassword, setVerPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${ui.input} pr-10`}
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            tabIndex={-1}
            aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <Link href="/recuperar-clave" className="self-end text-xs text-white/70 hover:text-white">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {state.error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
