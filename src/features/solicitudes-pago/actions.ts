"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularCargo } from "@/features/cobros/actions";
import { nombreComprobante } from "@/features/cobros/constants";
import { notificarAdmins } from "@/features/notificaciones/push";
import { MAX_TAMANO_BYTES } from "@/features/documentos/constants";
import type { MedioPago } from "@/types/database.types";
import type { SolicitudFormState } from "./types";

const MEDIOS: MedioPago[] = ["transferencia", "efectivo", "cheque", "tarjeta", "otro"];

function decimal(formData: FormData, campo: string): number | null {
  const v = String(formData.get(campo) ?? "").trim();
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function montoFormateado(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

export type ComprobanteSubido =
  | { path: string; nombre: string; tamano: number; mime: string | null }
  | { error: string };

/**
 * Sube el comprobante apenas el arrendatario lo selecciona (no espera al
 * submit final del wizard). El arrendatario no tiene permiso de escribir en
 * Storage directamente (por diseño del portal, ver migración 0015), por eso
 * usa el cliente admin — la autorización real está en el chequeo de rol de
 * abajo, no en RLS de Storage.
 *
 * Subir de inmediato (en vez de arrastrar el `File` crudo hasta el submit
 * final) evita que el navegador quede con un input de archivo "vivo" en un
 * paso intermedio del wizard — en el celular, abrir la cámara/galería desde
 * ahí llegó a disparar un submit del formulario antes de que el usuario
 * terminara de elegir el archivo.
 */
export async function subirComprobanteSolicitud(formData: FormData): Promise<ComprobanteSubido> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "arrendatario") return { error: "No autorizado." };

  const archivo = formData.get("comprobante");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }
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

  return { path, nombre: archivo.name, tamano: archivo.size, mime: archivo.type || null };
}

/**
 * El arrendatario reporta un pago desde el portal. Queda "pendiente" — NO
 * crea un `pago` real todavía (eso solo pasa al aprobar, ver
 * `aprobarSolicitudPago`). El comprobante (si lo adjuntó) ya fue subido antes
 * por `subirComprobanteSolicitud` — acá solo se leen sus datos.
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
    .select("id, tipo_persona, nombre, apellido, razon_social")
    .eq("profile_id", profile.id)
    .single();
  if (!arrendatario) return { error: "No se encontró tu ficha de arrendatario." };

  const nombreSolicitante =
    arrendatario.tipo_persona === "persona_juridica"
      ? arrendatario.razon_social ?? "Un arrendatario"
      : [arrendatario.nombre, arrendatario.apellido].filter(Boolean).join(" ") ||
        "Un arrendatario";

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
  // No se bloquea si supera el saldo pendiente (puede ser un abono adelantado,
  // un error del arrendatario a corregir, etc.) — se deja pasar, pero se marca
  // para que el propietario/admin la revise con más cuidado al aprobar.
  const excedeSaldo = monto > Number(cargo.saldo_pendiente) + 0.01;

  const fecha_pago = texto(formData, "fecha_pago") ?? new Date().toISOString().slice(0, 10);
  const medioRaw = texto(formData, "medio_pago");
  const medio_pago =
    medioRaw && (MEDIOS as string[]).includes(medioRaw) ? (medioRaw as MedioPago) : null;

  const { error } = await supabase.from("solicitudes_pago").insert({
    empresa_id: profile.empresa_id,
    cargo_id: cargoId,
    arrendatario_id: arrendatario.id,
    monto,
    fecha_pago,
    medio_pago,
    referencia: texto(formData, "referencia"),
    observaciones: texto(formData, "observaciones"),
    excede_saldo: excedeSaldo,
    saldo_pendiente_al_crear: cargo.saldo_pendiente,
    comprobante_storage_path: texto(formData, "comprobante_path"),
    comprobante_nombre_archivo: texto(formData, "comprobante_nombre"),
    comprobante_tamano_bytes: decimal(formData, "comprobante_tamano"),
    comprobante_mime_type: texto(formData, "comprobante_mime"),
  });

  if (error) return { error: "No se pudo enviar la solicitud." };

  // Aviso al admin. `notificarAdmins` nunca lanza: si el push falla, la
  // solicitud ya quedó guardada y el arrendatario no debe ver un error por
  // algo que no depende de él.
  await notificarAdmins(profile.empresa_id, {
    titulo: "Pago informado",
    cuerpo: `${nombreSolicitante} informó un pago de ${montoFormateado(monto)}.`,
    url: "/cobros/solicitudes",
    tag: "solicitud-pago",
  });

  revalidatePath("/portal/cargos");
  redirect("/portal/cargos");
}

/**
 * El arrendatario edita su propia solicitud MIENTRAS siga "pendiente" — la
 * política RLS `solicitudes_pago_update_arrendatario` (migración 0033) es la
 * que realmente bloquea la escritura si ya fue aprobada/rechazada o no es
 * suya; el chequeo de estado acá es solo para devolver un mensaje claro en
 * vez de un error genérico de Postgres.
 */
