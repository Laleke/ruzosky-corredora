import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

/**
 * Página de aterrizaje del link de invitación compartido por WhatsApp.
 * A propósito NO consume el token acá — solo cuando la persona toca
 * "Registrarme" se navega a `/auth/confirm` (ver `construirLinkConfirmacion`
 * en `src/features/portal/actions.ts` para el motivo: WhatsApp precarga la
 * URL compartida para la vista previa, y como el token es de un solo uso,
 * esa precarga lo dejaba inválido antes de que la persona lo tocara).
 *
 * Quien ya tiene sesión activa en este navegador (típicamente porque siempre
 * vuelve a abrir la app tocando el mismo link de WhatsApp, en vez de buscar
 * el ícono de la PWA instalada) no necesita "registrarse" de nuevo — se le
 * manda derecho a su app.
 */
export default async function InvitacionPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.rol === "admin" ? "/dashboard" : "/portal");

  const sp = await searchParams;
  const valido = Boolean(sp.token_hash && sp.type);

  const confirmarHref = valido
    ? `/auth/confirm?${new URLSearchParams({
        token_hash: sp.token_hash!,
        type: sp.type!,
        next: sp.next ?? "/portal",
      }).toString()}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-burgundy px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sm font-bold text-burgundy">
          RZK
        </span>
        <div>
          <h1 className="text-xl font-semibold text-white">Bienvenido a RZK Prop</h1>
          <p className="mt-1 text-sm text-white/70">
            Te invitaron a usar el portal para ver tu información. Toca el botón para crear tu
            cuenta.
          </p>
        </div>

        {confirmarHref ? (
          <Link
            href={confirmarHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-burgundy shadow-sm transition-colors hover:bg-white/90"
          >
            Registrarme
          </Link>
        ) : (
          <p className="text-sm text-amber-200">
            Este link no es válido. Pide al administrador que te envíe una invitación nueva.
          </p>
        )}
      </div>
    </main>
  );
}
