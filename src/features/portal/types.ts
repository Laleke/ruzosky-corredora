import type { Database } from "@/types/database.types";

export type EntidadPortal = "propietario" | "arrendatario";
export type EstadoInvitacion = Database["public"]["Enums"]["estado_invitacion"];

export type InvitarState = { error: string | null; link: string | null };
