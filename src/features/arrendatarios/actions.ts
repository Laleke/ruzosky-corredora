"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { normalizarRut } from "@/lib/rut";
import type { ArrendatarioInsert } from "./types";

export type ArrendatarioFormState = { error: string | null };

function valorOpcional(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function parse(
  formData: FormData
): { data: Omit<ArrendatarioInsert, "empresa_id"> } | { error: string } {
  const tipo_persona =
    String(formData.get("tipo_persona") ?? "persona_natural") ===
    "persona_juridica"
      ? "persona_juridica"
      : "persona_natural";

  const rutNormalizado = normalizarRut(String(formData.get("rut") ?? ""));
  if (!rutNormalizado) return { error: "RUT inválido." };

  const nombre = valorOpcional(formData, "nombre");
  const razon_social = valorOpcional(formData, "razon_social");

  if (tipo_persona === "persona_natural" && !nombre) {
    return { error: "El nombre es obligatorio para persona natural." };
  }
  if (tipo_persona === "persona_juridica" && !razon_social) {
    return { error: "La razón social es obligatoria para persona jurídica." };
  }

  return {
    data: {
      tipo_persona,
      rut: rutNormalizado,
      nombre,
      apellido: valorOpcional(formData, "apellido"),
      razon_social,
      email: valorOpcional(formData, "email"),
      telefono: valorOpcional(formData, "telefono"),
      direccion: valorOpcional(formData, "direccion"),
      comuna: valorOpcional(formData, "comuna"),
      region: valorOpcional(formData, "region"),
    },
  };
}

function traducirError(message: string): string {
  if (message.includes("duplicate") || message.includes("unique")) {
    return "Ya existe un arrendatario con ese RUT en la empresa.";
  }
  return "No se pudo guardar el arrendatario.";
}

export async function crearArrendatario(
  _prev: ArrendatarioFormState,
  formData: FormData
): Promise<ArrendatarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("arrendatarios")
    .insert({ ...parsed.data, empresa_id: profile.empresa_id });

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/arrendatarios");
  redirect("/arrendatarios");
}

export async function actualizarArrendatario(
  id: string,
  _prev: ArrendatarioFormState,
  formData: FormData
): Promise<ArrendatarioFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return { error: "No autorizado." };

  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("arrendatarios")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: traducirError(error.message) };

  revalidatePath("/arrendatarios");
  redirect("/arrendatarios");
}

export async function cambiarActivoArrendatario(id: string, activo: boolean) {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") return;

  const supabase = await createClient();
  await supabase.from("arrendatarios").update({ activo }).eq("id", id);
  revalidatePath("/arrendatarios");
}
