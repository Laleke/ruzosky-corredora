import Link from "next/link";
import {
  Building2,
  KeyRound,
  FileCheck2,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getDashboardStats } from "@/features/dashboard/queries";
import { ui } from "@/components/ui";

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
  const [profile, stats] = await Promise.all([
    getCurrentProfile(),
    getDashboardStats(),
  ]);

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
