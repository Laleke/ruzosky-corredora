import type { Database } from "@/types/database.types";

export type Arrendatario =
  Database["public"]["Tables"]["arrendatarios"]["Row"];
export type ArrendatarioInsert =
  Database["public"]["Tables"]["arrendatarios"]["Insert"];
