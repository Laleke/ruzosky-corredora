import Link from "next/link";
import { Plus } from "lucide-react";

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: { href: string; label: string };
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
    </div>
  );
}
