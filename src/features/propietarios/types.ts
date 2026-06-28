import type { Database } from "@/types/database.types";

export type Propietario =
  Database["public"]["Tables"]["propietarios"]["Row"];
export type PropietarioInsert =
  Database["public"]["Tables"]["propietarios"]["Insert"];
