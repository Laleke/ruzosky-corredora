"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esEmailValido } from "@/lib/contacto";
import type { EntidadPortal, InvitarState } from "./types";

const TABLA: Record<EntidadPortal, "propietarios" | "arrendatarios"> = {
  propietario: "propietarios",
  arrendatario: "arrendatarios",
};

function sitioUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function nombrePersona(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string | null {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? null;
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || null;
}

/**
 * Genera una invitación al portal para un propietario o arrendatario.
 * Solo un admin puede invocarla. No envía el correo: devuelve el link
 * de invitación para que el admin lo copie y lo comparta él mismo
 * (decisión explícita — sin dependencia de email por ahora).
 */
export async function invitarAlPortal(
  entidad: EntidadPortal,
  entidadId: string,
  email: string
): Promise<InvitarState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") {
    return { error: "No autorizado.", link: null };
  }

  const correo = email.trim().toLowerCase();
  if (!correo || !esEmailValido(correo)) {
    return { error: "Ingresa un email válido.", link: null };
  }

  const tabla = TABLA[entidad];
  const supabase = await createClient();
  const { data: fila, error: errorFila } = await supabase
    .from(tabla)
    .select("id, tipo_persona, nombre, apellido, razon_social, profile_id, estado_invitacion")
    .eq("id", entidadId)
    .single();

  if (errorFila || !fila) {
    return { error: "No se encontró el registro.", link: null };
  }
  if (fila.estado_invitacion === "activo") {
    return { error: "Ya está activo en el portal.", link: null };
  }

  const admin = createAdminClient();
  const reenvio = Boolean(fila.profile_id);

  // Reenvío (ya invitado, aún no confirma): 'invite' fallaría porque el auth
  // user ya existe — se usa 'recovery' para generar un link nuevo y utilizable
  // sobre el mismo usuario, sin duplicar el alta.
  const { data: invite, error: errorInvite } = reenvio
    ? await admin.auth.admin.generateLink({
        type: "recovery",
        email: correo,
        options: { redirectTo: `${sitioUrl()}/auth/confirm?next=/portal/set-password` },
      })
    : await admin.auth.admin.generateLink({
        type: "invite",
        email: correo,
        options: { redirectTo: `${sitioUrl()}/auth/confirm?next=/portal/set-password` },
      });

  if (errorInvite || !invite?.user) {
    return {
      error: errorInvite?.message.includes("already been registered")
        ? "Ese correo ya tiene una cuenta creada."
        : "No se pudo generar la invitación.",
      link: null,
    };
  }

  if (!reenvio) {
    const { error: errorProfile } = await admin.from("profiles").upsert(
      {
        id: invite.user.id,
        empresa_id: profile.empresa_id,
        rol: entidad,
        nombre: nombrePersona(fila),
        email: correo,
      },
      { onConflict: "id" }
    );

    if (errorProfile) {
      return { error: "No se pudo crear el perfil del portal.", link: null };
    }

    const { error: errorVinculo } = await admin
      .from(tabla)
      .update({
        profile_id: invite.user.id,
        estado_invitacion: "invitado",
        invitado_en: new Date().toISOString(),
        invitado_por: profile.id,
      })
      .eq("id", entidadId);

    if (errorVinculo) {
      return { error: "No se pudo vincular la invitación al registro.", link: null };
    }
  }

  revalidatePath(`/${tabla}/${entidadId}`);
  return { error: null, link: invite.properties.action_link };
}

/**
 * Genera una signed URL para ver/descargar una versión de documento desde el
 * portal. A diferencia de `urlVersion` (admin), usa el cliente normal (RLS) —
 * si la política `documentos_storage_select_*` no autoriza a este usuario a
 * ver ese archivo, la consulta simplemente no devuelve fila.
 */
export async function urlVersionPortal(
  versionId: string,
  modo: "ver" | "descargar"
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol === "admin") {
    return { url: null, error: "No autorizado." };
  }

  const supabase = await createClient();
  const { data: version } = await supabase
    .from("documento_versiones")
    .select("storage_path, nombre_archivo")
    .eq("id", versionId)
    .single();
  if (!version) return { url: null, error: "No autorizado o no encontrado." };

  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(
      version.storage_path,
      60,
      modo === "descargar" ? { download: version.nombre_archivo } : undefined
    );

  if (error || !data) return { url: null, error: "No se pudo generar el enlace." };
  return { url: data.signedUrl, error: null };
}
