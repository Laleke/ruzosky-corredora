import { notFound } from "next/navigation";
import Link from "next/link";
import {
  estadoCuentaDeArrendatario,
  linkVigenteDeArrendatario,
} from "@/features/estado-cuenta/queries";
import { EstadoCuentaDocumento } from "@/features/estado-cuenta/documento";
import { AccionesEstadoCuenta } from "@/features/estado-cuenta/acciones";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function EstadoCuentaArrendatarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [datos, token] = await Promise.all([
    estadoCuentaDeArrendatario(id),
    linkVigenteDeArrendatario(id),
  ]);
  if (!datos) notFound();

  const sinDatosBancarios = !datos.empresa.banco || !datos.empresa.numero_cuenta;

  return (
    <div className="flex flex-col gap-5">
      <div className="no-print">
        <Link href="/cobros/estados-cuenta" className="text-sm text-canvas-muted hover:text-canvas-fg">
          ← Volver a estados de cuenta
        </Link>
      </div>

      {sinDatosBancarios && (
        <p className="no-print rounded-lg bg-amber-500/20 px-4 py-2.5 text-sm text-amber-200">
          El informe no muestra la sección &quot;Cómo regularizar&quot; porque faltan los datos
          bancarios de la corredora.{" "}
          <Link href="/configuracion" className="font-medium underline">
            Configurarlos ahora
          </Link>
          .
        </p>
      )}

      <AccionesEstadoCuenta
        arrendatarioId={id}
        nombre={datos.arrendatario.nombre}
        telefono={datos.arrendatario.telefono}
        total={datos.total}
        cantidadCargos={datos.cargos.length}
        diasMora={datos.dias_mora_maxima}
        propiedad={datos.cargos[0]?.propiedad_label ?? null}
        tokenInicial={token}
        baseUrl={baseUrl()}
      />

      <EstadoCuentaDocumento datos={datos} />
    </div>
  );
}