export async function editarSolicitudPago(
  solicitudId: string,
  cargoId: string,
  _prev: SolicitudFormState,
  formData: FormData
): Promise<SolicitudFormState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.rol !== "arrendatario") return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("solicitudes_pago")
    .select("id, estado")
    .eq("id", solicitudId)
    .single();
  if (!solicitud) return { error: "No autorizado o no encontrada." };
  if (solicitud.estado !== "pendiente") {
    return { error: "Esta solicitud ya fue revisada — ya no se puede editar." };
  }

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
  const excedeSaldo = monto > Number(cargo.saldo_pendiente) + 0.01;

  const fecha_pago = texto(formData, "fecha_pago") ?? new Date().toISOString().slice(0, 10);
  const medioRaw = texto(formData, "medio_pago");
  const medio_pago =
    medioRaw && (MEDIOS as string[]).includes(medioRaw) ? (medioRaw as MedioPago) : null;

  const { error } = await supabase
    .from("solicitudes_pago")
    .update({
      monto,
      fecha_pago,
      medio_pago,
      referencia: texto(formData, "referencia"),
      observaciones: texto(formData, "observaciones"),
      excede_saldo: excedeSaldo,
      comprobante_storage_path: texto(formData, "comprobante_path"),
      comprobante_nombre_archivo: texto(formData, "comprobante_nombre"),
      comprobante_tamano_bytes: decimal(formData, "comprobante_tamano"),
      comprobante_mime_type: texto(formData, "comprobante_mime"),
    })
    .eq("id", solicitudId);

  if (error) return { error: "No se pudo guardar la edición." };

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
    // Se trae también la propiedad y el concepto: el comprobante debe quedar
    // ligado a `propiedad_id`, no solo al contrato, o el listado de Documentos
    // lo esconde en cuanto se filtra por propiedad/arrendatario (ese filtro
    // resuelve por propiedad y los documentos sin ella caen fuera). El nombre
    // lleva concepto y período porque, si no, todos los comprobantes se llaman
    // igual y no hay forma de saber a cuál pago corresponde.
    const { data: cargoInfo } = await admin
      .from("cargos")
      .select("contrato_id, tipo_cargo, periodo, contratos(propiedad_id)")
      .eq("id", solicitud.cargo_id)
      .single();

    const propiedadId =
      (cargoInfo as { contratos?: { propiedad_id: string } | null } | null)?.contratos
        ?.propiedad_id ?? null;

    const { data: doc, error: errDoc } = await admin
      .from("documentos")
      .insert({
        empresa_id: solicitud.empresa_id,
        nombre: nombreComprobante(cargoInfo?.tipo_cargo, cargoInfo?.periodo),
        categoria: "comprobante_pago",
        contrato_id: cargoInfo?.contrato_id ?? null,
        propiedad_id: propiedadId,
        arrendatario_id: solicitud.arrendatario_id,
        fecha_documento: solicitud.fecha_pago,
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

/**
 * Signed URL (60s) del comprobante adjuntado a una solicitud pendiente de
 * revisar. Usa el cliente admin para leer Storage (el path no está ligado
 * todavía a un `documento_versiones` — eso recién se crea al aprobar, ver
 * `aprobarSolicitudPago`), pero primero confirma con el cliente normal que
 * el solicitante puede ver esta fila (RLS `solicitudes_pago_select_*`).
 */
export async function getComprobanteUrlSolicitud(
  solicitudId: string
): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile();
  if (
    !profile ||
    (profile.rol !== "admin" && profile.rol !== "propietario" && profile.rol !== "arrendatario")
  ) {
    return { url: null, error: "No autorizado." };
  }

  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("solicitudes_pago")
    .select("comprobante_storage_path, comprobante_nombre_archivo")
    .eq("id", solicitudId)
    .single();
  if (!solicitud) return { url: null, error: "No autorizado o no encontrado." };
  if (!solicitud.comprobante_storage_path) {
    return { url: null, error: "Esta solicitud no tiene comprobante adjunto." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("documentos")
    .createSignedUrl(solicitud.comprobante_storage_path, 60);

  if (error || !data) return { url: null, error: "No se pudo generar el enlace." };
  return { url: data.signedUrl, error: null };
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
