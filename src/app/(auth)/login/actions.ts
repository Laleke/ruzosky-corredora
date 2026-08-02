"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signIn(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Mensaje genérico: no revelar si el email existe o no.
    return { error: "Credenciales inválidas." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.rol === "admin" ? "/dashboard" : "/portal");
}

export type RecuperarState = { error: string | null; enviado: boolean };

function sitioUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Autoservicio de "olvidé mi contraseña" desde el login. Depende de que el
 * envío de correo de Supabase Auth esté configurado (SMTP propio o el
 * servicio por defecto de Supabase) — el resto del sistema evita el email
 * a propósito (invitaciones van por WhatsApp), así que esto es la única
 * ruta que sí depende de que ese envío funcione.
 */
export async function solicitarRecuperacionClave(
  _prev: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Ingresa tu email.", enviado: false };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${sitioUrl()}/actualizar-clave`,
  });

  // Mismo mensaje exista o no la cuenta con ese email: no revelar cuáles
  // correos tienen cuenta creada.
  return { error: null, enviado: true };
}
