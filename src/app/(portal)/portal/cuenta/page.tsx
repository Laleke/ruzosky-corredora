"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordForm } from "@/features/portal/password-form";

export default function CuentaPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-canvas-fg">Mi cuenta</h1>
        <p className="mt-1 text-sm text-canvas-muted">Cambia tu contraseña de acceso al portal.</p>
      </div>

      <PasswordForm
        titulo="Cambiar contraseña"
        descripcion="Define una contraseña nueva para tu cuenta."
        info={
          email ? (
            <>
              Cuenta: <span className="font-medium">{email}</span>
            </>
          ) : null
        }
        textoBoton="Cambiar contraseña"
        alGuardar={() => {}}
      />
    </div>
  );
}
