"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularCargo } from "@/features/cobros/actions";
import type { MedioPago } from "@/types/database.types";
import type { SolicitudFormState } from "./types";

const MEDIOS: MedioPago[] = ["transferencia", "efectivo", "cheque", "tarjeta", "otro"];
const MAX_TAMANO_BYTES = 25 * 1024 * 1024;

function decimal(formData: FormData, campo: string): number | null {
  const v = String(formData.get(campo) ?? "").trim();
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/**
 * El arrendatario reporta un pago desde el portal. Queda "pendiente" — NO
 * crea un `pago` real todavía (eso solo pasa al aprobar, ver
 * `aprobarSolicitudPago`). El comprobante (si lo adjunta) se sube server-side
 * con el cliente admin porque el arrendatario no tiene permiso de escribir en
 * Storage directamente (por diseño del portal, ver migración 0015).
 */
export async function crearSolicitudPago(
  cargoId: string,
  _prev: SolicitudFormState,
  formData: FormData
): Promise<SolicitudFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "arrendatario") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: arrendatario } = await supabase
    .from("arrendatarios")
    .select("id")
    .eq("profile_id", profile.id)
    .single();
  if (!arrendatario) return { error: "No se encontró tu ficha de arrendatario." };

  // RLS (`cargos_select_arrendatario`) ya filtra: si el cargo no es de un
  // contrato suyo, esta consulta simplemente no devuelve fila.
  const { data: cargo } = await supabase
    .from("cargos")
    .select("id, saldo_pendiente")
    .eq("id", cargoId)
    .single();
  if (!cargo) return { error: "No autorizado para este cargo." };

  const monto = decimal(formData, "monto_pagado");
  if (monto === null || monto <= 0) {
    return { error: "El monto del pago debe ser mayor a 0." };
  }
  if (monto > Number(cargo.saldo_pendiente) + 0.01) {
    return {
      error: `El monto supera el saldo pendiente ($${Number(cargo.saldo_pendiente).toLocaleString("es-CL")}).`,
    };
  }

  const fecha_pago = texto(formData, "fecha_pago") ?? new Date().toISOString().slice(0, 10);
  const medioRaw = texto(formData, "medio_pago");
  const medio_pago =
    medioRaw && (MEDIOS as string[]).includes(medioRaw) ? (medioRaw as MedioPago) : null;

  let comprobante: { path: string; nombre: string; tamano: number; mime: string | null } | null = null;
  const archivo = formData.get("comprobante");
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > MAX_TAMANO_BYTES) {
      return { error: "El comprobante supera el tamaño máximo (25 MB)." };
    }
    const admin = createAdminClient();
    const ext = archivo.name.includes(".")
      ? archivo.name.slice(archivo.name.lastIndexOf(".") + 1).toLowerCase()
      : "";
    const path = `${profile.empresa_id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
    const { error: errUp } = await admin.storage.from("documentos").upload(path, archivo, {
      contentType: archivo.type || undefined,
      upsert: false,
    });
    if (errUp) return { error: "No se pudo subir el comprobante." };
    comprobante = { path, nombre: archivo.name, tamano: archivo.size, mime: archivo.type || null };
  }

  const { error } = await supabase.from("solicitudes_pago").insert({
    empresa_id: profile.empresa_id,
    cargo_id: cargoId,
    arrendatario_id: arrendatario.id,
    monto,
    fecha_pago,
    medio_pago,
    referencia: texto(formData, "referencia"),
    observaciones: texto(formData, "observaciones"),
    comprobante_storage_path: comprobante?.path ?? null,
    comprobante_nombre_archivo: comprobante?.nombre ?? null,
    comprobante_tamano_bytes: comprobante?.tamano ?? null,
    comprobante_mime_type: comprobante?.mime ?? null,
  });

  if (error) return { error: "No se pudo enviar la solicitud." };

  revalidatePath("/portal/cargos");
  redirect("/portal/cargos");
}

/**
 * Aprueba una solicitud: crea el `pago` real (mismo efecto que
 * `registrarPago`) y recalcula el cargo. Autorizado para admin, o para el
 * propietario dueño de la propiedad del cargo — esto último ya lo garantiza
 * la política RLS `solicitudes_pago_select_propietario` en el select inicial
 * (si no es suyo, simplemente no devuelve fila).
 */
export async function aprobarSolicitudPago(solicitudId: string): Promise<SolicitudFormState> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.rol !== "admin" && profile.rol !== "propietario")) {
    return { error: "No autorizado." };
  }

  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("solicitudes_pago")
    .select("*")
    .eq("id", solicitudId)
    .single();
  if (!solicitud) return { error: "Solicitud no encontrada." };
  if (solicitud.estado !== "pendiente") return { error: "Esta solicitud ya fue revisada." };

  const admin = createAdminClient();

  let documentoId: string | null = null;
  if (solicitud.comprobante_storage_path) {
    const { data: cargoInfo } = await admin
      .from("cargos")
      .select("contrato_id")
      .eq("id", solicitud.cargo_id)
      .single();

    const { data: doc, error: errDoc } = await admin
      .from("documentos")
      .insert({
        empresa_id: solicitud.empresa_id,
        nombre: "Comprobante de pago (solicitud arrendatario)",
        categoria: "comprobante_pago",
        contrato_id: cargoInfo?.contrato_id ?? null,
        version_actual: 1,
      })
      .select("id")
      .single();

    if (!errDoc && doc) {
      await admin.from("documento_versiones").insert({
        empresa_id: solicitud.empresa_id,
        documento_id: doc.id,
        version: 1,
        storage_path: solicitud.comprobante_storage_path,
        nombre_archivo: solicitud.comprobante_nombre_archivo ?? "comprobante",
        tamano_bytes: solicitud.comprobante_tamano_bytes ?? 0,
        mime_type: solicitud.comprobante_mime_type,
      });
      documentoId = doc.id;
    }
  }

  const { data: pago, error: errPago } = await admin
    .from("pagos")
    .insert({
      empresa_id: solicitud.empresa_id,
      cargo_id: solicitud.cargo_id,
      fecha_pago: solicitud.fecha_pago,
      monto_pagado: solicitud.monto,
      medio_pago: solicitud.medio_pago,
      referencia: solicitud.referencia,
      observaciones: solicitud.observaciones,
      documento_id: documentoId,
    })
    .select("id")
    .single();

  if (errPago || !pago) return { error: "No se pudo generar el pago." };

  await recalcularCargo(admin, solicitud.cargo_id);

  await admin
    .from("solicitudes_pago")
    .update({
      estado: "aprobada",
      pago_id: pago.id,
      revisado_por: profile.id,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", solicitudId);

  revalidatePath(`/cobros/${solicitud.cargo_id}`);
  revalidatePath("/portal/solicitudes");
  revalidatePath("/cobros/solicitudes");
  return { error: null };
}

/** Rechaza una solicitud con motivo — mismo gate de autorización que aprobar. */
export async function rechazarSolicitudPago(
  solicitudId: string,
  motivo: string
): Promise<SolicitudFormState> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.rol !== "admin" && profile.rol !== "propietario")) {
    return { error: "No autorizado." };
  }

  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("solicitudes_pago")
    .select("id, estado")
    .eq("id", solicitudId)
    .single();
  if (!solicitud) return { error: "Solicitud no encontrada." };
  if (solicitud.estado !== "pendiente") return { error: "Esta solicitud ya fue revisada." };

  const admin = createAdminClient();
  await admin
    .from("solicitudes_pago")
    .update({
      estado: "rechazada",
      motivo_rechazo: motivo.trim() || "Sin motivo especificado.",
      revisado_por: profile.id,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", solicitudId);

  revalidatePath("/portal/solicitudes");
  revalidatePath("/cobros/solicitudes");
  return { error: null };
}
