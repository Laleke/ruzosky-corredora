"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { normalizarRut } from "@/lib/rut";
import type { PropietarioInsert } from "./types";

export type PropietarioFormState = { error: string | null };

function valorOpcional(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Valida y arma el payload desde el formulario.
 * Devuelve {error} si la validación de frontera falla.
 */
function parse(
  formData: FormData
): { data: Omit<PropietarioInsert, "empresa_id"> } | { error: string } {
  const tipo_persona =
    String(formData.get("tipo_persona") ?? "persona_natural") ===
    "persona_juridica"
      ? "persona_juridica"
      : "persona_natural";

  const rutNormalizado = normalizarRut(String(formData.get("rut") ?? ""));
  if (!rutNormalizado) return { error: "RUT inválido." };

  const nombre = valorOpcional(formData, "nombre");
  const apellido = valorOpcional(formData, "apellido");
  const razon_social = valorOpcional(formData, "razon_social");

  if (tipo_persona === "persona_natural" && !nombre) {
    return { error: "El nombre es obligatorio para persona natural." };
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
    tipoCuentaRaw &&
    ["corriente", "vista", "ahorro", "rut"].includes(tipoCuentaRaw)
      ? (tipoCuentaRaw as PropietarioInsert["tipo_cuenta"])
      : null;

  return {
    data: {
      tipo_persona,
      rut: rutNormalizado,
      nombre,
      apellido,
      razon_social,
      email: valorOpcional(formData, "email"),
      telefono: valorOpcional(formData, "telefono"),
      direccion: valorOpcional(formData, "direccion"),
      comuna: valorOpcional(formData, "comuna"),
      region: valorOpcional(formData, "region"),
      banco: valorOpcional(formData, "banco"),
      tipo_cuenta,
      numero_cuenta: valorOpcional(formData, "numero_cuenta"),
      titular_cuenta: valorOpcional(formData, "titular_cuenta"),
      rut_titular,
    },
  };
}

function traducirError(message: string): string {
  if (message.includes("duplicate") || message.includes("unique")) {
    return "Ya existe un propietario con ese RUT en la empresa.";
  }
  return "No se pudo guardar el propietario.";
}

export async function crearPropietario(
  _prev: PropietarioFormState,
  formData: FormData
): Promise<PropietarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") {
    return { error: "No autorizado." };
  }

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("propietarios")
    .insert({ ...parsed.data, empresa_id: profile.empresa_id });

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/propietarios");
  redirect("/propietarios");
}

export async function actualizarPropietario(
  id: string,
  _prev: PropietarioFormState,
  formData: FormData
): Promise<PropietarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") {
    return { error: "No autorizado." };
  }

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("propietarios")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/propietarios");
  redirect("/propietarios");
}

/** Baja/alta lógica (soft-delete). */
export async function cambiarActivoPropietario(id: string, activo: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("propietarios").update({ activo }).eq("id", id);
  revalidatePath("/propietarios");
}
