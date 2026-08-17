import Link from "next/link";
import {
  Building2,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ListChecks,
  Receipt,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { GuardiaAtras } from "@/components/guardia-atras";
import { getDashboardStats, getTareasPendientes } from "@/features/dashboard/queries";

/** Indicadores de futuro desarrollo: la data o la regla de negocio aún no existen. */
const TAREAS_PROXIMAMENTE = [
  "Documentos sin respaldo obligatorio (requiere definir qué documento es obligatorio por tipo de propiedad)",
];

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function Kpi({
  icon: Icon,
  label,
  valor,
  sub,
  alerta,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  valor: string;
  sub?: string;
  alerta?: boolean;
  /** Sin href: tarjeta informativa, no clicable (sin flecha ni hover). */
  href?: string;
}) {
  const contenido = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          alerta ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-white"
        }`}
      >
        <Icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold tracking-tight text-white">{valor}</p>
          <p className="truncate text-sm font-medium text-white/70">{label}</p>
        </div>
        {sub && <p className="truncate text-xs text-white/50">{sub}</p>}
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-burgundy p-4 shadow-sm">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl bg-burgundy p-4 shadow-sm transition hover:bg-burgundy-strong"
    >
      {contenido}
      <ArrowUpRight
        size={16}
        className="shrink-0 text-white/40 transition-colors group-hover:text-white"
      />
    </Link>
  );
}

export default async function DashboardPage() {
  const [profile, stats, tareas] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getTareasPendientes(),
  ]);
  const tareasConPendiente = tareas.filter((t) => t.cantidad > 0);

  return (
    <div className="flex flex-col gap-8">
      <GuardiaAtras />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-canvas-fg">
          Hola, {profile?.nombre ?? "administrador"}
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Resumen general de la corredora. Toca una tarjeta para ver el detalle.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Building2}
          label="Propiedades"
          valor={String(stats.propiedadesTotal)}
          sub={`${stats.propiedadesArrendadas} arrendadas`}
          href="/propiedades"
        />
        <Kpi
          icon={Wallet}
          label="Deuda vencida"
          valor={clp(stats.deudaVencida)}
          alerta={stats.deudaVencida > 0}
          href="/cobros"
        />
        <Kpi
          icon={AlertTriangle}
          label="Cargos morosos"
          valor={String(stats.cargosMorosos)}
          sub="vencidos con saldo"
          alerta={stats.cargosMorosos > 0}
          href="/cobros"
        />
        <Kpi
          icon={Receipt}
          label="Pagos recibidos"
          valor={clp(stats.pagosRecibidosMesMonto)}
          sub="de arrendatarios, período actual"
          href="/cobros"
        />
      </div>

      {tareasConPendiente.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-canvas-fg">
            <ListChecks size={18} />
            <h2 className="font-semibold">Tareas pendientes</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tareasConPendiente.map((t) => (
              <Kpi
                key={t.key}
                icon={t.alerta ? AlertTriangle : ListChecks}
                label={t.label}
                valor={String(t.cantidad)}
                alerta={t.alerta}
                href={t.href}
              />
            ))}
          </div>
          {TAREAS_PROXIMAMENTE.length > 0 && (
            <p className="mt-3 text-xs text-canvas-muted">
              Próximamente: {TAREAS_PROXIMAMENTE.join("; ")}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
