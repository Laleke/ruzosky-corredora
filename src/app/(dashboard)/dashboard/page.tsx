import Link from "next/link";
import {
  Building2,
  KeyRound,
  FileCheck2,
  Wallet,
  AlertTriangle,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getDashboardStats, getTareasPendientes } from "@/features/dashboard/queries";
import { ui } from "@/components/ui";

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
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  valor: string;
  sub?: string;
  alerta?: boolean;
}) {
  return (
    <div className={`${ui.card} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            alerta ? "bg-amber-50 text-amber-600" : "bg-burgundy-50 text-burgundy"
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {valor}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

const ACCESOS = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/contratos", label: "Contratos" },
  { href: "/cobros", label: "Cobros y pagos" },
];

export default async function DashboardPage() {
  const [profile, stats, tareas] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
    getTareasPendientes(),
  ]);
  const tareasConPendiente = tareas.filter((t) => t.cantidad > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Hola, {profile?.nombre ?? "administrador"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Resumen general de la corredora.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Building2}
          label="Propiedades"
          valor={String(stats.propiedadesTotal)}
          sub={`${stats.propiedadesArrendadas} arrendadas`}
        />
        <Kpi
          icon={FileCheck2}
          label="Contratos vigentes"
          valor={String(stats.contratosVigentes)}
        />
        <Kpi
          icon={Wallet}
          label="Deuda pendiente"
          valor={clp(stats.deudaPendiente)}
        />
        <Kpi
          icon={AlertTriangle}
          label="Cargos morosos"
          valor={String(stats.cargosMorosos)}
          sub="vencidos con saldo"
          alerta={stats.cargosMorosos > 0}
        />
      </div>

      <div className={`${ui.card} p-6`}>
        <div className="mb-4 flex items-center gap-2 text-ink">
          <ListChecks size={18} className="text-burgundy" />
          <h2 className="font-semibold">Tareas pendientes</h2>
        </div>
        {tareasConPendiente.length === 0 ? (
          <p className="text-sm text-muted">No hay tareas pendientes por ahora.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {tareasConPendiente.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2 text-sm text-ink">
                  {t.alerta && <AlertTriangle size={15} className="text-amber-600" />}
                  {t.label}
                </span>
                <Link
                  href={t.href}
                  className="flex items-center gap-1 text-sm font-medium text-burgundy hover:underline"
                >
                  {t.cantidad}
                  <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {TAREAS_PROXIMAMENTE.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Próximamente: {TAREAS_PROXIMAMENTE.join("; ")}.
          </p>
        )}
      </div>

      <div className={`${ui.card} p-6`}>
        <div className="mb-4 flex items-center gap-2 text-ink">
          <KeyRound size={18} className="text-burgundy" />
          <h2 className="font-semibold">Accesos rápidos</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ACCESOS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-burgundy/40 hover:bg-burgundy-50/40"
            >
              {a.label}
              <ArrowRight
                size={16}
                className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-burgundy"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
