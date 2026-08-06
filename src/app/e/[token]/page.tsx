import type { Metadata } from "next";
import { estadoCuentaPorToken } from "@/features/estado-cuenta/token-queries";
import { EstadoCuentaDocumento } from "@/features/estado-cuenta/documento";

export const metadata: Metadata = {
  title: "Estado de cuenta",
  // Un link de deuda compartido por WhatsApp no debe terminar indexado.
  robots: { index: false, follow: false },
};

/**
 * Estado de cuenta accesible sin sesión, para el arrendatario que recibe el
 * link por WhatsApp. El token es la credencial: si no existe, fue revocado o
 * expiró, se muestra el mismo mensaje neutro (no se distingue el motivo).
 */
export default async function EstadoCuentaPublicoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const datos = await estadoCuentaPorToken(token);

  if (!datos) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-canvas-fg">Link no disponible</h1>
        <p className="text-sm text-canvas-muted">
          Este enlace ya no es válido. Pídele a tu administrador que te envíe uno nuevo.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 sm:py-10 print:p-0">
      <EstadoCuentaDocumento datos={datos} />
    </main>
  );
}
