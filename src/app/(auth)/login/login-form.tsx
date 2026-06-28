"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { ui } from "@/components/ui";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={ui.label}>
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
        <label htmlFor="password" className={ui.label}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={ui.input}
        />
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
        className={`${ui.btnPrimary} mt-2 w-full py-2.5`}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
