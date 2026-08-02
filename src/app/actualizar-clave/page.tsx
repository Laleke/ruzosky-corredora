"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordForm } from "@/features/portal/password-form";

/**
 * Destino del link de recuperación que envía Supabase Auth por email (ver
 * `solicitarRecuperacionClave`). El cliente de Supabase detecta la sesión de
 * recuperación directamente desde el fragmento de la URL (`detectSessionInUrl`,
 * default en `@supabase/ssr`) — no hay nada que verificar server-side acá.
 */
export default function ActualizarClavePage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando" | "listo" | "invalido">("cargando");

  useEffect(() => {
    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setEstado("listo");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setEstado("listo");
    });

    const timeout = setTimeout(() => {
      setEstado((actual) => (actual === "listo" ? actual : "invalido"));
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-burgundy px-6 py-12">
      {estado === "cargando" && <p className="text-sm text-white/70">Verificando enlace…</p>}

      {estado === "invalido" && (
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-burgundy-strong p-6 text-center">
          <p className="text-sm text-white">
            Este enlace no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio
            de sesión.
          </p>
        </div>
      )}

      {estado === "listo" && (
        <PasswordForm
          titulo="Define tu nueva contraseña"
          descripcion="Elige una contraseña nueva para tu cuenta."
          textoBoton="Guardar y entrar"
          alGuardar={() => router.replace("/")}
        />
      )}
    </main>
  );
}
