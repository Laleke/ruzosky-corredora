import Link from "next/link";
import { Plus, MessageCircle } from "lucide-react";

export function PageHeader({
  titulo,
  descripcion,
  accion,
  accionSecundaria,
}: {
  titulo: string;
  descripcion?: string;
  accion?: { href: string; label: string };
  /** Acción alternativa de alta (ej. "Invitar por WhatsApp") — pill con ícono + texto. */
  accionSecundaria?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-canvas-fg">
            {titulo}
          </h1>
          {accion && (
            <Link
              href={accion.href}
              aria-label={accion.label}
              title={accion.label}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-burgundy text-white transition-colors hover:bg-burgundy-strong"
            >
              <Plus size={16} strokeWidth={2.5} />
            </Link>
          )}
        </div>
        {descripcion && (
          <p className="mt-1 text-sm text-canvas-muted">{descripcion}</p>
        )}
      </div>
      {accionSecundaria && (
        <Link
          href={accionSecundaria.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-canvas-fg transition-colors hover:bg-white/20"
        >
          <MessageCircle size={15} /> {accionSecundaria.label}
        </Link>
      )}
    </div>
  );
}
