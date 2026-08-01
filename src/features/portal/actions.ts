"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esEmailValido, formatearNumeroCuenta } from "@/lib/contacto";
import { normalizarRut } from "@/lib/rut";
import type { PropietarioFormState } from "@/features/propietarios/actions";
import type { PropietarioInsert } from "@/features/propietarios/types";
import type { ArrendatarioFormState } from "@/features/arrendatarios/actions";
import type { ArrendatarioInsert } from "@/features/arrendatarios/types";
import type { EntidadPortal, InvitarState } from "./types";

const TABLA: Record<EntidadPortal, "propietarios" | "arrendatarios"> = {
  propietario: "propietarios",
  arrendatario: "arrendatarios",
};

/**
 * Marca que el usuario ya definió su propia contraseña (llamar justo después
 * de `supabase.auth.updateUser({ password })` en `/portal/set-password`).
 * `profiles` es admin-only por RLS — se usa el cliente admin, pero solo para
 * marcar el PROPIO profile del usuario autenticado (nunca uno ajeno).
 */
export async function marcarPasswordEstablecida(): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autorizado." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ password_set: true })
    .eq("id", profile.id);

  if (error) return { error: "No se pudo guardar el estado de la cuenta." };
  return { error: null };
}

function sitioUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Construye el link que se comparte por WhatsApp. Apunta a una página de
 * aterrizaje propia (`/portal/aceptar-invitacion`), NUNCA directo a
 * `/auth/confirm` — WhatsApp (y otros mensajeros) precargan el link para
 * generar la vista previa, y como el token es de un solo uso, esa precarga
 * lo consume antes de que la persona lo toque de verdad (llegaba pidiendo
 * iniciar sesión). La página de aterrizaje no consume nada por sí sola: solo
 * cuando la persona toca "Registrarme" se dispara la navegación real a
 * `/auth/confirm` con el token.
 *
 * También construye el link nosotros mismos a partir de
 * `properties.hashed_token` — NUNCA `properties.action_link`: ese apunta al
 * endpoint hosteado de Supabase (`/auth/v1/verify`), que al verificar entrega
 * la sesión en un formato que `/auth/confirm` no puede leer.
 */
function construirLinkConfirmacion(
  hashedToken: string,
  type: "invite" | "recovery",
  next: string
): string {
  const params = new URLSearchParams({ token_hash: hashedToken, type, next });
  return `${sitioUrl()}/invitacion?${params.toString()}`;
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
  return {
    error: null,
    link: construirLinkConfirmacion(
      invite.properties.hashed_token,
      reenvio ? "recovery" : "invite",
      "/portal/set-password"
    ),
  };
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

/**
 * Invita a una persona SIN ficha previa: crea el auth user + profile
 * (rol propietario/arrendatario), pero NO crea fila en `propietarios`/
 * `arrendatarios` todavía — eso lo completa la propia persona en
 * `/portal/completar-perfil` la primera vez que entra (ver
 * `completarPerfilPropietario`/`completarPerfilArrendatario`). Pensado para
 * el alta express por WhatsApp: el admin solo necesita email + teléfono.
 */
export async function invitarNuevo(
  entidad: EntidadPortal,
  email: string,
  telefono: string
): Promise<InvitarState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") {
    return { error: "No autorizado.", link: null };
  }

  const correo = email.trim().toLowerCase();
  if (!correo || !esEmailValido(correo)) {
    return { error: "Ingresa un email válido.", link: null };
  }
  if (!telefono.trim()) {
    return { error: "Ingresa un teléfono para poder enviarlo por WhatsApp.", link: null };
  }

  const admin = createAdminClient();

  const { data: invite, error: errorInvite } = await admin.auth.admin.generateLink({
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

  const { error: errorProfile } = await admin.from("profiles").upsert(
    {
      id: invite.user.id,
      empresa_id: profile.empresa_id,
      rol: entidad,
      nombre: null,
      email: correo,
    },
    { onConflict: "id" }
  );
  if (errorProfile) {
    return { error: "No se pudo crear el perfil del portal.", link: null };
  }

  return {
    error: null,
    link: construirLinkConfirmacion(invite.properties.hashed_token, "invite", "/portal/set-password"),
  };
}

function valorOpcional(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * El propio arrendatario completa su ficha la primera vez que entra al
 * portal (invitado por WhatsApp sin ficha previa). Usa el cliente admin
 * (service_role) para insertar — no hay política INSERT de este rol sobre
 * `arrendatarios`, por diseño; la única puerta de alta self-service es esta
 * acción, gateada por rol + comprobar que aún no tiene ficha vinculada.
 */
export async function completarPerfilArrendatario(
  _prev: ArrendatarioFormState,
  formData: FormData
): Promise<ArrendatarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "arrendatario") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("arrendatarios")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (existente) return { error: "Ya completaste tu ficha." };

  const tipo_persona =
    String(formData.get("tipo_persona") ?? "persona_natural") === "persona_juridica"
      ? "persona_juridica"
      : "persona_natural";

  const rutNormalizado = normalizarRut(String(formData.get("rut") ?? ""));
  if (!rutNormalizado) return { error: "RUT inválido." };

  const nombre = valorOpcional(formData, "nombre");
  const apellido = valorOpcional(formData, "apellido");
  const razon_social = valorOpcional(formData, "razon_social");
  if (tipo_persona === "persona_natural" && (!nombre || !apellido)) {
    return { error: "Nombres y apellidos son obligatorios para persona natural." };
  }
  if (tipo_persona === "persona_juridica" && !razon_social) {
    return { error: "La razón social es obligatoria para persona jurídica." };
  }

  const data: Omit<ArrendatarioInsert, "empresa_id"> = {
    tipo_persona,
    rut: rutNormalizado,
    nombre,
    apellido,
    razon_social,
    email: profile.email,
    telefono: valorOpcional(formData, "telefono"),
    direccion: valorOpcional(formData, "direccion"),
    numero: valorOpcional(formData, "numero"),
    comuna: valorOpcional(formData, "comuna"),
    region: valorOpcional(formData, "region"),
  };

  const admin = createAdminClient();
  const { error } = await admin.from("arrendatarios").insert({
    ...data,
    empresa_id: profile.empresa_id,
    profile_id: profile.id,
    estado_invitacion: "activo",
  });

  if (error) {
    return {
      error: error.message.includes("duplicate") || error.message.includes("unique")
        ? "Ya existe un arrendatario con ese RUT en la empresa."
        : "No se pudo guardar tu ficha.",
    };
  }

  redirect("/portal");
}

