"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { marcarPasswordEstablecida } from "@/features/portal/actions";
import { PasswordForm } from "@/features/portal/password-form";

export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <PasswordForm
      titulo="Crea tu contraseña"
      descripcion="Define una contraseña para poder entrar al portal en el futuro, desde este u otro dispositivo, sin depender del link que te enviaron."
      info={
        email ? (
          <>
            Tu usuario para entrar será: <span className="font-medium">{email}</span>
          </>
        ) : null
      }
      textoBoton="Guardar y entrar"
      alGuardar={async () => {
        await marcarPasswordEstablecida();
        router.replace("/portal");
      }}
    />
  );
}
