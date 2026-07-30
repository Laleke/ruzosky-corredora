"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Botón "Volver" con router.back() — preserva filtros/estado de la pantalla de origen. */
export function BotonVolver({ label = "Volver" }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
    >
      <ArrowLeft size={15} /> {label}
    </button>
  );
}
