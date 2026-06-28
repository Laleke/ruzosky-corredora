import Link from "next/link";
import { ui } from "@/components/ui";

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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm text-muted">{descripcion}</p>
        )}
      </div>
      {accion && (
        <Link href={accion.href} className={ui.btnPrimary}>
          {accion.label}
        </Link>
      )}
    </div>
  );
}
