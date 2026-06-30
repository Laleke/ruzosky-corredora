/**
 * Roles del sistema. Deben coincidir con el enum `rol_usuario` en la BD.
 */
export const ROLES = {
  ADMIN: "admin",
  PROPIETARIO: "propietario",
  ARRENDATARIO: "arrendatario",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const APP_NAME = "Ruzosky Prop";