/** Análogo a `completarPerfilArrendatario`, para el rol propietario (incluye datos bancarios). */
export async function completarPerfilPropietario(
  _prev: PropietarioFormState,
  formData: FormData
): Promise<PropietarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "propietario") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("propietarios")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (existente) return { error: "Ya completaste tu ficha." };

  const tipo_persona =
    String(formData.get("tipo_persona") ?? "persona_natural") === "persona_juridica"
      ? "persona_juridica"
      : "persona_natural";

  const rutNormalizado = normalizarRut(String(formData.get("rut") ?? ""));
  if (!rutNormalizado) return { error: "RUT inválido." };

  const nombre = valorOpcional(formData, "nombre");
  const apellido = valorOpcional(formData, "apellido");
  const razon_social = valorOpcional(formData, "razon_social");
  if (tipo_persona === "persona_natural" && (!nombre || !apellido)) {
    return { error: "Nombres y apellidos son obligatorios para persona natural." };
  }
  if (tipo_persona === "persona_juridica" && !razon_social) {
    return { error: "La razón social es obligatoria para persona jurídica." };
  }

  const rutTitularRaw = valorOpcional(formData, "rut_titular");
  let rut_titular: string | null = null;
  if (rutTitularRaw) {
    const norm = normalizarRut(rutTitularRaw);
    if (!norm) return { error: "RUT del titular de la cuenta inválido." };
    rut_titular = norm;
  }

  const tipoCuentaRaw = valorOpcional(formData, "tipo_cuenta");
  const tipo_cuenta =
    tipoCuentaRaw && ["corriente", "vista", "ahorro", "rut"].includes(tipoCuentaRaw)
      ? (tipoCuentaRaw as PropietarioInsert["tipo_cuenta"])
      : null;

  const data: Omit<PropietarioInsert, "empresa_id"> = {
    tipo_persona,
    rut: rutNormalizado,
    nombre,
    apellido,
    razon_social,
    email: profile.email,
    telefono: valorOpcional(formData, "telefono"),
    direccion: valorOpcional(formData, "direccion"),
    numero: valorOpcional(formData, "numero"),
    comuna: valorOpcional(formData, "comuna"),
    region: valorOpcional(formData, "region"),
    banco: valorOpcional(formData, "banco"),
    tipo_cuenta,
    numero_cuenta: (() => {
      const v = valorOpcional(formData, "numero_cuenta");
      return v ? formatearNumeroCuenta(v) : null;
    })(),
    titular_cuenta: valorOpcional(formData, "titular_cuenta"),
    rut_titular,
  };

  const admin = createAdminClient();
  const { error } = await admin.from("propietarios").insert({
    ...data,
    empresa_id: profile.empresa_id,
    profile_id: profile.id,
    estado_invitacion: "activo",
  });

  if (error) {
    return {
      error: error.message.includes("duplicate") || error.message.includes("unique")
        ? "Ya existe un propietario con ese RUT en la empresa."
        : "No se pudo guardar tu ficha.",
    };
  }

  redirect("/portal");
}
