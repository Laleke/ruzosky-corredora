import Link from "next/link";
import { Building2, Wallet, Receipt, FileText } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { GuardiaAtras } from "@/components/guardia-atras";
import { misCargos, misPropiedades, misLiquidaciones } from "@/features/portal/queries";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function Kpi({
  icon: Icon,
  label,
  valor,
  sub,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  valor: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-burgundy p-4 shadow-sm transition hover:bg-burgundy-strong"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
        <Icon size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold tracking-tight text-white">{valor}</p>
          <p className="truncate text-sm font-medium text-white/70">{label}</p>
        </div>
        {sub && <p className="truncate text-xs text-white/50">{sub}</p>}
      </div>
    </Link>
  );
}

export default async function PortalHomePage() {
  const profile = await getCurrentProfile();
  const esPropietario = profile?.rol === "propietario";

  return (
    <div className="flex flex-col gap-8">
      <GuardiaAtras />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-canvas-fg">
          Hola, {profile?.nombre ?? "bienvenido"}
        </h1>
        <p className="mt-1 text-sm text-canvas-muted">
          Este es tu portal de solo lectura en RZK Prop.
        </p>
      </div>

      {esPropietario ? <ResumenPropietario /> : <ResumenArrendatario />}
    </div>
  );
}

async function ResumenPropietario() {
  const [propiedades, liquidaciones] = await Promise.all([
    misPropiedades(),
    misLiquidaciones(),
  ]);
  const proximaPendiente = liquidaciones.find((l) => l.estado === "pendiente");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Kpi
        icon={Building2}
        label="Propiedades"
        valor={String(propiedades.length)}
        href="/portal/propiedades"
      />
      <Kpi
        icon={Receipt}
        label="Próxima liquidación"
        valor={proximaPendiente ? clp(proximaPendiente.total_liquidacion) : "—"}
        sub={proximaPendiente ? "Pendiente" : "Sin pendientes"}
        href="/portal/liquidaciones"
      />
      <Kpi
        icon={FileText}
        label="documentos"
        valor="Ver"
        sub="Centro documental"
        href="/portal/documentos"
      />
    </div>
  );
}

async function ResumenArrendatario() {
  const cargos = await misCargos();
  const pendientes = cargos.filter((c) => Number(c.saldo_pendiente) > 0);
  const saldoTotal = pendientes.reduce((acc, c) => acc + Number(c.saldo_pendiente), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Kpi
        icon={Wallet}
        label="Cargos pendientes"
        valor={String(pendientes.length)}
        href="/portal/cargos"
      />
      <Kpi
        icon={Wallet}
        label="Saldo pendiente"
        valor={clp(saldoTotal)}
        href="/portal/cargos"
      />
      <Kpi
        icon={FileText}
        label="documentos"
        valor="Ver"
        sub="Centro documental"
        href="/portal/documentos"
      />
    </div>
  );
}
