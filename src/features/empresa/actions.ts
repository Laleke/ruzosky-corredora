"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EmpresaFormState = { error: string | null; exito: boolean };

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Datos de transferencia que aparecen en el estado de cuenta enviado al
 * arrendatario. Viven en `empresas` (no en el código) porque cambian sin
 * relación con los despliegues — un número de cuenta hardcodeado obligaría a
 * un redeploy para corregirlo.
 */
export async function actualizarDatosCobranza(
  _prev: EmpresaFormState,
  formData: FormData
): Promise<EmpresaFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "admin") {
    return { error: "No autorizado.", exito: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresas")
    .update({
      banco: texto(formData, "banco"),
      tipo_cuenta: texto(formData, "tipo_cuenta"),
      numero_cuenta: texto(formData, "numero_cuenta"),
      titular_nombre: texto(formData, "titular_nombre"),
      rut_titular: texto(formData, "rut_titular"),
      email_pagos: texto(formData, "email_pagos"),
    })
    .eq("id", profile.empresa_id);

  if (error) return { error: "No se pudieron guardar los datos.", exito: false };

  revalidatePath("/configuracion");
  revalidatePath("/cobros/estados-cuenta");
  return { error: null, exito: true };
}
